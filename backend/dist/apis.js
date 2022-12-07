"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const main_1 = require("./main");
const uilts_1 = require("./uilts");
const router = express_1.default.Router();
// Miners
router.get("/miners", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        if (req.query.planetId) {
            const planetIds = JSON.parse(req.query.planetId).filter((item) => typeof item === "number");
            const miners = (yield ((_a = main_1.collections.miners) === null || _a === void 0 ? void 0 : _a.find({
                planetId: { $in: planetIds },
            }).toArray()));
            if ((miners === null || miners === void 0 ? void 0 : miners.length) === 0) {
                res.status(404).send({
                    error: "No planets found",
                });
            }
            else {
                res.send(miners === null || miners === void 0 ? void 0 : miners.map((miner) => {
                    delete miner._id;
                    return miner;
                }));
            }
        }
        else {
            const miners = (yield ((_b = main_1.collections.miners) === null || _b === void 0 ? void 0 : _b.find().toArray()));
            res.send(miners === null || miners === void 0 ? void 0 : miners.map((miner) => {
                delete miner._id;
                return miner;
            }));
        }
    }
    catch (e) {
        res.status(500).send({
            error: e,
            message: "Something went wrong",
        });
    }
}));
router.get("/miners/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const miner = yield ((_c = main_1.collections.miners) === null || _c === void 0 ? void 0 : _c.findOne({
            id: parseInt(req.params.id),
        }));
        if (miner) {
            const { _id } = miner, minerWithoutId = __rest(miner, ["_id"]);
            res.send(minerWithoutId);
        }
        else {
            res.status(404).send({
                error: "Miner not found",
            });
        }
    }
    catch (e) {
        res.status(500).send({
            error: e,
            message: "Something went wrong",
        });
    }
}));
router.post("/miners", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _d, _e, _f;
    try {
        const planet = yield ((_d = main_1.collections.planets) === null || _d === void 0 ? void 0 : _d.findOne({
            id: req.body.planetId,
        }));
        const miner = yield ((_e = main_1.collections.miners) === null || _e === void 0 ? void 0 : _e.findOne({}, { sort: { id: -1 } }));
        console.log(req.body);
        if (planet &&
            !!req.body.name &&
            !(0, uilts_1.illegalNumber)(req.body.carryCapacity) &&
            !(0, uilts_1.illegalNumber)(req.body.travelSpeed) &&
            !(0, uilts_1.illegalNumber)(req.body.miningSpeed)) {
            const doc = {
                id: (miner === null || miner === void 0 ? void 0 : miner.id) + 1,
                planetId: planet.id,
                name: req.body.name,
                carryCapacity: req.body.carryCapacity,
                travelSpeed: req.body.travelSpeed,
                miningSpeed: req.body.miningSpeed,
            };
            yield ((_f = main_1.collections.miners) === null || _f === void 0 ? void 0 : _f.insertOne(doc));
            const _g = doc, { _id } = _g, minerWithoutId = __rest(_g, ["_id"]);
            res.send(minerWithoutId);
        }
        else {
            res.status(400).send({
                error: "Invalid request",
            });
        }
    }
    catch (error) {
        res.status(500).send({
            error,
            message: "Something went wrong",
        });
    }
}));
router.put("/miners", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _h, _j;
    try {
        if (!isNaN(req.body.id)) {
            const miner = yield ((_h = main_1.collections.miners) === null || _h === void 0 ? void 0 : _h.findOne({
                id: req.body.id,
            }));
            if (!miner) {
                res.status(404).send({
                    error: "Miner not found",
                });
            }
            else {
                if (req.body.carryCapacity && (0, uilts_1.illegalNumber)(req.body.carryCapacity)) {
                    res.status(400).send({
                        error: "Invalid request",
                    });
                    return;
                }
                if (req.body.travelSpeed && (0, uilts_1.illegalNumber)(req.body.travelSpeed)) {
                    res.status(400).send({
                        error: "Invalid request",
                    });
                    return;
                }
                if (req.body.miningSpeed && (0, uilts_1.illegalNumber)(req.body.miningSpeed)) {
                    res.status(400).send({
                        error: "Invalid request",
                    });
                    return;
                }
                yield ((_j = main_1.collections.miners) === null || _j === void 0 ? void 0 : _j.updateOne({ id: req.body.id }, {
                    $set: Object.assign(Object.assign(Object.assign(Object.assign({}, (req.body.name && { name: req.body.name })), (req.body.carryCapacity && {
                        carryCapacity: req.body.carryCapacity,
                    })), (req.body.travelSpeed && {
                        travelSpeed: req.body.travelSpeed,
                    })), (req.body.miningSpeed && {
                        miningSpeed: req.body.miningSpeed,
                    })),
                }));
                res.send({
                    id: req.body.id,
                    name: req.body.name,
                    carryCapacity: req.body.carryCapacity,
                    travelSpeed: req.body.travelSpeed,
                    miningSpeed: req.body.miningSpeed,
                });
            }
        }
        else {
            res.status(400).send({
                error: "Invalid request",
            });
        }
    }
    catch (error) {
        res.status(500).send({
            error: JSON.stringify(error),
            message: "Something went wrong",
        });
    }
}));
router.delete("/miners/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _k;
    try {
        yield ((_k = main_1.collections.miners) === null || _k === void 0 ? void 0 : _k.deleteOne({
            id: parseInt(req.params.id),
        }));
        res.send({
            id: parseInt(req.params.id),
        });
    }
    catch (error) {
        res.status(500).send({
            error: JSON.stringify(error),
            message: "Something went wrong",
        });
    }
}));
// Planets
router.get("/planets", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _l;
    try {
        const planets = (yield ((_l = main_1.collections.planets) === null || _l === void 0 ? void 0 : _l.find().toArray()));
        res.send(planets === null || planets === void 0 ? void 0 : planets.map((planet) => {
            delete planet._id;
            return planet;
        }));
    }
    catch (error) {
        res.status(500).send({
            error: JSON.stringify(error),
            message: "Something went wrong",
        });
    }
}));
router.get("/planets/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _m;
    try {
        const planet = yield ((_m = main_1.collections.planets) === null || _m === void 0 ? void 0 : _m.findOne({
            id: parseInt(req.params.id),
        }));
        if (planet) {
            const { _id } = planet, planetWithoutId = __rest(planet, ["_id"]);
            res.send(planetWithoutId);
        }
    }
    catch (error) {
        res.status(500).send({
            error: JSON.stringify(error),
            message: "Something went wrong",
        });
    }
}));
router.post("/planets", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _o, _p, _q, _r;
    try {
        if (!req.body.name || !req.body.position) {
        }
        const planetsLocation = yield ((_o = main_1.collections.planets) === null || _o === void 0 ? void 0 : _o.findOne({
            position: req.body.position,
        }));
        const asteroidsLocation = yield ((_p = main_1.collections.asteroids) === null || _p === void 0 ? void 0 : _p.findOne({
            position: req.body.position,
        }));
        if (!planetsLocation && !asteroidsLocation) {
            if ((0, uilts_1.illegalCoordinate)(req.body.position)) {
                res.status(400).send({
                    error: "Coordinate overflow",
                });
            }
            else {
                const planet = yield ((_q = main_1.collections.planets) === null || _q === void 0 ? void 0 : _q.findOne({}, { sort: { id: -1 } }));
                const doc = {
                    id: (planet === null || planet === void 0 ? void 0 : planet.id) + 1,
                    position: req.body.position,
                    name: req.body.name,
                    minerals: req.body.minerals || 1000,
                };
                yield ((_r = main_1.collections.planets) === null || _r === void 0 ? void 0 : _r.insertOne(doc));
                const _s = doc, { _id } = _s, planetWithoutId = __rest(_s, ["_id"]);
                res.send(planetWithoutId);
            }
        }
        else {
            res.status(400).send({
                error: "Position is not empty",
            });
        }
    }
    catch (error) {
        res.status(500).send({
            error,
            message: "Something went wrong",
        });
    }
}));
router.put("/planets", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _t, _u, _v, _w;
    try {
        const planet = yield ((_t = main_1.collections.planets) === null || _t === void 0 ? void 0 : _t.findOne({
            id: req.body.id,
        }));
        if (!planet) {
            res.status(404).send({
                error: "Planet not found",
            });
        }
        else {
            if (req.body.position && (0, uilts_1.illegalCoordinate)(req.body.position)) {
                res.status(400).send({
                    error: "Coordinate overflow",
                });
            }
            else {
                const planetsLocation = yield ((_u = main_1.collections.planets) === null || _u === void 0 ? void 0 : _u.findOne({
                    position: req.body.position,
                }));
                const asteroidsLocation = yield ((_v = main_1.collections.asteroids) === null || _v === void 0 ? void 0 : _v.findOne({
                    position: req.body.position,
                }));
                if (planetsLocation && asteroidsLocation) {
                    res.status(400).send({
                        error: "Position is not empty",
                    });
                    return;
                }
                yield ((_w = main_1.collections.planets) === null || _w === void 0 ? void 0 : _w.updateOne({
                    id: req.body.id,
                }, {
                    $set: Object.assign(Object.assign(Object.assign({}, (!!req.body.name && { name: req.body.name })), (!!req.body.position && { position: req.body.position })), (!!req.body.minerals && { resource: req.body.minerals })),
                }));
                res.send({
                    id: req.body.id,
                    name: req.body.name,
                    position: req.body.position,
                    minerals: req.body.minerals,
                });
            }
        }
    }
    catch (error) {
        res.status(500).send({
            error: JSON.stringify(error),
            message: "Something went wrong",
        });
    }
}));
router.delete("/planets/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _x, _y;
    try {
        yield ((_x = main_1.collections.planets) === null || _x === void 0 ? void 0 : _x.deleteOne({
            id: parseInt(req.params.id),
        }));
        yield ((_y = main_1.collections.miners) === null || _y === void 0 ? void 0 : _y.findOneAndDelete({
            planetId: parseInt(req.params.id),
        }));
        res.send({
            id: parseInt(req.params.id),
        });
    }
    catch (error) {
        res.status(500).send({
            error: JSON.stringify(error),
            message: "Something went wrong",
        });
    }
}));
// Asteroids
router.get("/asteroids", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _z;
    try {
        const asteroids = (yield ((_z = main_1.collections.asteroids) === null || _z === void 0 ? void 0 : _z.find().toArray()));
        res.send(asteroids === null || asteroids === void 0 ? void 0 : asteroids.map((asteroid) => {
            delete asteroid._id;
            return asteroid;
        }));
    }
    catch (error) {
        res.status(500).send({
            error: JSON.stringify(error),
            message: "Something went wrong",
        });
    }
}));
/**
 * @api {get} /asteroids/:name Get Asteroid
 * @apiName GetAsteroid
 * @apiGroup Asteroid
 * @apiParam {String} name Asteroid name, processed by encodeURIComponent
 */
router.get("/asteroids/:name", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _0;
    try {
        const asteroid = yield ((_0 = main_1.collections.asteroids) === null || _0 === void 0 ? void 0 : _0.findOne({
            name: decodeURIComponent(req.params.name),
        }));
        if (asteroid) {
            const { _id } = asteroid, asteroidWithoutId = __rest(asteroid, ["_id"]);
            res.send(asteroidWithoutId);
        }
        else {
            res.status(404).send({
                error: "Asteroid not found",
            });
        }
    }
    catch (error) {
        res.status(500).send({
            error: JSON.stringify(error),
            message: "Something went wrong",
        });
    }
}));
router.post("/asteroids", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _1, _2, _3, _4;
    try {
        if (!req.body.name || !req.body.position) {
            res.status(400).send({
                error: "Missing name or position",
            });
        }
        else {
            const asteroid = yield ((_1 = main_1.collections.asteroids) === null || _1 === void 0 ? void 0 : _1.findOne({
                name: req.body.name,
            }));
            if (asteroid) {
                res.status(400).send({
                    error: "Asteroid name already exists",
                });
            }
            else {
                const asteroidsLocation = yield ((_2 = main_1.collections.asteroids) === null || _2 === void 0 ? void 0 : _2.findOne({
                    position: req.body.position,
                }));
                const planetsLocation = yield ((_3 = main_1.collections.planets) === null || _3 === void 0 ? void 0 : _3.findOne({
                    position: req.body.position,
                }));
                if (!asteroidsLocation && !planetsLocation) {
                    if ((0, uilts_1.illegalCoordinate)(req.body.position)) {
                        res.status(400).send({
                            error: "Coordinate overflow",
                        });
                    }
                    else {
                        if (req.body.minerals > 1200 || req.body.minerals < 800) {
                            res.status(400).send({
                                error: "Minerals must be between 800 and 1200",
                            });
                        }
                        else {
                            const doc = {
                                name: req.body.name,
                                position: req.body.position,
                                minerals: req.body.minerals ||
                                    Math.round(Math.random() * (1200 - 800) + 800),
                            };
                            yield ((_4 = main_1.collections.asteroids) === null || _4 === void 0 ? void 0 : _4.insertOne(doc));
                            const _5 = doc, { _id } = _5, asteroidWithoutId = __rest(_5, ["_id"]);
                            res.send(asteroidWithoutId);
                        }
                    }
                }
                else {
                    res.status(400).send({
                        error: "Position is not empty",
                    });
                }
            }
        }
    }
    catch (error) { }
}));
router.put("/asteroids", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _6, _7, _8, _9;
    try {
        const asteroid = yield ((_6 = main_1.collections.asteroids) === null || _6 === void 0 ? void 0 : _6.findOne({
            name: req.body.name,
        }));
        if (!asteroid) {
            res.status(404).send({
                error: "Asteroid not found",
            });
        }
        else {
            if (req.body.position && (0, uilts_1.illegalCoordinate)(req.body.position)) {
                res.status(400).send({
                    error: "Coordinate overflow",
                });
            }
            else {
                const asteroidsLocation = yield ((_7 = main_1.collections.asteroids) === null || _7 === void 0 ? void 0 : _7.findOne({
                    position: req.body.position,
                }));
                const planetsLocation = yield ((_8 = main_1.collections.planets) === null || _8 === void 0 ? void 0 : _8.findOne({
                    position: req.body.position,
                }));
                if (!asteroidsLocation && !planetsLocation) {
                    yield ((_9 = main_1.collections.asteroids) === null || _9 === void 0 ? void 0 : _9.updateOne({
                        name: req.body.name,
                    }, {
                        $set: Object.assign(Object.assign({}, (!!req.body.position && { position: req.body.position })), (!!req.body.minerals && { minerals: req.body.minerals })),
                    }));
                    res.send({
                        name: req.body.name,
                        position: req.body.position,
                        minerals: req.body.minerals,
                    });
                }
                else {
                    res.status(400).send({
                        error: "Position is not empty",
                    });
                }
            }
        }
    }
    catch (error) {
        res.status(500).send({
            error: JSON.stringify(error),
            message: "Something went wrong",
        });
    }
}));
router.delete("/asteroids/:name", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _10;
    try {
        yield ((_10 = main_1.collections.asteroids) === null || _10 === void 0 ? void 0 : _10.deleteOne({
            name: decodeURIComponent(req.params.name),
        }));
        res.send({
            name: decodeURIComponent(req.params.name),
        });
    }
    catch (error) {
        res.status(500).send({
            error: JSON.stringify(error),
            message: "Something went wrong",
        });
    }
}));
exports.default = router;
