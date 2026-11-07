import goblinUrl from "../img/goblin.svg";

export default class GameBoard {
  constructor(root) {
    this.root = root;
    this.boardEl = root.querySelector(".board");
    this.scoreEl = root.querySelector("[data-role=score]");
    this.missesEl = root.querySelector("[data-role=misses]");
    this.overlayEl = root.querySelector("[data-role=message]");
    this.finalScoreEl = root.querySelector("[data-role=final-score]");
    this.restartBtn = root.querySelector("[data-role=restart]");
    this.cells = [];
    this.clickHandler = () => {};
  }

  init(size, onRestart) {
    this.boardEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    this.boardEl.replaceChildren();
    this.cells = Array.from({ length: size * size }, (_, index) => {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cell";
      cell.dataset.index = String(index);
      cell.setAttribute("aria-label", `Клетка ${index + 1}`);
      this.boardEl.append(cell);
      return cell;
    });

    if (!this.listening) {
      this.boardEl.addEventListener("click", (event) => {
        const cell = event.target.closest(".cell");
        if (!cell || !this.boardEl.contains(cell)) {
          return;
        }
        this.clickHandler(Number(cell.dataset.index));
      });
      this.restartBtn.addEventListener("click", onRestart);
      this.listening = true;
    }
  }

  onCellClick(handler) {
    this.clickHandler = handler;
  }

  render(state) {
    this.scoreEl.textContent = String(state.score);
    this.missesEl.textContent = String(state.misses);

    this.cells.forEach((cell, index) => {
      const hasGoblin = index === state.activeIndex;
      cell.classList.toggle("cell_has-goblin", hasGoblin);
      cell.replaceChildren();

      if (!hasGoblin) {
        return;
      }

      const image = document.createElement("img");
      image.src = goblinUrl;
      image.alt = "Гоблин";
      image.className = "goblin";
      image.draggable = false;
      image.addEventListener("error", () => {
        const fallback = document.createElement("span");
        fallback.className = "goblin goblin_fallback";
        fallback.textContent = "👺";
        fallback.setAttribute("role", "img");
        fallback.setAttribute("aria-label", "Гоблин");
        image.replaceWith(fallback);
      });
      cell.append(image);
    });
  }

  showGameOver(state) {
    this.finalScoreEl.textContent = String(state.score);
    this.overlayEl.classList.remove("hidden");
  }

  hideGameOver() {
    this.overlayEl.classList.add("hidden");
  }
}
