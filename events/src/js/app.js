import Game from "./Game";
import GameBoard from "./GameBoard";
import GameState from "./GameState";

const root = document.querySelector(".game");

if (root.gameInstance) {
  root.gameInstance.stop();
}

const state = new GameState();
const board = new GameBoard(root);
const game = new Game({ state, board });
root.gameInstance = game;

function restart() {
  game.stop();
  state.reset();
  board.hideGameOver();
  board.render(state);
  game.start();
}

board.init(state.boardSize, restart);
board.render(state);
game.start();
