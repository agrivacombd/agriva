import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const home = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const chrome = readFileSync(new URL("../components/site/SiteChrome.tsx", import.meta.url), "utf8");
for (const snippet of [
  'relative isolate overflow-hidden bg-gradient-to-b',
  'min-w-0 max-w-xl items-center gap-1 rounded-xl',
  'min-w-0 flex-1 bg-transparent px-1 py-2.5 text-base',
  'min-[360px]:grid-cols-2',
  'mt-5 grid grid-cols-2 gap-2',
  'min-w-0 min-h-[152px]',
  'mt-2 hidden text-sm leading-6 text-slate-500 sm:block',
  'min-[380px]:grid-cols-2 sm:gap-4',
  'pb-[max(0.5rem,env(safe-area-inset-bottom))]',
]) assert.ok(home.includes(snippet), "Mobile home design missing: " + snippet);
assert.ok(chrome.includes('pathname !== "/" && ('), "Home should not duplicate the full-width mobile header search");
for (const route of ["/marketplace", "/crop-disease", "/weather", "/jobs", "/agriculture-calculators"]) {
  assert.ok(home.includes('href="' + route + '"') || home.includes('href: "' + route + '"'), route + " should remain linked");
}
console.log("AGRIVA homepage mobile layout source tests passed.");
