import HelpDesk from "./HelpDesk";
import TicketApi from "./TicketApi";

const root = document.getElementById("app");
const helpdesk = new HelpDesk(root, new TicketApi());

helpdesk.init();
