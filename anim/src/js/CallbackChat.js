export default class CallbackChat {
  constructor(container) {
    this.container = container;
    this.isOpen = false;
    this.render();
    this.button.addEventListener("click", () => this.open());
    this.closeButton.addEventListener("click", () => this.close());
    this.form.addEventListener("submit", (event) => event.preventDefault());
    this.container.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.isOpen) {
        this.close();
      }
    });
  }

  render() {
    this.container.classList.add("callback");
    this.container.innerHTML = `
      <button type="button" class="callback__button" aria-expanded="false" aria-controls="callback-form" aria-label="Открыть форму обратной связи"></button>
      <form class="callback__form" id="callback-form">
        <div class="callback__header">
          <p class="callback__title">Напишите нам</p>
          <button type="button" class="callback__close" aria-label="Закрыть">×</button>
        </div>
        <label class="callback__label">
          Сообщение
          <textarea class="callback__text" name="message" rows="4"></textarea>
        </label>
      </form>
    `;

    this.button = this.container.querySelector(".callback__button");
    this.form = this.container.querySelector(".callback__form");
    this.closeButton = this.container.querySelector(".callback__close");
    this.text = this.container.querySelector(".callback__text");
  }

  open() {
    if (this.isOpen) {
      return;
    }

    this.isOpen = true;
    this.container.classList.add("is-open");
    this.button.setAttribute("aria-expanded", "true");
    this.text.focus();
  }

  close() {
    if (!this.isOpen) {
      return;
    }

    this.isOpen = false;
    this.container.classList.remove("is-open");
    this.button.setAttribute("aria-expanded", "false");
    this.button.focus();
  }
}
