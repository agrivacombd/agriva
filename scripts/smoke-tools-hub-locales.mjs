import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const registry = readFileSync("lib/tools/registry.ts", "utf8");
const hub = readFileSync("components/tools/ToolsHubClient.tsx", "utf8");
const englishPage = readFileSync("app/en/tools/page.tsx", "utf8");

for (const [source, target] of [
  ["/fertilizer-calculator", "/en/fertilizer-calculator"],
  ["/seed-rate-calculator", "/en/seed-rate-calculator"],
  ["/farming-cost-profit-calculator", "/en/farming-cost-profit-calculator"],
  ["/crop-calendar", "/en/crop-calendar"],
  ["/crop-choice", "/en/crop-choice"],
  ["/soil-fertilizer", "/en/soil-fertilizer"],
]) {
  assert.ok(registry.includes(`"${source}": "${target}"`), `Missing English route mapping: ${source}`);
}
assert.match(registry, /if \(locale === "bn"\) return tool\.href/);
assert.match(hub, /href=\{getToolHref\(tool, locale\)\}/, "Tool cards must use the active locale route");
assert.match(hub, /target="_blank" rel="noopener noreferrer"/, "Tool cards must continue opening in a new tab");
assert.match(englishPage, /getToolHref\(tool, "en"\)/, "English ItemList structured data must use localized routes");

console.log("Tools Hub locale routing checks passed.");
