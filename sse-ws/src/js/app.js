import Chat from "./Chat";
import ChatApi from "./ChatApi";

function chatUrl() {
  const explicit = new URLSearchParams(window.location.search).get("ws");
  if (explicit) return explicit;

  const { protocol, hostname, host } = window.location;
  const local = hostname === "localhost" || hostname === "127.0.0.1";

  if (local) {
    const wsProtocol = protocol === "https:" ? "wss:" : "ws:";
    return `${wsProtocol}//${host}/chat`;
  }

  return "ws://localhost:7070/chat";
}

const root = document.getElementById("app");

new Chat(root, new ChatApi(chatUrl())).init();
