import { Server } from "ws";

const wss = new Server({ host: "localhost", port: 8081 });

const subscriptions = {
  miners: [],
  planets: [],
  asteroids: [],
};

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {});

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});
