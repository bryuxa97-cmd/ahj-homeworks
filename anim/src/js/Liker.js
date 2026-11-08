import heartUrl from "../img/heart.png";

const PATHS = [1, 2, 3, 4];

export default class Liker {
  constructor(container) {
    this.container = container;
    this.render();
    this.button.addEventListener("click", () => this.like());
  }

  render() {
    this.container.classList.add("liker");
    this.container.innerHTML = `
      <button type="button" class="liker__button">Like</button>
    `;
    this.button = this.container.querySelector(".liker__button");
  }

  like() {
    const heart = document.createElement("img");
    const path = PATHS[Math.floor(Math.random() * PATHS.length)];

    heart.src = heartUrl;
    heart.alt = "";
    heart.setAttribute("aria-hidden", "true");
    heart.className = `liker__heart liker__heart_${path}`;
    heart.addEventListener(
      "animationend",
      () => {
        heart.remove();
      },
      { once: true },
    );

    this.container.append(heart);
  }
}
