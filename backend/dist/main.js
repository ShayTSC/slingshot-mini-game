"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.collections = exports.app = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const apis_1 = __importDefault(require("./apis"));
const mongodb = __importStar(require("mongodb"));
const winston_1 = __importDefault(require("winston"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
// Load environment variables from .env file, where API keys and passwords are configured
dotenv_1.default.config();
// Create a logger
const logger = winston_1.default.createLogger({
    transports: [
        new winston_1.default.transports.Console({
            level: "silly",
        }),
    ],
    format: winston_1.default.format.combine(winston_1.default.format.label({ label: "Slingshot" }), winston_1.default.format.timestamp(), winston_1.default.format.printf(({ level, message, label, timestamp }) => {
        return `${timestamp} [${label}] ${level}: ${message}`;
    })),
});
const port = process.env.PORT;
const app = (0, express_1.default)();
exports.app = app;
app.listen(port, () => {
    logger.info(`⚡️[server]: Server is running at https://localhost:${port}`);
});
app.use(body_parser_1.default.json());
app.use("/", apis_1.default);
app.use((0, express_mongo_sanitize_1.default)({
    replaceWith: '_',
}));
// An object for collections to mount on
const collections = {};
exports.collections = collections;
// Connect to the database
function connectToDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        logger.verbose(`Connecting to database: ${process.env.DB_NAME}}`);
        const client = new mongodb.MongoClient(process.env.MONGO_URL);
        yield client.connect();
        const db = client.db(process.env.DB_NAME);
        const minerCollection = db.collection("miners");
        const planetCollection = db.collection("planets");
        const asteroidCollection = db.collection("asteroids");
        collections.miners = minerCollection;
        collections.planets = planetCollection;
        collections.asteroids = asteroidCollection;
        logger.info({
            level: "info",
            message: `Connected to database: ${process.env.DB_NAME}`,
        });
    });
}
connectToDatabase().then(r => logger.silly('connect to database complete'));
