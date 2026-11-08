const TEXT =
  "Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus terry richardson ad squid. Nihil anim keffiyeh helvetica, craft beer labore wes anderson cred nesciunt sapiente ea proident.";

export default class Collapse {
  constructor(container) {
    this.container = container;
    this.isOpen = false;
    this.render();
    this.button.addEventListener("click", () => this.toggle());
    this.panel.addEventListener("transitionend", (event) => {
      this.onTransitionEnd(event);
    });
  }

  render() {
    this.container.innerHTML = `
      <button type="button" class="collapse__button" aria-expanded="false" aria-controls="collapse-panel">
        Collapse
      </button>
      <div class="collapse__panel" id="collapse-panel">
        <p class="collapse__text">${TEXT}</p>
      </div>
    `;

    this.button = this.container.querySelector(".collapse__button");
    this.panel = this.container.querySelector(".collapse__panel");
  }

  toggle() {
    if (this.isOpen) {
      this.close();
      return;
    }

    this.open();
  }

  open() {
    const start = this.panel.getBoundingClientRect().height;
    this.panel.style.height = `${start}px`;
    this.panel.classList.add("is-animating");
    const target = this.panel.scrollHeight;
    this.panel.offsetHeight;
    this.panel.style.height = `${target}px`;
    this.isOpen = true;
    this.button.setAttribute("aria-expanded", "true");
  }

  close() {
    const start = this.panel.getBoundingClientRect().height;
    this.panel.style.height = `${start}px`;
    this.panel.classList.add("is-animating");
    this.panel.offsetHeight;
    this.panel.style.height = "0px";
    this.isOpen = false;
    this.button.setAttribute("aria-expanded", "false");
  }

  onTransitionEnd(event) {
    if (event.target !== this.panel || event.propertyName !== "height") {
      return;
    }

    this.panel.classList.remove("is-animating");

    if (this.isOpen) {
      this.panel.style.height = "auto";
    }
  }
}
