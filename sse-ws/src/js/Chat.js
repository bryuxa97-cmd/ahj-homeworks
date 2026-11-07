import formatDate from "./formatDate";

export default class Chat {
  constructor(container, api) {
    this.container = container;
    this.api = api;
    this.name = null;
    this.connected = false;
    this.pending = false;
  }

  init() {
    this.#render();
    this.#bind();
    this.api.connect({
      onOpen: () => this.#onOpen(),
      onClose: () => this.#onClose(),
      onError: () => {},
      onEvent: (event) => this.#onEvent(event),
    });
    this.nameInput.focus();
  }

  #render() {
    this.container.innerHTML = `
      <form class="login">
        <h1 class="login__title">Выберите псевдоним</h1>
        <p class="login__error" role="alert"></p>
        <input class="login__name" name="name" maxlength="30" autocomplete="nickname" aria-label="Псевдоним" required />
        <button class="login__submit" type="submit" disabled>Продолжить</button>
      </form>
      <section class="workspace" hidden>
        <aside class="users" aria-label="Участники"></aside>
        <div class="panel">
          <p class="panel__error" role="alert" hidden></p>
          <div class="messages" role="log" aria-live="polite" aria-relevant="additions"></div>
          <form class="composer">
            <input class="composer__input" name="text" maxlength="1000" placeholder="Type your message here" aria-label="Сообщение" autocomplete="off" />
          </form>
        </div>
      </section>
    `;

    this.loginForm = this.container.querySelector(".login");
    this.loginError = this.container.querySelector(".login__error");
    this.nameInput = this.container.querySelector(".login__name");
    this.loginButton = this.container.querySelector(".login__submit");
    this.workspace = this.container.querySelector(".workspace");
    this.users = this.container.querySelector(".users");
    this.panelError = this.container.querySelector(".panel__error");
    this.messages = this.container.querySelector(".messages");
    this.composer = this.container.querySelector(".composer");
    this.messageInput = this.container.querySelector(".composer__input");
  }

  #bind() {
    this.loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      this.#login();
    });

    this.composer.addEventListener("submit", (event) => {
      event.preventDefault();
      this.#send();
    });
  }

  #login() {
    const name = this.nameInput.value.trim().replace(/\s+/g, " ");

    if (!name) {
      this.#showLoginError("Введите псевдоним");
      return;
    }

    if (name.toLowerCase() === "you") {
      this.#showLoginError("Псевдоним You зарезервирован");
      return;
    }

    if (!this.connected) {
      this.#showLoginError("Нет соединения с сервером");
      return;
    }

    this.pending = true;
    this.#showLoginError("");
    this.#syncLoginButton();

    if (!this.api.send({ type: "login", name })) {
      this.pending = false;
      this.#syncLoginButton();
      this.#showLoginError("Нет соединения с сервером");
    }
  }

  #send() {
    const text = this.messageInput.value.trim();
    if (!text || !this.name) return;

    if (this.api.send({ type: "message", text })) {
      this.messageInput.value = "";
    }
  }

  #onOpen() {
    this.connected = true;
    this.#syncLoginButton();
  }

  #onClose() {
    this.connected = false;
    this.pending = false;
    this.#syncLoginButton();

    if (!this.name) {
      this.#showLoginError("Нет соединения с сервером");
      return;
    }

    this.panelError.hidden = false;
    this.panelError.textContent = "Соединение потеряно";
    this.messageInput.disabled = true;
  }

  #onEvent(event) {
    if (event.type === "login-ok") {
      this.name = event.name;
      this.pending = false;
      this.loginForm.hidden = true;
      this.workspace.hidden = false;
      this.#renderUsers(event.users || []);
      this.#renderMessages(event.messages || []);
      this.messageInput.focus();
      return;
    }

    if (event.type === "login-error") {
      this.pending = false;
      this.#syncLoginButton();
      this.#showLoginError(event.message || "Не удалось войти");
      this.nameInput.focus();
      this.nameInput.select();
      return;
    }

    if (!this.name) return;

    if (event.type === "users") {
      this.#renderUsers(event.users || []);
      return;
    }

    if (event.type === "message") this.#appendMessage(event);
  }

  #showLoginError(message) {
    this.loginError.textContent = message;
  }

  #syncLoginButton() {
    this.loginButton.disabled = !this.connected || this.pending;
  }

  #renderUsers(users) {
    const others = users.filter((user) => user !== this.name);
    const ordered = users.includes(this.name) ? [...others, this.name] : others;

    this.users.replaceChildren(
      ...ordered.map((user) => {
        const self = user === this.name;
        const item = document.createElement("div");
        item.className = self ? "user user--self" : "user";

        const avatar = document.createElement("span");
        avatar.className = "user__avatar";
        avatar.setAttribute("aria-hidden", "true");

        const name = document.createElement("span");
        name.className = "user__name";
        name.textContent = self ? "You" : user;

        item.append(avatar, name);
        return item;
      }),
    );
  }

  #renderMessages(messages) {
    this.messages.replaceChildren();
    messages.forEach((message) => this.#appendMessage(message));
  }

  #appendMessage(message) {
    const own = message.name === this.name;
    const item = document.createElement("article");
    item.className = own ? "message message--own" : "message";

    const author = own ? "You" : message.name;
    const date = formatDate(message.date);
    const meta = document.createElement("p");
    meta.className = "message__meta";
    meta.textContent = date ? `${author}, ${date}` : author;

    const text = document.createElement("p");
    text.className = "message__text";
    text.textContent = message.text;

    item.append(meta, text);
    this.messages.append(item);
    this.messages.scrollTop = this.messages.scrollHeight;
  }
}
