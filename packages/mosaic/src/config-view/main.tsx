import { App } from "@modelcontextprotocol/ext-apps/app-with-deps";
import { type AppLike, startConfigView } from "./ConfigViewApp.js";
import "./config-view.css";

declare const __MOSAIC_VERSION__: string;

const root = document.getElementById("root");
if (!root) throw new Error("config-view: #root is missing");

// The ext-apps `App` is the only door to the host: tool results arrive on `ontoolresult`, every
// further tool call goes through `callServerTool`.
const app = new App({ name: "mosaic-config-view", version: __MOSAIC_VERSION__ }, {});
void startConfigView(app as unknown as AppLike, root);
