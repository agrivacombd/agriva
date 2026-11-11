import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync("app/learn/page.tsx", "utf8");
const library = readFileSync("components/learn/LearnLibrary.tsx", "utf8");
const lessons = readFileSync("lib/learn/lessons.ts", "utf8");
const audit = readFileSync("docs/learn/learn-2.0-repository-audit.md", "utf8");
const guideRoute = readFileSync("app/learn/[slug]/page.tsx", "utf8");

assert.ok(guideRoute.includes("params: Promise<{ slug: string }>") && guideRoute.includes("await params"), "dynamic guide route should await Next.js route params");
assert.ok(page.includes("LearnLibrary"), "Learn homepage should render the learning library");
assert.ok(page.includes("/learn/plant-science"), "Plant Science Academy route must remain linked");
assert.ok(page.includes("/learn/plant-disease"), "Disease Learning Lab route must remain linked");
assert.ok(page.includes("কৃষি-নিরাপত্তা নোট"), "Agricultural safety notice should remain visible");
assert.ok(library.includes('type="search"'), "Learning library should expose an accessible search input");
assert.ok(library.includes("aria-pressed={active}"), "Category filters should expose their active state");
assert.ok(library.includes("filteredLessons.map"), "Learning library should render filtered guide results");
assert.ok(library.includes("কোনো গাইড পাওয়া যায়নি"), "Learning library should provide an empty state");
assert.ok(lessons.includes('slug: "rice-cultivation"'), "Existing rice guide data must remain");
assert.ok(lessons.includes('slug: "vegetable-cultivation"'), "Existing vegetable guide data must remain");
assert.ok(lessons.includes('slug: "soil-health"'), "Existing soil guide data must remain");
assert.ok(lessons.includes('slug: "integrated-pest-management"'), "Existing IPM guide data must remain");
assert.ok(audit.includes("No production database writes or migrations"), "Audit should document that production schema was not changed");

console.log("Learn 2.0 Phase 1 smoke tests passed.");
