import express from "express";
import { collections } from "./main";
import { IAsteroid } from "./models/asteroids";
import { IPlanets } from "./models/planets";
import { illegalCoordinate, illegalNumber } from "./uilts";

const router = express.Router();

// Miners
router.get("/miners", async (req, res) => {
  try {
    if (req.query.planetId) {
      const planetIds = JSON.parse(req.query.planetId as string).filter(
        (item: unknown) => typeof item === "number"
      );
      const miners = (await collections.miners
        ?.find({
          planetId: { $in: planetIds },
        })
        .toArray()) as IPlanets[] | undefined;

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
    } else {
      const miners = (await collections.miners?.find().toArray()) as
        | IPlanets[]
        | undefined;
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
    const planet = await collections.planets?.findOne({
      id: req.body.planetId,
    });
    const miner = await collections.miners?.findOne({}, { sort: { id: -1 } });

    console.log(req.body);
    if (
      planet &&
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
      const { _id, ...minerWithoutId } = doc as any;
      res.send(minerWithoutId);
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
    const planets = (await collections.planets?.find().toArray()) as
      | IPlanets[]
      | undefined;
    res.send(
      planets?.map((planet) => {
        delete planet._id;
        return planet;
      })
    );
  } catch (error) {
    res.status(500).send({
      error: JSON.stringify(error),
      message: "Something went wrong",
    });
  }
});

router.get("/planets/:id", async (req, res) => {
  try {
    const planet = await collections.planets?.findOne({
      id: parseInt(req.params.id),
    });
    if (planet) {
      const { _id, ...planetWithoutId } = planet;
      res.send(planetWithoutId);
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
      asteroids?.map((asteroid) => {
        delete asteroid._id;
        return asteroid;
      })
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
      res.send(asteroidWithoutId);
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

export default router;
