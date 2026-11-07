import Game from "./Game";
import GameState from "./GameState";

function createGame() {
  const state = new GameState({ boardSize: 2, maxMisses: 5 });
  const board = {
    handler: () => {},
    renders: [],
    gameOvers: 0,
    onCellClick(handler) {
      this.handler = handler;
    },
    render(nextState) {
      this.renders.push({
        score: nextState.score,
        misses: nextState.misses,
        activeIndex: nextState.activeIndex,
        isOver: nextState.isOver,
      });
    },
    showGameOver() {
      this.gameOvers += 1;
    },
  };
  const game = new Game({ state, board, interval: 1000 });
  return { state, board, game };
}

describe("Game", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("shows a goblin immediately and moves it after one second with a miss", () => {
    const { board, game } = createGame();
    game.start();

    const first = board.renders.at(-1);
    expect(first.activeIndex).not.toBeNull();
    expect(first.misses).toBe(0);

    jest.advanceTimersByTime(999);
    expect(board.renders.at(-1).misses).toBe(0);

    jest.advanceTimersByTime(1);
    const next = board.renders.at(-1);
    expect(next.misses).toBe(1);
    expect(next.activeIndex).not.toBeNull();
    expect(next.activeIndex).not.toBe(first.activeIndex);
  });

  test("click on the active cell scores and spawns the next goblin without a miss", () => {
    const { board, game } = createGame();
    game.start();
    const activeIndex = board.renders.at(-1).activeIndex;

    jest.advanceTimersByTime(400);
    board.handler(activeIndex);

    const afterHit = board.renders.at(-1);
    expect(afterHit.score).toBe(1);
    expect(afterHit.misses).toBe(0);
    expect(afterHit.activeIndex).not.toBeNull();

    jest.advanceTimersByTime(999);
    expect(board.renders.at(-1).misses).toBe(0);

    jest.advanceTimersByTime(1);
    expect(board.renders.at(-1).misses).toBe(1);
  });

  test("click on an empty cell does not change the score", () => {
    const { state, board, game } = createGame();
    game.start();
    const activeIndex = state.activeIndex;
    const emptyIndex = (activeIndex + 1) % state.cellCount;

    board.handler(emptyIndex);

    expect(state.score).toBe(0);
    expect(state.activeIndex).toBe(activeIndex);
  });

  test("five missed appearances end the game and ignore further clicks", () => {
    const { state, board, game } = createGame();
    game.start();

    jest.advanceTimersByTime(5000);

    expect(state.misses).toBe(5);
    expect(state.isOver).toBe(true);
    expect(state.activeIndex).toBeNull();
    expect(board.gameOvers).toBe(1);

    const rendersAfterOver = board.renders.length;
    board.handler(0);
    jest.advanceTimersByTime(3000);

    expect(state.score).toBe(0);
    expect(state.misses).toBe(5);
    expect(board.renders.length).toBe(rendersAfterOver);
  });
});
