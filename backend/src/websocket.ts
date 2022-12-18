import { logger, wss } from "./main";
import { MessageBody, subject } from "./pubsub";
import WebSocket from "ws";

export default function ws() {
  subject.subscribe({
    next: (msg: MessageBody) => {
      logger.silly(`Sending message to client: ${JSON.stringify(msg)}`);
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(msg));
        }
      });
    },
  });

  wss.on("connection", (ws) => {
    logger.info("Client connected");

    ws.on("message", (message) => {
      logger.info(`Received message => ${message}`);
      if (message.toString() == "ping") {
        ws.send("pong");
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected");
    });
  });
}
