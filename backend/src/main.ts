import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import router from "./apis";
import * as mongodb from "mongodb";
import winston from "winston";
import mongoSanitize from "express-mongo-sanitize";

// Load environment variables from .env file, where API keys and passwords are configured
dotenv.config();

// Create a logger
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: "silly",
    }),
  ],
  format: winston.format.combine(
    winston.format.label({ label: "Slingshot" }),
    winston.format.timestamp(),
    winston.format.printf(({ level, message, label, timestamp }) => {
      return `${timestamp} [${label}] ${level}: ${message}`;
    })
  ),
});

const port = process.env.PORT;
const app = express();

app.listen(port, () => {
  logger.info(`⚡️[server]: Server is running at https://localhost:${port}`);
});

app.use(bodyParser.json());
app.use("/", router);
app.use(
  mongoSanitize({
    replaceWith: '_',
  }),
);

// An object for collections to mount on
const collections: {
  miners?: mongodb.Collection;
  planets?: mongodb.Collection;
  asteroids?: mongodb.Collection;
} = {};

// Connect to the database
async function connectToDatabase() {
  logger.verbose(`Connecting to database: ${process.env.DB_NAME}}`);

  const client: mongodb.MongoClient = new mongodb.MongoClient(
    process.env.MONGO_URL as string
  );
  await client.connect();
  const db: mongodb.Db = client.db(process.env.DB_NAME);

  const minerCollection: mongodb.Collection = db.collection("miners");
  const planetCollection: mongodb.Collection = db.collection("planets");
  const asteroidCollection: mongodb.Collection = db.collection("asteroids");

  collections.miners = minerCollection;
  collections.planets = planetCollection;
  collections.asteroids = asteroidCollection;

  logger.info({
    level: "info",
    message: `Connected to database: ${process.env.DB_NAME}`,
  });
}

connectToDatabase().then(r => logger.silly('connect to database complete'));

export { app, collections };
