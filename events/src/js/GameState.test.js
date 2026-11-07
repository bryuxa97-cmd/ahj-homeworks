import GameState from "./GameState";

describe("GameState", () => {
  test("rejects invalid board size and miss limit", () => {
    expect(() => new GameState({ boardSize: 0 })).toThrow("boardSize");
    expect(() => new GameState({ maxMisses: 0 })).toThrow("maxMisses");
  });

  test("hit scores a point and removes the goblin", () => {
    const state = new GameState();
    state.appear(3);

    expect(state.hit()).toBe(true);
    expect(state.score).toBe(1);
    expect(state.activeIndex).toBeNull();
    expect(state.hit()).toBe(false);
    expect(state.score).toBe(1);
  });

  test("a hit appearance is not counted as a miss afterwards", () => {
    const state = new GameState();
    state.appear(1);
    state.hit();

    expect(state.miss()).toBe(false);
    expect(state.misses).toBe(0);
    expect(state.isOver).toBe(false);
  });

  test("fifth miss ends the game", () => {
    const state = new GameState({ maxMisses: 5 });

    for (let step = 1; step <= 4; step += 1) {
      state.appear(step);
      expect(state.miss()).toBe(true);
      expect(state.isOver).toBe(false);
    }

    state.appear(0);
    expect(state.miss()).toBe(true);
    expect(state.misses).toBe(5);
    expect(state.isOver).toBe(true);
    expect(state.appear(1)).toBe(false);
    expect(state.miss()).toBe(false);
    expect(state.hit()).toBe(false);
  });

  test("next cell is on the board and differs from the previous one", () => {
    const state = new GameState({ boardSize: 4 });
    const seen = new Set();

    for (let step = 0; step < 30; step += 1) {
      const index = state.nextIndex();
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(state.cellCount);
      expect(index).not.toBe(state.lastIndex);
      state.appear(index);
      seen.add(index);
    }

    expect(seen.size).toBeGreaterThan(1);
  });

  test("broken random still returns another cell", () => {
    const state = new GameState({ boardSize: 2 });
    state.appear(0);

    expect(state.nextIndex(() => 0)).toBe(1);
  });

  test("single cell is always index 0", () => {
    const state = new GameState({ boardSize: 1 });
    state.appear(0);

    expect(state.nextIndex()).toBe(0);
  });

  test("appear rejects an index outside the board", () => {
    const state = new GameState({ boardSize: 2 });
    expect(() => state.appear(4)).toThrow("index out of range");
    expect(() => state.appear(-1)).toThrow("index out of range");
  });

  test("reset restores a new game", () => {
    const state = new GameState({ maxMisses: 1 });
    state.appear(2);
    state.hit();
    state.appear(1);
    state.miss();

    state.reset();

    expect(state.score).toBe(0);
    expect(state.misses).toBe(0);
    expect(state.activeIndex).toBeNull();
    expect(state.lastIndex).toBeNull();
    expect(state.isOver).toBe(false);
  });
});
