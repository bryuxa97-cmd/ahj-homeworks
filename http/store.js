const { randomUUID } = require("crypto");

function parseStatus(value) {
  if (typeof value === "boolean") {
    return value;
  }

  return value === "true" || value === "1";
}

function createStore() {
  const tickets = [];

  function add({
    name,
    description = "",
    status = false,
    created = Date.now(),
    id = randomUUID(),
  }) {
    const ticket = {
      id,
      name: String(name).trim(),
      description: String(description),
      status: parseStatus(status),
      created: Number(created),
    };

    tickets.push(ticket);
    return ticket;
  }

  function toShort(ticket) {
    return {
      id: ticket.id,
      name: ticket.name,
      status: ticket.status,
      created: ticket.created,
    };
  }

  function all() {
    return tickets.map(toShort);
  }

  function byId(id) {
    return tickets.find((ticket) => ticket.id === id) || null;
  }

  function update(id, { name, description }) {
    const ticket = byId(id);

    if (!ticket) {
      return null;
    }

    if (name !== undefined) {
      ticket.name = String(name).trim();
    }

    if (description !== undefined) {
      ticket.description = String(description);
    }

    return ticket;
  }

  function remove(id) {
    const index = tickets.findIndex((ticket) => ticket.id === id);

    if (index === -1) {
      return false;
    }

    tickets.splice(index, 1);
    return true;
  }

  function setStatus(id, status) {
    const ticket = byId(id);

    if (!ticket) {
      return null;
    }

    ticket.status = parseStatus(status);
    return toShort(ticket);
  }

  return {
    add,
    all,
    byId,
    update,
    remove,
    setStatus,
  };
}

function seedTickets(store) {
  store.add({
    name: "Поменять краску в принтере, ком. 404",
    description: "Принтер HP LJ 1210, картриджи на складе",
    status: false,
    created: new Date(2019, 2, 10, 8, 40).getTime(),
  });
  store.add({
    name: "Переустановить Windows, ПК-Hall24",
    description: "Нужно сохранить данные пользователя перед переустановкой.",
    status: false,
    created: new Date(2019, 2, 15, 12, 35).getTime(),
  });
  store.add({
    name: "Установить обновление КВ-XXX",
    description:
      "Вышло критическое обновление для Windows, нужно поставить обновления в следующем приоритете:\n1. Сервера (не забыть сделать бэкап!)\n2. Рабочие станции",
    status: true,
    created: new Date(2019, 2, 15, 12, 40).getTime(),
  });
}

module.exports = {
  createStore,
  parseStatus,
  seedTickets,
};
