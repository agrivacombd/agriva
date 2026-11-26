import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const bn = await readFile("app/crop-calendar/page.tsx", "utf8");
const en = await readFile("app/en/crop-calendar/page.tsx", "utf8");
const seasonal = await readFile("app/tools/crop-calendar/page.tsx", "utf8");

assert.match(bn, /title: "চাষের কাজের তালিকা ও ব্যক্তিগত ফসল ক্যালেন্ডার \| AGRIVA"/);
assert.match(bn, /canonical: "\/crop-calendar"/);
assert.match(bn, /href="\/tools\/crop-calendar">বাংলাদেশের ফসল ক্যালেন্ডার/);
assert.match(en, /title: "Farm Task Calendar & Crop Planning Checklist \| AGRIVA"/);
assert.match(en, /canonical: "\/en\/crop-calendar"/);
assert.match(en, /href="\/tools\/crop-calendar">seasonal crop calendar/);
assert.match(seasonal, /title: "বাংলাদেশ Crop Calendar: ফসল বপন ও কাটার সময়"/);
assert.match(seasonal, /href="\/crop-calendar">আমার ফসল ক্যালেন্ডার/);

console.log("SEO calendar intent metadata and cross-links smoke test passed.");
