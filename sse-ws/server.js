const http = require("http");
const { WebSocketServer, WebSocket } = require("ws");

const NAME_LIMIT = 30;
const TEXT_LIMIT = 1000;
const HISTORY_LIMIT = 100;
const HEARTBEAT_MS = 30000;

function createChat() {
  const clients = new Map();
  const names = new Set();
  const messages = [];

  function listUsers() {
    return [...clients.values()].map((user) => user.name);
  }

  function send(socket, payload) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
    }
  }

  function broadcast(payload, except) {
    const data = JSON.stringify(payload);

    for (const socket of clients.keys()) {
      if (socket !== except && socket.readyState === WebSocket.OPEN) {
        socket.send(data);
      }
    }
  }

  function remove(socket) {
    const user = clients.get(socket);
    if (!user) return;

    clients.delete(socket);
    names.delete(user.key);
    broadcast({ type: "users", users: listUsers() });
  }

  function readName(value) {
    const name = String(value ?? "")
      .trim()
      .replace(/\s+/g, " ");

    if (!name) return { error: "Введите псевдоним" };

    if (name.length > NAME_LIMIT) {
      return { error: `Псевдоним не длиннее ${NAME_LIMIT} символов` };
    }

    if (name.toLowerCase() === "you") {
      return { error: "Псевдоним You зарезервирован" };
    }

    if (names.has(name.toLowerCase())) {
      return { error: "Этот псевдоним уже занят, выберите другой" };
    }

    return { name };
  }

  function login(socket, data) {
    if (clients.has(socket)) return;

    const result = readName(data.name);

    if (result.error) {
      send(socket, { type: "login-error", message: result.error });
      return;
    }

    const user = { name: result.name, key: result.name.toLowerCase() };
    clients.set(socket, user);
    names.add(user.key);

    send(socket, {
      type: "login-ok",
      name: user.name,
      users: listUsers(),
      messages: messages.slice(),
    });
    broadcast({ type: "users", users: listUsers() }, socket);
  }

  function publish(socket, data) {
    const user = clients.get(socket);
    if (!user) return;

    const text = String(data.text ?? "").trim();
    if (!text) return;

    const message = {
      name: user.name,
      text: text.slice(0, TEXT_LIMIT),
      date: new Date().toISOString(),
    };

    messages.push(message);
    if (messages.length > HISTORY_LIMIT) messages.shift();

    broadcast({ type: "message", ...message });
  }

  function onMessage(socket, raw) {
    let data;

    try {
      data = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (!data || typeof data !== "object" || Array.isArray(data)) return;

    if (data.type === "login") {
      login(socket, data);
      return;
    }

    if (data.type === "message") publish(socket, data);
  }

  return { onMessage, remove };
}

function attachChat(httpServer) {
  if (httpServer.chatAttached) return;
  httpServer.chatAttached = true;

  const chat = createChat();
  const wss = new WebSocketServer({ server: httpServer, path: "/chat" });
  const heartbeat = setInterval(() => {
    for (const socket of wss.clients) {
      if (socket.isAlive === false) {
        socket.terminate();
        continue;
      }

      socket.isAlive = false;
      socket.ping();
    }
  }, HEARTBEAT_MS);
  heartbeat.unref();

  wss.on("connection", (socket) => {
    socket.isAlive = true;
    socket.on("pong", () => {
      socket.isAlive = true;
    });
    socket.on("message", (raw) => chat.onMessage(socket, raw));
    socket.on("close", () => chat.remove(socket));
  });

  httpServer.on("close", () => {
    clearInterval(heartbeat);
    wss.close();
  });
}

function createServer() {
  const httpServer = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("ok");
  });

  const sockets = new Set();
  httpServer.on("connection", (socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
  });

  attachChat(httpServer);

  httpServer.closeSockets = () => {
    for (const socket of sockets) socket.destroy();
  };

  return httpServer;
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 7070;
  createServer().listen(port, () => {
    console.log(`Chat server listening on ${port}`);
  });
}

module.exports = { createServer, attachChat };
