const mongodb = require("mongodb");
const dotenv = require("dotenv");

dotenv.config();

const url = process.env.MONGO_URL;
const dbName = process.env.DB_NAME;

const MongoClient = mongodb.MongoClient;

const asteroids = require("../sample/asteroids.json");
const miner = require("../sample/miners.json");
const planets = require("../sample/planets.json");

async function main() {
  const client = await MongoClient.connect(url);

  const db = client.db(dbName);

  const asteroidsCollection = db.collection("asteroids");
  const minerCollection = db.collection("miners");
  const planetsCollection = db.collection("planets");
  const historiesCollection = db.collection("histories");

  await asteroidsCollection.deleteMany({});
  await minerCollection.deleteMany({});
  await planetsCollection.deleteMany({});
  await historiesCollection.deleteMany({});

  await asteroidsCollection.insertMany(asteroids);
  await minerCollection.insertMany(miner);
  await planetsCollection.insertMany(planets);

  await client.close();
}

main().then(() => {
  console.log("DB Flushed");
}, console.error);
