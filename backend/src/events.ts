import { createMachine, interpret } from "xstate";
import { collections, logger } from "./main";
import { IMiner } from "./models/miners";
import { sleep } from "./uilts";
import BigNumber from "bignumber.js";

const MinerStateMap = ["Idle", "Traveling", "Mining", "Transferring"];

export default class EventLoop {
  miners: IMiner[];
  machines: any[];

  constructor() {
    this.miners = [];
    this.machines = [];
  }

  async travel(miner: IMiner) {
    let position = {
      x: 0,
      y: 0,
    };

    const planet = await collections.planets?.findOne({
      id: miner.planetId,
    });
    position = planet?.position;

    // List all asteroids with minerals amount > 0
    // Theretically this algo should calculated with both distance
    // And minerals amount, but for now we just use distance
    const asteroids = await collections.asteroids
      ?.find({
        minerals: {
          $gt: 0,
        },
      })
      .toArray();

    const distances: number[] = [];

    if (asteroids) {
      for (let a of asteroids) {
        const distance = new BigNumber(a.position.x)
          .minus(position.x)
          .pow(2)
          .plus(new BigNumber(a.position.y).minus(position.y).pow(2))
          .sqrt();
        distances.push(Number(distance.toFixed(0)));
      }
      const index = distances.findIndex((d) => d === Math.min(...distances));

      const timespan = new BigNumber(distances[index]).dividedBy(
        new BigNumber(miner.travelSpeed).div(1000)
      );
      await collections.history?.insertOne({
        minerId: miner.id,
        state: 1,
        metadata: {
          currentPosition: position,
          targetPosition: asteroids[index].position,
          name: asteroids[index].name,
        },
        payload: 0,
        timestamp: Date.now(),
        timespan: timespan.toString(),
      });
      await sleep(Number(timespan));
    }
  }

  async init() {
    try {
      const miners = await collections.miners?.find().toArray();
      if (miners) {
        this.miners = miners as IMiner[];
        this.miners.map(async (miner) => {
          const history = await collections.history
            ?.find({
              minerId: miner.id,
            })
            .sort({ timstamp: -1 })
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
                  TRANSFER: "Transfering",
                },
              },
              Transfering: {
                on: {
                  IDLE: "Idle",
                },
              },
            },
          });

          const service = interpret(machine).start();

          service.subscribe((state) => {
            logger.debug(`miner: ${miner.id} => ${state.value}`);
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
                break;
              case "Transfering":
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
