export default class Game {
  constructor({ state, board, interval = 1000 }) {
    this.state = state;
    this.board = board;
    this.interval = interval;
    this.timerId = null;

    this.board.onCellClick((index) => this.handleClick(index));
  }

  start() {
    if (this.state.isOver) {
      return;
    }
    this.spawn();
  }

  stop() {
    clearTimeout(this.timerId);
    this.timerId = null;
  }

  spawn() {
    if (this.state.isOver) {
      return;
    }

    const index = this.state.nextIndex();
    this.state.appear(index);
    this.board.render(this.state);
    this.timerId = setTimeout(() => this.handleTimeout(), this.interval);
  }

  handleClick(index) {
    if (this.state.isOver || this.state.activeIndex !== index) {
      return;
    }

    this.stop();
    this.state.hit();
    this.board.render(this.state);
    this.spawn();
  }

  handleTimeout() {
    this.timerId = null;
    const counted = this.state.miss();
    this.board.render(this.state);

    if (!counted || this.state.isOver) {
      if (this.state.isOver) {
        this.board.showGameOver(this.state);
      }
      return;
    }

    this.spawn();
  }
}
