import GameBoard from "./GameBoard";
import GameState from "./GameState";

function mountBoard() {
  document.body.innerHTML = `
    <main class="game">
      <strong data-role="score">0</strong>
      <strong data-role="misses">0</strong>
      <div class="board"></div>
      <div class="overlay hidden" data-role="message">
        <strong data-role="final-score">0</strong>
        <button type="button" data-role="restart">Играть снова</button>
      </div>
    </main>
  `;

  const root = document.querySelector(".game");
  const board = new GameBoard(root);
  const clicks = [];
  let restarts = 0;
  board.init(2, () => {
    restarts += 1;
  });
  board.onCellClick((index) => clicks.push(index));
  return { board, clicks, getRestarts: () => restarts };
}

describe("GameBoard", () => {
  test("draws the goblin only in the active cell and updates the counters", () => {
    const { board } = mountBoard();
    const state = new GameState({ boardSize: 2 });
    state.appear(2);
    state.score = 3;
    state.misses = 1;

    board.render(state);

    const cells = document.querySelectorAll(".cell");
    expect(cells).toHaveLength(4);
    expect(cells[2].querySelector(".goblin")).not.toBeNull();
    expect(cells[0].querySelector(".goblin")).toBeNull();
    expect(document.querySelector("[data-role=score]").textContent).toBe("3");
    expect(document.querySelector("[data-role=misses]").textContent).toBe("1");
  });

  test("reports the clicked cell index", () => {
    const { clicks } = mountBoard();
    document.querySelectorAll(".cell")[1].click();
    expect(clicks).toEqual([1]);
  });

  test("shows and hides the game-over message", () => {
    const { board, getRestarts } = mountBoard();
    const state = new GameState({ boardSize: 2, maxMisses: 1 });
    state.score = 4;

    board.showGameOver(state);

    const overlay = document.querySelector("[data-role=message]");
    expect(overlay.classList.contains("hidden")).toBe(false);
    expect(document.querySelector("[data-role=final-score]").textContent).toBe(
      "4",
    );

    document.querySelector("[data-role=restart]").click();
    expect(getRestarts()).toBe(1);

    board.hideGameOver();
    expect(overlay.classList.contains("hidden")).toBe(true);
  });
});
