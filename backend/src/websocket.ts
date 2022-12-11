import { Server } from "ws";
import { MessageBody, subject } from "./pubsub";

const wss = new Server({ host: "localhost", port: 8081 });

wss.on("connection", (ws) => {
  console.log("Client connected");

  subject.subscribe((msg: MessageBody) => {
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(msg));
      }
    });
  });

  ws.on("message", (message) => {
    if (message.toString() == "ping") {
      ws.send("pong");
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});
