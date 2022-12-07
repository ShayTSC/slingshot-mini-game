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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const xstate_1 = require("xstate");
const main_1 = require("./main");
const uilts_1 = require("./uilts");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const MinerStateMap = ["Idle", "Traveling", "Mining", "Transferring"];
class EventLoop {
    constructor() {
        this.miners = [];
        this.machines = [];
    }
    travel(miner) {
        var _a, _b, _c, _d, _e, _f;
        return __awaiter(this, void 0, void 0, function* () {
            let position = {
                x: 0,
                y: 0,
            };
            // Find is there lefted task in the history (service suspend)
            const history = yield ((_a = main_1.collections.history) === null || _a === void 0 ? void 0 : _a.find({
                minerId: miner.id,
            }).sort({ timstamp: -1 }).toArray());
            // If there is, get the last recorded position
            const lastState = history ? (_b = history === null || history === void 0 ? void 0 : history[0]) === null || _b === void 0 ? void 0 : _b.state : undefined;
            if (lastState === 1) {
                position = (_c = history === null || history === void 0 ? void 0 : history[0]) === null || _c === void 0 ? void 0 : _c.metadata.currentPosition;
            }
            else {
                const planet = yield ((_d = main_1.collections.planets) === null || _d === void 0 ? void 0 : _d.findOne({
                    id: miner.planetId,
                }));
                position = planet === null || planet === void 0 ? void 0 : planet.position;
            }
            // List all asteroids with minerals amount > 0
            // Theretically this algo should calculated with both distance
            // And minerals amount, but for now we just use distance
            const asteroids = yield ((_e = main_1.collections.asteroids) === null || _e === void 0 ? void 0 : _e.find({
                minerals: {
                    $gt: 0,
                },
            }).toArray());
            const distances = [];
            if (asteroids) {
                for (let a of asteroids) {
                    const distance = new bignumber_js_1.default(a.position.x)
                        .minus(position.x)
                        .pow(2)
                        .plus(new bignumber_js_1.default(a.position.y).minus(position.y).pow(2))
                        .sqrt();
                    distances.push(Number(distance.toFixed(0)));
                }
                const index = distances.findIndex((d) => d === Math.min(...distances));
                const timespan = new bignumber_js_1.default(distances[index]).dividedBy(new bignumber_js_1.default(miner.travelSpeed).div(1000));
                yield ((_f = main_1.collections.history) === null || _f === void 0 ? void 0 : _f.insertOne({
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
                }));
                yield (0, uilts_1.sleep)(Number(timespan));
            }
        });
    }
    init() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const miners = yield ((_a = main_1.collections.miners) === null || _a === void 0 ? void 0 : _a.find().toArray());
                if (miners) {
                    this.miners = miners;
                    this.miners.map((miner) => __awaiter(this, void 0, void 0, function* () {
                        var _b, _c;
                        const history = yield ((_b = main_1.collections.history) === null || _b === void 0 ? void 0 : _b.find({
                            minerId: miner.id,
                        }).sort({ timstamp: -1 }).toArray());
                        const lastState = history ? (_c = history === null || history === void 0 ? void 0 : history[0]) === null || _c === void 0 ? void 0 : _c.state : undefined;
                        const machine = (0, xstate_1.createMachine)({
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
                        const service = (0, xstate_1.interpret)(machine).start();
                        service.subscribe((state) => {
                            main_1.logger.debug(`miner: ${miner.id} => ${state.value}`);
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
                    }));
                }
            }
            catch (error) {
                main_1.logger.error(error);
            }
        });
    }
}
exports.default = EventLoop;
