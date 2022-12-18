import express from "express";
import { AsteroidMinerMap } from "./events";
import { collections, logger } from "./main";
import { IAsteroid } from "./models/asteroids";
import { IPlanet } from "./models/planets";
import { illegalCoordinate, illegalNumber } from "./utils";
import { machine } from "./main";
import { IMiner } from "./models/miners";

const router = express.Router();

const START_TIME = Date.now();

// Miners
router.get("/miners", async (req, res) => {
  const lookupHistoryAndUnwind = [
    {
      $lookup: {
        from: "histories",
        localField: "id",
        foreignField: "minerId",
        as: "history",
        pipeline: [
          {
            $sort: { timestamp: -1 },
          },
          {
            $limit: 1,
          },
          {
            $project: {
              _id: 0,
              metadata: 1,
              state: 1,
              payload: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: "$history",
      },
    },
  ];

  try {
    if (req.query.planetId) {
      const planetIds = JSON.parse(req.query.planetId as string).filter(
        (item: unknown) => typeof item === "number"
      );
      const miners = (await collections.miners
        ?.aggregate([
          {
            $match: { planetId: { $in: planetIds } },
          },
          ...lookupHistoryAndUnwind,
        ])
        .toArray()) as IPlanet[] | undefined;

      if (miners?.length === 0) {
        res.status(404).send({
          error: "No planets found",
        });
      } else {
        res.send(
          miners?.map((miner) => {
            delete miner._id;
            return miner;
          })
        );
      }
    } else if (req.query.name) {
      const miners = (await collections.miners
        ?.aggregate([
          {
            $match: { name: req.query.name },
          },
          ...lookupHistoryAndUnwind,
        ])
        .toArray()) as IPlanet[] | undefined;

      if (miners?.length === 0) {
        res.status(404).send({
          error: "No miners found",
        });
      } else {
        res.send(
          miners?.map((miner) => {
            delete miner._id;
            return miner;
          })
        );
      }
    } else {
      const miners = (await collections.miners
        ?.aggregate(lookupHistoryAndUnwind)
        .toArray()) as IPlanet[] | undefined;
      res.send(
        miners?.map((miner) => {
          delete miner._id;
          return miner;
        })
      );
    }
  } catch (e) {
    res.status(500).send({
      error: e,
      message: "Something went wrong",
    });
  }
});

router.get("/miners/:id", async (req, res) => {
  try {
    const miner = await collections.miners?.findOne({
      id: parseInt(req.params.id),
    });
    if (miner) {
      const { _id, ...minerWithoutId } = miner;
      res.send(minerWithoutId);
    } else {
      res.status(404).send({
        error: "Miner not found",
      });
    }
  } catch (e) {
    res.status(500).send({
      error: e,
      message: "Something went wrong",
    });
  }
});

router.post("/miners", async (req, res) => {
  try {
    // TODO: Investigatin on request cancelled issue
    req.on("close", function () {
      // code to handle connection abort
      logger.debug("user cancelled");
    });

    const planet = await collections.planets?.findOne({
      id: req.body.planetId,
    });
    const miner = await collections.miners?.findOne({}, { sort: { id: -1 } });

    if (
      planet &&
      planet.minerals > 500 &&
      !!req.body.name &&
      !illegalNumber(req.body.carryCapacity) &&
      !illegalNumber(req.body.travelSpeed) &&
      !illegalNumber(req.body.miningSpeed)
    ) {
      const doc = {
        id: miner?.id + 1,
        planetId: planet.id,
        name: req.body.name,
        carryCapacity: req.body.carryCapacity,
        travelSpeed: req.body.travelSpeed,
        miningSpeed: req.body.miningSpeed,
      };

      await collections.miners?.insertOne(doc);
      await collections.planets?.updateOne(
        { id: planet.id },
        { $set: { minerals: planet.minerals - 500 } }
      );
      machine.run(doc as IMiner);
      const { _id, ...minerWithoutId } = doc as any;
      res.status(200).send(minerWithoutId);
    } else {
      res.status(400).send({
        error: "Invalid request",
      });
    }
  } catch (error) {
    res.status(500).send({
      error,
      message: "Something went wrong",
    });
  }
});

router.put("/miners", async (req, res) => {
  try {
    if (!isNaN(req.body.id)) {
      const miner = await collections.miners?.findOne({
        id: req.body.id,
      });

      if (!miner) {
        res.status(404).send({
          error: "Miner not found",
        });
      } else {
        if (req.body.carryCapacity && illegalNumber(req.body.carryCapacity)) {
          res.status(400).send({
            error: "Invalid request",
          });
          return;
        }
        if (req.body.travelSpeed && illegalNumber(req.body.travelSpeed)) {
          res.status(400).send({
            error: "Invalid request",
          });
          return;
        }
        if (req.body.miningSpeed && illegalNumber(req.body.miningSpeed)) {
          res.status(400).send({
            error: "Invalid request",
          });
          return;
        }

        await collections.miners?.updateOne(
          { id: req.body.id },
          {
            $set: {
              ...(req.body.name && { name: req.body.name }),
              ...(req.body.carryCapacity && {
                carryCapacity: req.body.carryCapacity,
              }),
              ...(req.body.travelSpeed && {
                travelSpeed: req.body.travelSpeed,
              }),
              ...(req.body.miningSpeed && {
                miningSpeed: req.body.miningSpeed,
              }),
            },
          }
        );

        res.send({
          id: req.body.id,
          name: req.body.name,
          carryCapacity: req.body.carryCapacity,
          travelSpeed: req.body.travelSpeed,
          miningSpeed: req.body.miningSpeed,
        });
      }
    } else {
      res.status(400).send({
        error: "Invalid request",
      });
    }
  } catch (error) {
    res.status(500).send({
      error: JSON.stringify(error),
      message: "Something went wrong",
    });
  }
});

router.delete("/miners/:id", async (req, res) => {
  try {
    await collections.miners?.deleteOne({
      id: parseInt(req.params.id),
    });
    res.send({
      id: parseInt(req.params.id),
    });
  } catch (error) {
    res.status(500).send({
      error: JSON.stringify(error),
      message: "Something went wrong",
    });
  }
});

// Planets
router.get("/planets", async (req, res) => {
  try {
    const planets = (await collections.planets
      ?.aggregate([
        {
          $lookup: {
            from: "miners",
            localField: "id",
            foreignField: "planetId",
            as: "miners",
          },
        },
        {
          $project: {
            _id: 0,
            id: 1,
            position: 1,
            minerals: 1,
            minersCount: { $size: "$miners" },
          },
        },
      ])
      .toArray()) as IPlanet[] | undefined;

    res.send(planets);
  } catch (error) {
    res.status(500).send({
      error: JSON.stringify(error),
      message: "Something went wrong",
    });
  }
});

router.get("/planets/:id", async (req, res) => {
  try {
    const planetArr = await collections.planets
      ?.aggregate([
        {
          $match: {
            id: parseInt(req.params.id),
          },
        },
        {
          $lookup: {
            from: "miners",
            localField: "id",
            foreignField: "planetId",
            as: "miners",
          },
        },
        {
          $project: {
            _id: 0,
            id: 1,
            position: 1,
            minerals: 1,
            minersCount: { $size: "$miners" },
          },
        },
      ])
      .toArray();

    if (planetArr && planetArr.length > 0) {
      res.send(planetArr[0]);
    }
  } catch (error) {
    res.status(500).send({
      error: JSON.stringify(error),
      message: "Something went wrong",
    });
  }
});

router.post("/planets", async (req, res) => {
  try {
    if (!req.body.name || !req.body.position) {
    }
    const planetsLocation = await collections.planets?.findOne({
      position: req.body.position,
    });
    const asteroidsLocation = await collections.asteroids?.findOne({
      position: req.body.position,
    });

    if (!planetsLocation && !asteroidsLocation) {
      if (illegalCoordinate(req.body.position)) {
        res.status(400).send({
          error: "Coordinate overflow",
        });
      } else {
        const planet = await collections.planets?.findOne(
          {},
          { sort: { id: -1 } }
        );

        const doc = {
          id: planet?.id + 1,
          position: req.body.position,
          name: req.body.name,
          minerals: req.body.minerals || 1000,
        };

        await collections.planets?.insertOne(doc);
        const { _id, ...planetWithoutId } = doc as any;
        res.send(planetWithoutId);
      }
    } else {
      res.status(400).send({
        error: "Position is not empty",
      });
    }
  } catch (error) {
    res.status(500).send({
      error,
      message: "Something went wrong",
    });
  }
});

router.put("/planets", async (req, res) => {
  try {
    const planet = await collections.planets?.findOne({
      id: req.body.id,
    });

    if (!planet) {
      res.status(404).send({
        error: "Planet not found",
      });
    } else {
      if (req.body.position && illegalCoordinate(req.body.position)) {
        res.status(400).send({
          error: "Coordinate overflow",
        });
      } else {
        const planetsLocation = await collections.planets?.findOne({
          position: req.body.position,
        });
        const asteroidsLocation = await collections.asteroids?.findOne({
          position: req.body.position,
        });

        if (planetsLocation && asteroidsLocation) {
          res.status(400).send({
            error: "Position is not empty",
          });
          return;
        }

        await collections.planets?.updateOne(
          {
            id: req.body.id,
          },
          {
            $set: {
              ...(!!req.body.name && { name: req.body.name }),
              ...(!!req.body.position && { position: req.body.position }),
              ...(!!req.body.minerals && { resource: req.body.minerals }),
            },
          }
        );
        res.send({
          id: req.body.id,
          name: req.body.name,
          position: req.body.position,
          minerals: req.body.minerals,
        });
      }
    }
  } catch (error) {
    res.status(500).send({
      error: JSON.stringify(error),
      message: "Something went wrong",
    });
  }
});

router.delete("/planets/:id", async (req, res) => {
  try {
    await collections.planets?.deleteOne({
      id: parseInt(req.params.id),
    });
    await collections.miners?.findOneAndDelete({
      planetId: parseInt(req.params.id),
    });
    res.send({
      id: parseInt(req.params.id),
    });
  } catch (error) {
    res.status(500).send({
      error: JSON.stringify(error),
      message: "Something went wrong",
    });
  }
});

// Asteroids
router.get("/asteroids", async (req, res) => {
  try {
    const asteroids = (await collections.asteroids?.find().toArray()) as
      | IAsteroid[]
      | undefined;

    res.send(
      await Promise.all(
        asteroids?.map(async (asteroid) => {
          delete asteroid._id;
          return {
            miner: AsteroidMinerMap.get(asteroid.name),
            ...asteroid,
          };
        }) || []
      )
    );
  } catch (error) {
    res.status(500).send({
      error: JSON.stringify(error),
      message: "Something went wrong",
    });
  }
});

/**
 * @api {get} /asteroids/:name Get Asteroid
 * @apiName GetAsteroid
 * @apiGroup Asteroid
 * @apiParam {String} name Asteroid name, processed by encodeURIComponent
 */
router.get("/asteroids/:name", async (req, res) => {
  try {
    const asteroid = await collections.asteroids?.findOne({
      name: decodeURIComponent(req.params.name),
    });
    if (asteroid) {
      const { _id, ...asteroidWithoutId } = asteroid;

      res.send({
        ...asteroidWithoutId,
        miner: AsteroidMinerMap.get(asteroid.name),
      });
    } else {
      res.status(404).send({
        error: "Asteroid not found",
      });
    }
  } catch (error) {
    res.status(500).send({
      error: JSON.stringify(error),
      message: "Something went wrong",
    });
  }
});

router.post("/asteroids", async (req, res) => {
  try {
    if (!req.body.name || !req.body.position) {
      res.status(400).send({
        error: "Missing name or position",
      });
    } else {
      const asteroid = await collections.asteroids?.findOne({
        name: req.body.name,
      });

      if (asteroid) {
        res.status(400).send({
          error: "Asteroid name already exists",
        });
      } else {
        const asteroidsLocation = await collections.asteroids?.findOne({
          position: req.body.position,
        });
        const planetsLocation = await collections.planets?.findOne({
          position: req.body.position,
        });

        if (!asteroidsLocation && !planetsLocation) {
          if (illegalCoordinate(req.body.position)) {
            res.status(400).send({
              error: "Coordinate overflow",
            });
          } else {
            if (req.body.minerals > 1200 || req.body.minerals < 800) {
              res.status(400).send({
                error: "Minerals must be between 800 and 1200",
              });
            } else {
              const doc = {
                name: req.body.name,
                position: req.body.position,
                minerals:
                  req.body.minerals ||
                  Math.round(Math.random() * (1200 - 800) + 800),
              };

              await collections.asteroids?.insertOne(doc);
              const { _id, ...asteroidWithoutId } = doc as any;
              res.send(asteroidWithoutId);
            }
          }
        } else {
          res.status(400).send({
            error: "Position is not empty",
          });
        }
      }
    }
  } catch (error) {}
});

router.put("/asteroids", async (req, res) => {
  try {
    const asteroid = await collections.asteroids?.findOne({
      name: req.body.name,
    });

    if (!asteroid) {
      res.status(404).send({
        error: "Asteroid not found",
      });
    } else {
      if (req.body.position && illegalCoordinate(req.body.position)) {
        res.status(400).send({
          error: "Coordinate overflow",
        });
      } else {
        const asteroidsLocation = await collections.asteroids?.findOne({
          position: req.body.position,
        });
        const planetsLocation = await collections.planets?.findOne({
          position: req.body.position,
        });

        if (!asteroidsLocation && !planetsLocation) {
          await collections.asteroids?.updateOne(
            {
              name: req.body.name,
            },
            {
              $set: {
                ...(!!req.body.position && { position: req.body.position }),
                ...(!!req.body.minerals && { minerals: req.body.minerals }),
              },
            }
          );
          res.send({
            name: req.body.name,
            position: req.body.position,
            minerals: req.body.minerals,
          });
        } else {
          res.status(400).send({
            error: "Position is not empty",
          });
        }
      }
    }
  } catch (error) {
    res.status(500).send({
      error: JSON.stringify(error),
      message: "Something went wrong",
    });
  }
});

router.delete("/asteroids/:name", async (req, res) => {
  try {
    await collections.asteroids?.deleteOne({
      name: decodeURIComponent(req.params.name),
    });
    res.send({
      name: decodeURIComponent(req.params.name),
    });
  } catch (error) {
    res.status(500).send({
      error: JSON.stringify(error),
      message: "Something went wrong",
    });
  }
});

router.get("/history/:id", async (req, res) => {
  try {
    const data = await collections.history
      ?.aggregate([
        {
          $match: {
            minerId: Number(req.params.id),
          },
        },
        {
          $lookup: {
            from: "miners",
            localField: "minerId",
            foreignField: "id",
            as: "planet",
          },
        },
        {
          $set: {
            planet: { $arrayElemAt: ["$planet.planetId", 0] },
          },
        },
        {
          $sort: {
            timestamp: -1,
          },
        },
        {
          $limit: 20,
        },
        {
          $project: {
            _id: 0,
          },
        },
      ])
      .toArray();

    res.send(
      data?.map((item) => ({
        ...item,
        year: Math.round((item.timestamp - START_TIME) / 1000),
      }))
    );
  } catch (error) {
    res.status(500).send({
      error: JSON.stringify(error),
      message: "Something went wrong",
    });
  }
});

export default router;
