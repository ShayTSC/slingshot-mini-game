import { createMachine, interpret } from "xstate";
import { collections, logger } from "./main";
import { IMiner } from "./models/miners";
import { sleep } from "./utils";
import BigNumber from "bignumber.js";

const MinerStateMap = ["Idle", "Traveling", "Mining", "Transferring"];

// Map stores asteroid_name => [miner_name] relations
const AsteroidMinerMap: { [key: string]: number[] } = {};

export default class EventLoop {
  miners: IMiner[];
  machines: any[];

  constructor() {
    this.miners = [];
    this.machines = [];
  }

  async travel(miner: IMiner) {
    try {
      const planet = await collections.planets?.findOne({
        id: miner.planetId,
      });

      // List all asteroids with minerals amount > 0
      // Theoretically this algo should calculate with both distance
      // And minerals amount, but for now we just use distance
      const asteroids = await collections.asteroids
        ?.find({
          minerals: {
            $gt: 0,
          },
        })
        .toArray();

      const distances: number[] = [];

      if (planet && asteroids) {
        for (let a of asteroids) {
          const distance = new BigNumber(a.position.x)
            .minus(planet.position.x)
            .pow(2)
            .plus(new BigNumber(a.position.y).minus(planet.position.y).pow(2))
            .sqrt();
          distances.push(Number(distance.toFixed(0)));
        }
        const index = distances.findIndex((d) => d === Math.min(...distances));

        const timespan = new BigNumber(distances[index]).dividedBy(
          new BigNumber(miner.travelSpeed).div(1000)
        );
        await sleep(Number(timespan));

        await collections.history?.insertOne({
          minerId: miner.id,
          state: 1,
          metadata: {
            currentPosition: planet.position,
            targetPosition: asteroids[index].position,
            name: asteroids[index].name,
          },
          payload: 0,
          timestamp: Date.now(),
          timespan: timespan.toFixed(0),
        });

        logger.debug(
          `Miner ${miner.id} is traveling to asteroid ${
            asteroids[index].name
          } at (${asteroids[index].position.x},${
            asteroids[index].position.y
          }) for ${timespan.div(1000).toFixed(0)} years`
        );
      }
    } catch (error) {
      logger.error(`travel error: ${error}`);
    }
  }

  async mine(miner: IMiner) {
    try {
      const history = await collections.history
        ?.find({
          minerId: miner.id,
        })
        .sort({
          timestamp: -1,
        })
        .toArray();
      const asteroid = await collections.asteroids?.findOne({
        position: history?.[0]?.metadata.targetPosition,
      });

      if (asteroid) {
        // Add the miner to the asteroid map
        if (AsteroidMinerMap[asteroid.name]) {
          AsteroidMinerMap[asteroid.name] = [
            ...AsteroidMinerMap[asteroid.name],
            miner.id,
          ];
        } else {
          AsteroidMinerMap[asteroid.name] = [miner.id];
        }
        const currentPayload =
          asteroid?.minerals >= miner.carryCapacity
            ? miner.carryCapacity
            : asteroid?.minerals;

        if (currentPayload === 0) {
          await collections.history?.insertOne({
            minerId: miner.id,
            state: 2,
            metadata: {
              name: asteroid?.name,
              targetPosition: asteroid?.position,
            },
            payload: 0,
            timestamp: Date.now(),
            timespan: 0,
          });
        } else {
          // Remove the resource from the asteroid to avoid competition, and update the asteroid
          await collections.asteroids?.updateOne(
            {
              name: asteroid?.name,
            },
            {
              $set: {
                mined: asteroid?.mined + currentPayload,
                status: asteroid?.mineral < asteroid?.mined + currentPayload,
              },
            }
          );

          // Calculate the time to mine the asteroid
          const timespan = new BigNumber(asteroid?.minerals).dividedBy(
            new BigNumber(miner.miningSpeed).div(1000)
          );
          await sleep(Number(timespan));

          // Insert the history and remove the miner off the asteroid
          collections.history?.insertOne({
            minerId: miner.id,
            state: 2,
            metadata: {
              name: asteroid?.name,
              position: asteroid?.position,
            },
            payload: currentPayload,
            timestamp: Date.now(),
            timespan: timespan.toFixed(0),
          });
          collections.asteroids?.updateOne(
            {
              name: asteroid.name,
            },
            {
              $set: {
                mined: asteroid.mined + currentPayload,
              },
            }
          );

          logger.debug(
            `Miner ${miner.id} is mining ${asteroid.name} at (${
              asteroid.position.x
            },${asteroid.position.y}) for ${timespan
              .div(1000)
              .toFixed(0)} years`
          );
        }
        // Remove miner off the asteroid
        AsteroidMinerMap[asteroid.name].splice(
          AsteroidMinerMap[asteroid.name].indexOf(miner.id),
          1
        );

        logger.silly(JSON.stringify(AsteroidMinerMap));
      }
    } catch (error) {
      logger.error(`mine error: ${error}`);
    }
  }

  async transfer(miner: IMiner) {
    try {
      // Query the history to get the asteroid name and position
      const history = await collections.history
        ?.find({
          minerId: miner.id,
        })
        .sort({
          timestamp: -1,
        })
        .toArray();
      // Query the planet to get the position
      const planet = await collections.planets?.findOne({
        id: miner.planetId,
      });

      if (planet && history) {
        const timespan = new BigNumber(planet.position.x)
          .minus(history[0].metadata.targetPosition.x)
          .pow(2)
          .plus(
            new BigNumber(planet.position.y)
              .minus(history[0].metadata.targetPosition.y)
              .pow(2)
          )
          .sqrt()
          .dividedBy(new BigNumber(miner.travelSpeed).div(1000));
        await collections.history?.insertOne({
          minerId: miner.id,
          state: 3,
          metadata: {
            name: history[0].metadata.name,
          },
          payload: history[0]?.payload,
          timestamp: Date.now(),
          timespan: timespan.toFixed(0),
        });
        await collections.planets?.updateOne(
          {
            id: miner.planetId,
          },
          {
            $set: {
              minerals: planet.minerals + history[0]?.payload,
            },
          }
        );
        logger.debug(
          `Miner ${miner.id} is transferring ${
            history[0]?.payload
          } minerals to planet ${planet.name} at (${planet.position.x},${
            planet.position.y
          }) for ${timespan.div(1000).toFixed(0)} years`
        );

        await sleep(Number(timespan));
      }
    } catch (error) {
      logger.error(`transfer error: ${error}`);
    }
  }

  async init() {
    try {
      const miners = await collections.miners?.find().toArray();
      if (miners) {
        this.miners = [...(miners as IMiner[])];
        this.miners.map(async (miner) => {
          // Recover miner state from history
          const history = await collections.history
            ?.find({
              minerId: miner.id,
            })
            .sort({ timestamp: -1 })
            .toArray();
          const lastState = history ? history?.[0]?.state : undefined;

          const machine = createMachine({
            predictableActionArguments: true,
            id: miner.id.toString(),
            initial: MinerStateMap[lastState] || "Idle",
            states: {
              Idle: {
                on: {
                  TRAVEL: "Traveling",
                },
              },
              Traveling: {
                on: {
                  MINE: "Mining",
                },
              },
              Mining: {
                on: {
                  TRANSFER: "Transferring",
                },
              },
              Transferring: {
                on: {
                  IDLE: "Idle",
                },
              },
            },
          });

          const service = interpret(machine).start();

          service.subscribe((state) => {
            // logger.info(`miner: ${miner.id} => ${state.value}`);
            switch (state.value) {
              case "Idle":
                service.send("TRAVEL");
                break;
              case "Traveling":
                this.travel(miner).then(() => {
                  service.send("MINE");
                });
                break;
              case "Mining":
                this.mine(miner).then(() => {
                  service.send("TRANSFER");
                });
                break;
              case "Transferring":
                this.transfer(miner).then(() => {
                  service.send("IDLE");
                });
                break;
            }
          });
        });
      }
    } catch (error) {
      logger.error(error);
    }
  }
}

export { AsteroidMinerMap };
