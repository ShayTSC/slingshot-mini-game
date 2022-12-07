"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const wss = new ws_1.Server({ host: "localhost", port: 8081 });
const subscriptions = {
    miners: [],
    planets: [],
    asteroids: [],
};
wss.on("connection", (ws) => {
    console.log("Client connected");
    ws.on("message", (message) => { });
    ws.on("close", () => {
        console.log("Client disconnected");
    });
});
