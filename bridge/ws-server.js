"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { WebSocketServer } = require("ws");
const { AgentBridge } = require("./agent-bridge");
const { FixtureAdapter } = require("./adapters/fixture");

const PORT = Number(process.env.CONDUCTOR_PORT || 8080);
const bridge = new AgentBridge(new FixtureAdapter());
const clients = new Set();

function broadcast(message) {
  const payload = JSON.stringify(message);
  clients.forEach((socket) => {
    if (socket.readyState === 1) {
      socket.send(payload);
    }
  });
}

function serveVerify(req, res) {
  const url = req.url === "/" ? "/index.html" : req.url;
  const filePath = path.join(__dirname, "verify", url.replace(/^\/+/, ""));
  if (!filePath.startsWith(path.join(__dirname, "verify"))) {
    res.writeHead(403);
    res.end("forbidden");
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    const ext = path.extname(filePath);
    const types = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json" };
    res.writeHead(200, { "Content-Type": types[ext] || "text/plain" });
    res.end(data);
  });
}

const server = http.createServer(serveVerify);
const wss = new WebSocketServer({ server });

wss.on("connection", (socket) => {
  clients.add(socket);
  socket.send(
    JSON.stringify({
      type: "hello_ack",
      protocolVersion: "1.0",
      role: "bridge",
    })
  );
  socket.send(JSON.stringify(bridge.snapshot()));

  socket.on("message", (raw) => {
    let message;
    try {
      message = JSON.parse(String(raw));
    } catch (err) {
      socket.send(JSON.stringify({ type: "error", message: "invalid json" }));
      return;
    }

    if (message.type === "hello") {
      socket.send(
        JSON.stringify({
          type: "hello_ack",
          protocolVersion: "1.0",
          role: "bridge",
        })
      );
      socket.send(JSON.stringify(bridge.snapshot()));
      return;
    }

    if (message.type === "command") {
      const ack = bridge.applyCommand(message, broadcast);
      socket.send(JSON.stringify(ack));
      return;
    }
  });

  socket.on("close", () => {
    clients.delete(socket);
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("Conductor bridge on http://127.0.0.1:" + PORT + "  (ws://127.0.0.1:" + PORT + ")");
  console.log("Verify page: http://127.0.0.1:" + PORT + "/");
});
