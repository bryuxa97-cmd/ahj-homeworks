const assert = require("node:assert/strict");
const test = require("node:test");
const { createServer } = require("./server");

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server.address().port));
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.closeSockets();
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function connect(port) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(`ws://127.0.0.1:${port}`);
    socket.addEventListener("open", () => resolve(socket));
    socket.addEventListener("error", () => reject(new Error("socket error")));
  });
}

function nextEvent(socket) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), 2000);
    socket.addEventListener(
      "message",
      (event) => {
        clearTimeout(timer);
        resolve(JSON.parse(String(event.data)));
      },
      { once: true },
    );
  });
}

async function withServer(callback) {
  const server = createServer();
  const port = await listen(server);
  const opened = [];

  try {
    await callback(port, opened);
  } finally {
    for (const socket of opened) socket.close();
    await close(server);
  }
}

async function login(port, opened, name) {
  const socket = await connect(port);
  opened.push(socket);
  const pending = nextEvent(socket);
  socket.send(JSON.stringify({ type: "login", name }));
  const event = await pending;
  return { socket, event };
}

test("свободный псевдоним открывает чат и занимает имя", async () => {
  await withServer(async (port, opened) => {
    const first = await login(port, opened, "  Alexandra  ");
    assert.equal(first.event.type, "login-ok");
    assert.equal(first.event.name, "Alexandra");
    assert.deepEqual(first.event.users, ["Alexandra"]);
    assert.deepEqual(first.event.messages, []);

    const second = await login(port, opened, "alexandra");
    assert.equal(second.event.type, "login-error");
    assert.equal(
      second.event.message,
      "Этот псевдоним уже занят, выберите другой",
    );
  });
});

test("пустой псевдоним и You не регистрируются", async () => {
  await withServer(async (port, opened) => {
    const empty = await login(port, opened, "   ");
    assert.equal(empty.event.type, "login-error");
    assert.equal(empty.event.message, "Введите псевдоним");

    const reserved = await login(port, opened, "You");
    assert.equal(reserved.event.type, "login-error");
    assert.equal(reserved.event.message, "Псевдоним You зарезервирован");
  });
});

test("сообщения видят оба участника и новичок получает историю", async () => {
  await withServer(async (port, opened) => {
    const alexandra = await login(port, opened, "Alexandra");
    const own = nextEvent(alexandra.socket);
    alexandra.socket.send(
      JSON.stringify({ type: "message", text: "  I can't sleep...  " }),
    );
    const delivered = await own;

    assert.equal(delivered.type, "message");
    assert.equal(delivered.name, "Alexandra");
    assert.equal(delivered.text, "I can't sleep...");
    assert.equal(Number.isNaN(Date.parse(delivered.date)), false);

    const petr = await login(port, opened, "Petr");
    assert.equal(petr.event.type, "login-ok");
    assert.deepEqual(
      petr.event.messages.map((message) => message.text),
      ["I can't sleep..."],
    );
    assert.deepEqual(petr.event.users, ["Alexandra", "Petr"]);
  });
});

test("сообщение без входа никому не приходит", async () => {
  await withServer(async (port, opened) => {
    const member = await login(port, opened, "Petr");
    const guest = await connect(port);
    opened.push(guest);

    let leaked = false;
    member.socket.addEventListener("message", () => {
      leaked = true;
    });

    guest.send("не json");
    guest.send(JSON.stringify({ type: "message", text: "secret" }));
    await new Promise((resolve) => setTimeout(resolve, 150));

    assert.equal(leaked, false);
  });
});

test("при отключении участник пропадает из списка", async () => {
  await withServer(async (port, opened) => {
    const alexandra = await login(port, opened, "Alexandra");
    const petrJoin = nextEvent(alexandra.socket);
    const petr = await login(port, opened, "Petr");
    const joined = await petrJoin;
    assert.deepEqual(joined.users, ["Alexandra", "Petr"]);

    const left = nextEvent(alexandra.socket);
    petr.socket.close();
    const update = await left;

    assert.equal(update.type, "users");
    assert.deepEqual(update.users, ["Alexandra"]);
  });
});
