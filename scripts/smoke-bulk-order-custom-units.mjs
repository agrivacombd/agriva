import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";
async function loadTS(file) {
 const code=ts.transpileModule(readFileSync(file,"utf8"),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 return import("data:text/javascript;base64,"+Buffer.from(code).toString("base64"));
}
const u=await loadTS("lib/bulk-rfq/units.ts");
const d=await loadTS("lib/bulk-rfq/delivery-area.ts");
for(const value of ["kg","piece","পিস","ডজন","কুইন্টাল","বস্তা (৫০ কেজি)"]){
 assert.equal(u.isValidBulkUnit(value),true,"valid unit "+value);
}
for(const value of [""," ","__custom__","<script>","bad\nunit","x".repeat(31)]){
 assert.equal(u.isValidBulkUnit(value),false,"invalid unit "+JSON.stringify(value));
}
assert.equal(u.normalizeBulkUnit("  পাত্র  "),"পাত্র");
assert.equal(d.formatBulkDeliveryArea("",""),"পরে জানানো হবে");
assert.equal(d.formatBulkDeliveryArea("ঢাকা","সাভার"),"ঢাকা, সাভার");
assert.equal(d.formatBulkDeliveryArea("","সাভার"),"সাভার");
const form=readFileSync("components/bulk-rfq/MultiOrderForm.tsx","utf8");
assert.ok(form.indexOf('id="delivery-heading"')>form.indexOf("items.map("),"delivery section must follow all product inputs");
assert.ok(form.includes("অন্যান্য — নিজের একক লিখুন"),"custom unit option");
assert.ok(!form.includes('name="district" required'),"delivery district optional");
const server=readFileSync("app/custom-order/page.tsx","utf8");
assert.ok(server.includes("isValidBulkUnit(unit)")&&server.includes("district.length>80"),"server supports bounded custom unit and optional delivery");
console.log("Custom units and final optional delivery area regression checks passed");
