import CallbackChat from "./CallbackChat";
import Collapse from "./Collapse";
import Liker from "./Liker";

const collapseRoot = document.querySelector("[data-widget='collapse']");
const likerRoot = document.querySelector("[data-widget='liker']");
const callbackRoot = document.querySelector("[data-widget='callback']");

new Collapse(collapseRoot);
new Liker(likerRoot);
new CallbackChat(callbackRoot);
