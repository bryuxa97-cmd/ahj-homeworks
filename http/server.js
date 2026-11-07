const http = require("http");
const Koa = require("koa");
const bodyParser = require("koa-bodyparser");
const cors = require("@koa/cors");
const { createStore, seedTickets } = require("./store");

function readBody(ctx) {
  return ctx.request.body && typeof ctx.request.body === "object"
    ? ctx.request.body
    : {};
}

function handle(ctx, store) {
  const { method, id: queryId } = ctx.query;
  const body = readBody(ctx);
  const id = queryId || body.id;

  if (method === "allTickets") {
    ctx.body = store.all();
    return;
  }

  if (method === "ticketById") {
    if (!id) {
      ctx.status = 400;
      ctx.body = { message: "Не передан идентификатор тикета" };
      return;
    }

    const ticket = store.byId(id);

    if (!ticket) {
      ctx.status = 404;
      ctx.body = { message: "Тикет не найден" };
      return;
    }

    ctx.body = ticket;
    return;
  }

  const mutations = new Set([
    "createTicket",
    "updateTicket",
    "deleteTicket",
    "updateStatus",
  ]);

  if (mutations.has(method) && ctx.method !== "POST") {
    ctx.status = 405;
    ctx.body = { message: "Метод запроса должен быть POST" };
    return;
  }

  if (method === "createTicket") {
    const name = body.name === undefined ? "" : String(body.name).trim();

    if (!name) {
      ctx.status = 400;
      ctx.body = { message: "Краткое описание обязательно" };
      return;
    }

    const ticket = store.add({
      name,
      description: body.description || "",
      status: body.status,
    });

    ctx.status = 201;
    ctx.body = ticket;
    return;
  }

  if (method === "updateTicket") {
    if (!id) {
      ctx.status = 400;
      ctx.body = { message: "Не передан идентификатор тикета" };
      return;
    }

    const name = body.name === undefined ? undefined : String(body.name).trim();

    if (name !== undefined && !name) {
      ctx.status = 400;
      ctx.body = { message: "Краткое описание обязательно" };
      return;
    }

    const ticket = store.update(id, {
      name,
      description: body.description,
    });

    if (!ticket) {
      ctx.status = 404;
      ctx.body = { message: "Тикет не найден" };
      return;
    }

    ctx.body = ticket;
    return;
  }

  if (method === "deleteTicket") {
    if (!id) {
      ctx.status = 400;
      ctx.body = { message: "Не передан идентификатор тикета" };
      return;
    }

    if (!store.remove(id)) {
      ctx.status = 404;
      ctx.body = { message: "Тикет не найден" };
      return;
    }

    ctx.body = { success: true };
    return;
  }

  if (method === "updateStatus") {
    if (!id || body.status === undefined) {
      ctx.status = 400;
      ctx.body = { message: "Нужны идентификатор и статус тикета" };
      return;
    }

    const ticket = store.setStatus(id, body.status);

    if (!ticket) {
      ctx.status = 404;
      ctx.body = { message: "Тикет не найден" };
      return;
    }

    ctx.body = ticket;
    return;
  }

  ctx.status = 404;
  ctx.body = { message: "Неизвестный метод" };
}

function createServer(store = createStore()) {
  if (store.all().length === 0) {
    seedTickets(store);
  }

  const app = new Koa();

  app.use(cors());
  app.use(
    bodyParser({
      enableTypes: ["json", "form"],
    }),
  );

  app.use(async (ctx) => {
    try {
      handle(ctx, store);
    } catch (error) {
      console.error(error);
      ctx.status = 500;
      ctx.body = { message: "Внутренняя ошибка сервера" };
    }
  });

  return http.createServer(app.callback());
}

if (require.main === module) {
  const port = process.env.PORT || 7070;

  createServer().listen(port, () => {
    console.log(`Server is listening to ${port}`);
  });
}

module.exports = {
  createServer,
  handle,
};
