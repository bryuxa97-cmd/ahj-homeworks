const assert = require("node:assert/strict");
const test = require("node:test");
const { createServer } = require("./server");
const { createStore } = require("./store");

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server.address().port));
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function withServer(callback, store) {
  const server = createServer(store);
  const port = await listen(server);
  const base = `http://127.0.0.1:${port}`;

  try {
    await callback(base);
  } finally {
    await close(server);
  }
}

test("allTickets отдаёт краткие тикеты без description", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/?method=allTickets`);
    const tickets = await response.json();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("access-control-allow-origin"), "*");
    assert.equal(tickets.length, 3);
    assert.equal(Object.hasOwn(tickets[0], "description"), false);
    assert.equal(tickets[0].name, "Поменять краску в принтере, ком. 404");
    assert.equal(tickets[2].status, true);
  });
});

test("создание, чтение, изменение, статус и удаление тикета", async () => {
  await withServer(async (base) => {
    const createdResponse = await fetch(`${base}/?method=createTicket`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        name: "  Проверить почту  ",
        description: "Письмо от бухгалтерии",
        status: "false",
      }),
    });
    const created = await createdResponse.json();

    assert.equal(createdResponse.status, 201);
    assert.equal(created.name, "Проверить почту");
    assert.equal(created.description, "Письмо от бухгалтерии");
    assert.equal(created.status, false);
    assert.equal(typeof created.id, "string");
    assert.equal(typeof created.created, "number");

    const fullResponse = await fetch(
      `${base}/?method=ticketById&id=${created.id}`,
    );
    const full = await fullResponse.json();
    assert.equal(full.description, "Письмо от бухгалтерии");

    const shortList = await fetch(`${base}/?method=allTickets`).then(
      (response) => response.json(),
    );
    const short = shortList.find((ticket) => ticket.id === created.id);
    assert.equal(Object.hasOwn(short, "description"), false);

    const updatedResponse = await fetch(`${base}/?method=updateTicket`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: created.id,
        name: "Ответить на письмо",
        description: "Счёт уже оплачен",
      }),
    });
    const updated = await updatedResponse.json();
    assert.equal(updated.name, "Ответить на письмо");
    assert.equal(updated.status, false);
    assert.equal(updated.description, "Счёт уже оплачен");

    const statusResponse = await fetch(`${base}/?method=updateStatus`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ id: created.id, status: "true" }),
    });
    const statusTicket = await statusResponse.json();
    assert.equal(statusTicket.status, true);
    assert.equal(Object.hasOwn(statusTicket, "description"), false);

    const saved = await fetch(
      `${base}/?method=ticketById&id=${created.id}`,
    ).then((response) => response.json());
    assert.equal(saved.status, true);
    assert.equal(saved.description, "Счёт уже оплачен");

    const deletedResponse = await fetch(
      `${base}/?method=deleteTicket&id=${created.id}`,
      {
        method: "POST",
      },
    );
    assert.deepEqual(await deletedResponse.json(), { success: true });

    const missing = await fetch(`${base}/?method=ticketById&id=${created.id}`);
    assert.equal(missing.status, 404);
  });
});

test("пустые и неизвестные запросы отклоняются", async () => {
  const store = createStore();
  store.add({
    name: "Существующий",
    description: "Текст",
    status: false,
    id: "fixed-id",
  });

  await withServer(async (base) => {
    const empty = await fetch(`${base}/?method=createTicket`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "   ", description: "без названия" }),
    });
    assert.equal(empty.status, 400);

    const wrongVerb = await fetch(`${base}/?method=deleteTicket&id=fixed-id`);
    assert.equal(wrongVerb.status, 405);

    const unknown = await fetch(`${base}/?method=unknown`);
    assert.equal(unknown.status, 404);

    const stillThere = await fetch(`${base}/?method=ticketById&id=fixed-id`);
    assert.equal(stillThere.status, 200);
  }, store);
});
