import BigNumber from "bignumber.js";
import { createMachine, interpret, StateMachine } from "xstate";
import { collections, logger } from "./main";
import { IMiner } from "./models/miners";
import { sleep } from "./utils";

const MinerStateMap = ["Idle", "Traveling", "Mining", "Transferring"];

export const AsteroidMinerMap = new Map<string, number>();
export const MinerAsteroidMap = new Map<number, string>();

export default class EventLoop {
  miners: IMiner[];
  machines: Map<number, any>;

  constructor() {
    this.miners = [];
    this.machines = new Map<number, any>();
  }

  async idle(miner: IMiner) {
    try {
      const planet = await collections?.planets?.findOne({
        id: miner.planetId,
      });
      await collections?.history?.insertOne({
        minerId: miner.id,
        state: 0,
        metadata: {
          position: planet?.position,
        },
        carryCapacity: miner.carryCapacity,
        travelSpeed: miner.travelSpeed,
        miningSpeed: miner.miningSpeed,
        payload: 0,
        timestamp: Date.now(),
        status: "Miner has come back to home planet",
      });
    } catch (error) {
      logger.error(error);
    }
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

        // Find the nearest asteroid, pre-allocate the miner to the asteroid
        let cursor = 0;
        while (AsteroidMinerMap.get(asteroids[cursor].name)) {
          if (cursor !== distances.length - 1) {
            cursor++;
          } else {
            cursor = 0;
          }
        }
        logger.debug(
          `Picking asteroid ${asteroids[cursor].name} for miner ${miner.id}`
        );
        // Set a bi-directional mapping between miner and asteroid
        AsteroidMinerMap.set(asteroids[cursor].name, miner.id);
        MinerAsteroidMap.set(miner.id, asteroids[cursor].name);

        const timespan = new BigNumber(distances[index]).dividedBy(
          new BigNumber(miner.travelSpeed).div(1000)
        );
        logger.debug(
          `Miner ${miner.id} is traveling to asteroid ${
            asteroids[index].name
          } at (${asteroids[index].position.x},${
            asteroids[index].position.y
          }) for ${timespan.div(1000).toFixed(0)} years`
        );
        await collections.history?.insertOne({
          minerId: miner.id,
          state: 1,
          metadata: {
            position: planet.position,
            targetPosition: asteroids[index].position,
            name: asteroids[index].name,
          },
          carryCapacity: miner.carryCapacity,
          travelSpeed: miner.travelSpeed,
          miningSpeed: miner.miningSpeed,
          payload: 0,
          timestamp: Date.now(),
          timespan: Number(timespan.toFixed(0)),
          status: `Miner is traveling to asteroid ${asteroids[index].name}`,
        });
        await sleep(Number(timespan));
      }
    } catch (error) {
      logger.error(`travel error: ${error}`);
    }
  }

  async mine(miner: IMiner) {
    try {
      const asteroidName = MinerAsteroidMap.get(miner.id);
      const asteroid = await collections.asteroids?.findOne({
        name:
          asteroidName ||
          (
            await collections.history
              ?.find({
                minerId: miner.id,
              })
              .sort({
                timestamp: -1,
              })
              .toArray()
          )?.[0].metadata.name,
      });

      if (asteroid) {
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
              position: asteroid?.position,
            },
            carryCapacity: miner.carryCapacity,
            travelSpeed: miner.travelSpeed,
            miningSpeed: miner.miningSpeed,
            payload: 0,
            timestamp: Date.now(),
            timespan: 0,
            status: `Miner is mining asteroid ${asteroid.name}`,
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
          logger.debug(
            `Miner ${miner.id} is mining ${asteroid.name} at (${
              asteroid.position.x
            },${asteroid.position.y}) for ${timespan
              .div(1000)
              .toFixed(0)} years`
          );

          // Insert the history and remove the miner off the asteroid
          collections.history?.insertOne({
            minerId: miner.id,
            state: 2,
            metadata: {
              name: asteroid?.name,
              position: asteroid?.position,
            },
            carryCapacity: miner.carryCapacity,
            travelSpeed: miner.travelSpeed,
            miningSpeed: miner.miningSpeed,
            payload: currentPayload,
            timestamp: Date.now(),
            timespan: Number(timespan.toFixed(0)),
            status: `Miner is mining asteroid ${asteroid.name}`,
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
          await sleep(timespan.toNumber());
        }
        // Remove bi-directional mapping
        logger.debug(`Remove miner ${miner.id} off asteroid ${asteroid.name}`);
        AsteroidMinerMap.delete(asteroid.name);
        MinerAsteroidMap.delete(miner.id);
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
        // console.log(planet, history[0]);
        const timespan = new BigNumber(planet.position.x)
          .minus(history[0].metadata.position.x)
          .pow(2)
          .plus(
            new BigNumber(planet.position.y)
              .minus(history[0].metadata.position.y)
              .pow(2)
          )
          .sqrt()
          .dividedBy(new BigNumber(miner.travelSpeed).div(1000));
        await collections.history?.insertOne({
          minerId: miner.id,
          state: 3,
          metadata: {
            name: history[0].metadata.name,
            position: history[0].metadata.position,
            targetPosition: planet.position,
          },
          carryCapacity: miner.carryCapacity,
          travelSpeed: miner.travelSpeed,
          miningSpeed: miner.miningSpeed,
          payload: history[0]?.payload,
          timestamp: Date.now(),
          timespan: Number(timespan.toFixed(0)),
          status: `Miner is transferring ${history[0]?.payload} minerals to planet ${planet.name} at (${planet.position.x},${planet.position.y})`,
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

  async run(miner: IMiner, state?: number) {
    logger.info(`Run state machine for miner ${miner.id}`);
    const machine = createMachine({
      predictableActionArguments: true,
      id: miner.id.toString(),
      initial: state ? MinerStateMap[state] : "Idle",
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

    this.machines.set(miner.id, machine);

    const service = interpret(this.machines.get(miner.id)).start();

    service.subscribe((state) => {
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
  }

  async init() {
    try {
      const miners = await collections.miners?.find().toArray();
      if (miners) {
        this.miners = [...(miners as IMiner[])];
        this.miners.map((miner) => {
          // Recover miner state from history
          collections.history
            ?.find({
              minerId: miner.id,
            })
            .sort({ timestamp: -1 })
            .toArray()
            .then((history) => {
              const lastState = history ? history?.[0]?.state : undefined;
              this.run(miner, lastState);
            });
        });
      }
    } catch (error) {
      logger.error(error);
    }
  }
}
