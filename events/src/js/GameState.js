export default class GameState {
  constructor({ boardSize = 4, maxMisses = 5 } = {}) {
    if (!Number.isInteger(boardSize) || boardSize < 1) {
      throw new Error("boardSize must be a positive integer");
    }
    if (!Number.isInteger(maxMisses) || maxMisses < 1) {
      throw new Error("maxMisses must be a positive integer");
    }

    this.boardSize = boardSize;
    this.maxMisses = maxMisses;
    this.reset();
  }

  get cellCount() {
    return this.boardSize * this.boardSize;
  }

  reset() {
    this.score = 0;
    this.misses = 0;
    this.activeIndex = null;
    this.lastIndex = null;
    this.isOver = false;
  }

  nextIndex(random = Math.random) {
    const total = this.cellCount;
    if (total === 1) {
      return 0;
    }

    let index = this.lastIndex;
    let guard = 0;
    do {
      index = Math.floor(random() * total);
      guard += 1;
      if (guard > 32) {
        index = ((this.lastIndex ?? -1) + 1) % total;
        break;
      }
    } while (index === this.lastIndex || index < 0 || index >= total);

    return index;
  }

  appear(index) {
    if (this.isOver) {
      return false;
    }
    if (!Number.isInteger(index) || index < 0 || index >= this.cellCount) {
      throw new Error("index out of range");
    }

    this.activeIndex = index;
    this.lastIndex = index;
    return true;
  }

  hit() {
    if (this.isOver || this.activeIndex === null) {
      return false;
    }

    this.score += 1;
    this.activeIndex = null;
    return true;
  }

  miss() {
    if (this.isOver || this.activeIndex === null) {
      return false;
    }

    this.misses += 1;
    this.activeIndex = null;
    if (this.misses >= this.maxMisses) {
      this.isOver = true;
    }
    return true;
  }
}
