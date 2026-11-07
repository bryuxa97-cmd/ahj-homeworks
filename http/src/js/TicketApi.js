export default class TicketApi {
  constructor(baseUrl = __API_URL__) {
    this.baseUrl = baseUrl;
  }

  allTickets() {
    return this.#request("allTickets");
  }

  ticketById(id) {
    return this.#request("ticketById", { query: { id } });
  }

  createTicket({ name, description }) {
    return this.#request("createTicket", {
      method: "POST",
      body: { name, description, status: false },
    });
  }

  updateTicket({ id, name, description }) {
    return this.#request("updateTicket", {
      method: "POST",
      body: { id, name, description },
    });
  }

  deleteTicket(id) {
    return this.#request("deleteTicket", {
      method: "POST",
      query: { id },
    });
  }

  updateStatus(id, status) {
    return this.#request("updateStatus", {
      method: "POST",
      body: { id, status },
    });
  }

  async #request(methodName, { method = "GET", query = {}, body } = {}) {
    const url = new URL(this.baseUrl);
    url.searchParams.set("method", methodName);

    Object.entries(query).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });

    const options = { method };

    if (body) {
      options.headers = { "Content-Type": "application/x-www-form-urlencoded" };
      options.body = new URLSearchParams(
        Object.entries(body).map(([key, value]) => [key, String(value)]),
      );
    }

    let response;

    try {
      response = await fetch(url, options);
    } catch {
      throw new Error("Нет соединения с сервером");
    }

    const text = await response.text();
    let data = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Сервер вернул некорректный ответ");
      }
    }

    if (!response.ok) {
      throw new Error(data?.message || `Ошибка сервера: ${response.status}`);
    }

    return data;
  }
}
