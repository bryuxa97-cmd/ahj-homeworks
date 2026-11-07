import formatDate from "./formatDate";

const CHECK_ICON = `
  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
    <path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M5 12.5 9.2 16.8 19 7.2"/>
  </svg>
`;

const PENCIL_ICON = `
  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
    <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" d="M4 16.8V20h3.2L19.2 8.1 16 4.8 4 16.8z"/>
    <path stroke="currentColor" stroke-width="1.7" d="m14.2 6.6 3.2 3.2"/>
  </svg>
`;

export default class HelpDesk {
  constructor(container, api) {
    this.container = container;
    this.api = api;
    this.tickets = [];
    this.openedId = null;
    this.descriptions = new Map();
    this.pending = 0;
    this.modalMode = null;
    this.modalTicketId = null;
    this.returnFocus = null;
  }

  init() {
    this.#renderShell();
    this.#bind();
    this.#withBusy(() => this.#loadTickets());
  }

  #renderShell() {
    this.container.innerHTML = `
      <main class="helpdesk">
        <header class="helpdesk__header">
          <p class="helpdesk__error" data-role="error" hidden></p>
          <div class="helpdesk__tools">
            <span class="spinner" data-role="spinner" hidden aria-label="Загрузка"></span>
            <button type="button" class="button" data-action="add">Добавить тикет</button>
          </div>
        </header>
        <section class="tickets" data-role="list" aria-live="polite"></section>
      </main>
      <div class="modal" data-role="modal" hidden>
        <button type="button" class="modal__backdrop" data-action="cancel" aria-label="Закрыть"></button>
        <div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <h2 class="modal__title" id="modal-title" data-role="modal-title"></h2>
          <form class="modal__form" data-role="form">
            <label class="field">
              <span>Краткое описание</span>
              <input name="name" type="text" autocomplete="off" data-role="name">
            </label>
            <label class="field">
              <span>Подробное описание</span>
              <textarea name="description" rows="3" data-role="description"></textarea>
            </label>
            <p class="modal__hint" data-role="form-error" hidden></p>
            <div class="modal__actions">
              <button type="button" class="button" data-action="cancel">Отмена</button>
              <button type="submit" class="button">Ок</button>
            </div>
          </form>
          <div data-role="confirm" hidden>
            <p class="modal__text">Вы уверены, что хотите удалить тикет? Это действие необратимо.</p>
            <div class="modal__actions">
              <button type="button" class="button" data-action="cancel">Отмена</button>
              <button type="button" class="button" data-action="confirm-delete">Ок</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.els = {
      error: this.container.querySelector('[data-role="error"]'),
      spinner: this.container.querySelector('[data-role="spinner"]'),
      list: this.container.querySelector('[data-role="list"]'),
      modal: this.container.querySelector('[data-role="modal"]'),
      title: this.container.querySelector('[data-role="modal-title"]'),
      form: this.container.querySelector('[data-role="form"]'),
      name: this.container.querySelector('[data-role="name"]'),
      description: this.container.querySelector('[data-role="description"]'),
      formError: this.container.querySelector('[data-role="form-error"]'),
      confirm: this.container.querySelector('[data-role="confirm"]'),
    };
  }

  #bind() {
    this.container.addEventListener("click", (event) => {
      const actionElement = event.target.closest("[data-action]");

      if (!actionElement || !this.container.contains(actionElement)) {
        return;
      }

      const action = actionElement.dataset.action;
      const ticket = actionElement.closest(".ticket");
      const id = ticket?.dataset.id;

      if (action === "add") {
        this.returnFocus = actionElement;
        this.#openModal("create");
        return;
      }

      if (action === "details" && id) {
        this.#toggleDetails(id);
        return;
      }

      if (action === "toggle" && id) {
        event.stopPropagation();
        this.#toggleStatus(
          id,
          actionElement.getAttribute("aria-pressed") !== "true",
        );
        return;
      }

      if (action === "edit" && id) {
        event.stopPropagation();
        this.returnFocus = actionElement;
        this.#openEdit(id);
        return;
      }

      if (action === "delete" && id) {
        event.stopPropagation();
        this.returnFocus = actionElement;
        this.#openModal("delete", { id });
        return;
      }

      if (action === "cancel") {
        this.#closeModal();
        return;
      }

      if (action === "confirm-delete") {
        this.#deleteCurrent();
      }
    });

    this.els.form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.#submitForm();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !this.els.modal.hidden) {
        this.#closeModal();
      }
    });
  }

  async #loadTickets() {
    this.tickets = await this.api.allTickets();

    if (
      this.openedId &&
      !this.tickets.some((ticket) => ticket.id === this.openedId)
    ) {
      this.openedId = null;
    }

    this.#renderList();
  }

  async #withBusy(task) {
    this.#setBusy(true);
    this.#showError("");

    try {
      await task();
    } catch (error) {
      this.#showError(error.message);
      return false;
    } finally {
      this.#setBusy(false);
    }

    return true;
  }

  #renderList() {
    this.els.list.replaceChildren();

    if (this.tickets.length === 0) {
      const empty = document.createElement("p");
      empty.className = "tickets__empty";
      empty.textContent = "Заявок пока нет";
      this.els.list.append(empty);
      return;
    }

    this.tickets.forEach((ticket) => {
      this.els.list.append(this.#createTicketElement(ticket));
    });
  }

  #createTicketElement(ticket) {
    const article = document.createElement("article");
    article.className = ticket.status ? "ticket ticket--done" : "ticket";
    article.dataset.id = ticket.id;

    const row = document.createElement("div");
    row.className = "ticket__main";
    row.dataset.action = "details";

    const check = document.createElement("button");
    check.type = "button";
    check.className = "ticket__check";
    check.dataset.action = "toggle";
    check.setAttribute("aria-pressed", String(ticket.status));
    check.setAttribute(
      "aria-label",
      ticket.status ? "Отметить невыполненным" : "Отметить выполненным",
    );
    check.innerHTML = CHECK_ICON;

    const name = document.createElement("button");
    name.type = "button";
    name.className = "ticket__name";
    name.dataset.action = "details";
    name.textContent = ticket.name;

    const time = document.createElement("time");
    time.className = "ticket__date";
    time.dateTime = new Date(ticket.created).toISOString();
    time.textContent = formatDate(ticket.created);

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "ticket__icon";
    edit.dataset.action = "edit";
    edit.setAttribute("aria-label", "Редактировать");
    edit.innerHTML = PENCIL_ICON;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "ticket__icon";
    remove.dataset.action = "delete";
    remove.setAttribute("aria-label", "Удалить");
    remove.textContent = "×";

    row.append(check, name, time, edit, remove);
    article.append(row);

    if (this.openedId === ticket.id) {
      const description = document.createElement("div");
      description.className = "ticket__description";
      description.textContent = this.descriptions.has(ticket.id)
        ? this.descriptions.get(ticket.id)
        : "Загрузка описания…";
      article.append(description);
    }

    return article;
  }

  async #toggleDetails(id) {
    if (this.openedId === id) {
      this.openedId = null;
      this.#renderList();
      return;
    }

    this.openedId = id;
    this.#renderList();

    if (this.descriptions.has(id)) {
      return;
    }

    const loaded = await this.#withBusy(async () => {
      const ticket = await this.api.ticketById(id);
      this.descriptions.set(id, ticket.description);

      if (this.openedId === id) {
        this.#renderList();
      }
    });

    if (!loaded && this.openedId === id) {
      this.openedId = null;
      this.#renderList();
    }
  }

  #toggleStatus(id, status) {
    return this.#withBusy(async () => {
      await this.api.updateStatus(id, status);
      await this.#loadTickets();
    });
  }

  #openEdit(id) {
    return this.#withBusy(async () => {
      const ticket = await this.api.ticketById(id);
      this.descriptions.set(id, ticket.description);
      this.#openModal("edit", ticket);
    });
  }

  #openModal(mode, ticket = null) {
    this.modalMode = mode;
    this.modalTicketId = ticket?.id || null;
    this.els.formError.hidden = true;
    this.els.formError.textContent = "";

    const isDelete = mode === "delete";
    this.els.form.hidden = isDelete;
    this.els.confirm.hidden = !isDelete;
    this.els.title.textContent =
      mode === "create"
        ? "Добавить тикет"
        : mode === "edit"
          ? "Изменить тикет"
          : "Удалить тикет";

    this.els.name.value = ticket?.name || "";
    this.els.description.value = ticket?.description || "";
    this.els.modal.hidden = false;

    if (isDelete) {
      this.els.confirm.querySelector("[data-action='cancel']").focus();
      return;
    }

    this.els.name.focus();
  }

  #closeModal() {
    this.els.modal.hidden = true;
    this.modalMode = null;
    this.modalTicketId = null;
    this.returnFocus?.focus();
    this.returnFocus = null;
  }

  async #submitForm() {
    const name = this.els.name.value.trim();
    const description = this.els.description.value;

    if (!name) {
      this.els.formError.hidden = false;
      this.els.formError.textContent = "Введите краткое описание";
      this.els.name.focus();
      return;
    }

    const id = this.modalTicketId;
    const mode = this.modalMode;
    this.#closeModal();

    return this.#withBusy(async () => {
      if (mode === "create") {
        await this.api.createTicket({ name, description });
      } else {
        await this.api.updateTicket({ id, name, description });
        this.descriptions.set(id, description);
      }

      await this.#loadTickets();
    });
  }

  #deleteCurrent() {
    const id = this.modalTicketId;
    this.#closeModal();

    return this.#withBusy(async () => {
      await this.api.deleteTicket(id);
      this.descriptions.delete(id);

      if (this.openedId === id) {
        this.openedId = null;
      }

      await this.#loadTickets();
    });
  }

  #setBusy(active) {
    this.pending += active ? 1 : -1;

    if (this.pending < 0) {
      this.pending = 0;
    }

    this.els.spinner.hidden = this.pending === 0;
    this.container.setAttribute("aria-busy", String(this.pending > 0));
  }

  #showError(message) {
    this.els.error.hidden = !message;
    this.els.error.textContent = message;
  }
}
