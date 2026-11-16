import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const home = read("app/page.tsx"), chrome = read("components/site/SiteChrome.tsx"), layout = read("app/layout.tsx");
assert.match(layout, /width: "device-width"/);
assert.match(layout, /initialScale: 1/);
assert.doesNotMatch(layout, /userScalable: false|maximumScale: 1/, "Pinch zoom must remain available");
assert.match(home, /aria-label="দ্রুত কৃষি সেবা"/);
assert.match(home, /sm:grid-cols-4 lg:hidden/);
assert.match(home, /relative mx-auto hidden w-full min-w-0 max-w-xl lg:block/);
assert.ok(home.indexOf('<section id="services"') < home.indexOf('<section id="green-living"'), "Services before secondary content");
assert.match(home, /sm:grid-cols-3 sm:gap-4 xl:grid-cols-4/);
assert.match(home, /minmax\(0,1\.05fr\)_minmax\(0,\.95fr\)/);
assert.match(home, /min-w-0 flex-1 bg-transparent px-1 py-2\.5 text-base/);
assert.match(home, /pb-\[max\(0\.5rem,env\(safe-area-inset-bottom\)\)\]/);
assert.match(chrome, /min-h-16 max-w-7xl min-w-0/);
assert.ok(chrome.includes('pathname !== "/" && ('), "Avoid duplicate homepage search");
for(const route of ["/marketplace","/crop-disease","/weather","/jobs","/agriculture-calculators"]) {
  assert.ok(home.includes('href="' + route + '"') || home.includes('href: "' + route + '"'), route + " accessible");
}
console.log("AGRIVA mobile/tablet/desktop homepage responsiveness contracts passed.");
