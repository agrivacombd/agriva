import fs from "node:fs";
import assert from "node:assert/strict";

const read = (path) => fs.readFileSync(path, "utf8");
const control = read("components/admin/AdminConfirmSubmitButton.tsx");
assert.match(control, /useRef/);
assert.match(control, /submitting\.current/);
assert.match(control, /form\.reportValidity\(\)/);
assert.match(control, /form\.requestSubmit\(button\)/);
assert.match(control, /disabled=\{disabled \|\| busy\}/);

const expectations = [
  ["app/admin/orders/page.tsx", ["COD collection amount", "delivery status"]],
  ["app/admin/custom-orders/page.tsx", ["bulk request", "Fulfillment status", "wholesaler"]],
  ["components/admin/ApplicationManagement.tsx", ["application প্রত্যাখ্যান", "seller access grant", "requiredFieldName=\"reviewNote\""]],
  ["app/admin/green-exchange/page.tsx", ["Green Exchange listing"]],
  ["app/admin/transport/page.tsx", ["transport partner"]],
  ["app/admin/jobs/page.tsx", ["job post"]],
  ["app/admin/settings/page.tsx", ["platform setting", "Save configuration"]],
];
for (const [path, phrases] of expectations) {
  const source = read(path);
  assert.match(source, /AdminConfirmSubmitButton/, `${path} must use the shared guarded submit control`);
  for (const phrase of phrases) assert.ok(source.includes(phrase), `${path} missing confirmation: ${phrase}`);
}
console.log("Admin sensitive-action confirmation and single-submit regression checks passed.");
