import Chat from "./Chat";
import ChatApi from "./ChatApi";

function chatUrl() {
  const explicit = new URLSearchParams(window.location.search).get("ws");
  if (explicit) return explicit;

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/chat`;
}

const root = document.getElementById("app");

new Chat(root, new ChatApi(chatUrl())).init();
