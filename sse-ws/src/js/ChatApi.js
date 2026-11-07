export default class ChatApi {
  constructor(url) {
    this.url = url;
    this.socket = null;
  }

  connect(handlers) {
    this.socket = new WebSocket(this.url);

    this.socket.addEventListener("open", () => handlers.onOpen());
    this.socket.addEventListener("close", () => handlers.onClose());
    this.socket.addEventListener("error", () => handlers.onError());
    this.socket.addEventListener("message", (event) => {
      try {
        handlers.onEvent(JSON.parse(event.data));
      } catch {
        handlers.onError();
      }
    });
  }

  send(payload) {
    if (this.socket?.readyState !== WebSocket.OPEN) return false;

    this.socket.send(JSON.stringify(payload));
    return true;
  }
}
