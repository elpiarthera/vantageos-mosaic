#!/usr/bin/env node
/**
 * config-view-smoke: runs the BUILT single file (dist/config-view.html) in a real Chromium, inside a
 * sandboxed iframe, against a minimal host that speaks the MCP Apps bridge (ui/initialize,
 * tool-input, tool-result, tools/call). Proves, on the artefact and not on its sources:
 *   - the handshake completes and the first view renders from the initial tool result;
 *   - the list shows formatted FR cells; axe-core (WCAG A/AA, with real layout, so contrast too)
 *     reports 0 violations on the list and on the detail;
 *   - a row action reaches the host as a tools/call with the arguments resolved from the row;
 *   - the returned detail renders, and Back returns to the list.
 *
 * Needs: the build (dist/config-view.html), a Playwright Chromium (CHROMIUM_PATH to point at one),
 * Node >= 22.6 for --experimental-strip-types (the fixtures are TypeScript):
 *   node --experimental-strip-types scripts/config-view-smoke.mjs
 * Exit 0 = every assertion held; exit 1 = one failed (named); a crash is a failure too.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PKG = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(resolve(PKG, "package.json"));
const { chromium } = require("@playwright/test");
const axeSrc = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const F = await import(resolve(PKG, "src/view-config/fixtures.ts"));
const html = readFileSync(resolve(PKG, "dist/config-view.html"), "utf8");
const listResult = {
  content: [{ type: "text", text: "md" }],
  structuredContent: F.LIST_PAYLOAD,
  _meta: { viewConfig: F.LIST_CONFIG, locale: "fr" },
};
const detailResult = {
  content: [{ type: "text", text: "md" }],
  structuredContent: F.DETAIL_PAYLOAD,
  _meta: { viewConfig: F.DETAIL_CONFIG, locale: "fr" },
};
const host = `<!doctype html><body><iframe id="f" sandbox="allow-scripts" style="width:900px;height:700px"></iframe>
<script>
window.__log = [];
const f = document.getElementById("f");
f.srcdoc = ${JSON.stringify(html).replaceAll("</", "<\\/")};
const send = (m) => f.contentWindow.postMessage({ jsonrpc: "2.0", ...m }, "*");
window.addEventListener("message", (e) => {
  if (e.source !== f.contentWindow) return;
  const m = e.data; window.__log.push(m.method || ("resp" + m.id));
  if (m.method === "ui/initialize") {
    send({ id: m.id, result: { protocolVersion: "2026-01-26", hostInfo: { name: "h", version: "1" }, hostCapabilities: { serverTools: {} }, hostContext: { locale: "fr-FR" } } });
  } else if (m.method === "ui/notifications/initialized") {
    send({ method: "ui/notifications/tool-input", params: { arguments: { q: "dupont" } } });
    send({ method: "ui/notifications/tool-result", params: ${JSON.stringify(listResult)} });
  } else if (m.method === "tools/call") {
    window.__call = m.params;
    send({ id: m.id, result: ${JSON.stringify(detailResult)} });
  }
});
</script></body>`;
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.setContent(host);
const fr = await (await page.waitForSelector("#f")).contentFrame();
try {
  await fr.waitForSelector("h2", { timeout: 8000 });
} catch (e) {
  console.log(
    "LOG",
    JSON.stringify(await page.evaluate(() => window.__log)),
    "BODY",
    (await fr.content()).slice(-600),
  );
  process.exit(1);
}
const out = {};
out.h2 = await fr.locator("h2").first().innerText();
out.cells = await fr.locator("tbody tr").first().innerText();
out.hostLog = await page.evaluate(() => window.__log);
await fr.evaluate(axeSrc);
const axeRun = () =>
  fr.evaluate(async () => {
    const r = await window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
    });
    return r.violations.map((v) => `${v.id}: ${v.nodes.length} nodes`);
  });
out.axeList = await axeRun();
await fr
  .getByRole("button", { name: /Situation locative/ })
  .first()
  .click();
await fr.getByRole("heading", { name: "Copropriété" }).waitFor();
out.call = await page.evaluate(() => window.__call);
out.detailDt = await fr.locator("dt").allInnerTexts();
out.axeDetail = await axeRun();
await fr.getByRole("button", { name: "Retour" }).click();
out.backToList = await fr.locator("h2").first().innerText();
out.pageErrors = errors;
const checks = [
  ["list title in FR", out.h2 === "Contrats locataires"],
  [
    "first row formatted (date, money, boolean)",
    /15 janv\. 2025/.test(out.cells) && /800,00/.test(out.cells) && /Non/.test(out.cells),
  ],
  [
    "handshake reached the host",
    out.hostLog.includes("ui/initialize") && out.hostLog.includes("ui/notifications/initialized"),
  ],
  ["axe: 0 violations on the list", out.axeList.length === 0],
  [
    "row action sent get_rental_situation with lease_id c2",
    out.call?.name === "get_rental_situation" && out.call.arguments.lease_id === "c2",
  ],
  ["detail rendered in FR", out.detailDt.includes("Solde de trésorerie")],
  ["axe: 0 violations on the detail", out.axeDetail.length === 0],
  ["Back returns to the list", out.backToList === "Contrats locataires"],
  ["no page error", out.pageErrors.length === 0],
];
await browser.close();
let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}`);
  if (!ok) failed++;
}
if (failed > 0) {
  console.error(JSON.stringify(out, null, 1));
  process.exit(1);
}
