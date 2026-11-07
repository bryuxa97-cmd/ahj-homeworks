import Chat from "./Chat";
import ChatApi from "./ChatApi";

const params = new URLSearchParams(window.location.search);
const url = params.get("ws") || __WS_URL__;
const root = document.getElementById("app");

new Chat(root, new ChatApi(url)).init();
