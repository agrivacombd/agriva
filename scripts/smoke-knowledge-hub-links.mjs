import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const widget=read("components/learn/KnowledgeNetwork.tsx");
const pages={
  "/learn":"app/learn/page.tsx",
  "/learn/plant-disease":"app/learn/plant-disease/page.tsx",
  "/learn/plant-science":"app/learn/plant-science/PlantScienceClient.tsx",
  "/blog":"app/blog/page.tsx",
};
assert.equal(new Set(Object.keys(pages)).size,4);
for(const [route,path] of Object.entries(pages)){
  const source=read(path);
  assert.ok(source.includes("KnowledgeNetwork"),"Knowledge navigation missing in "+route);
  assert.ok(source.includes('current="'+route+'"'),"Must exclude own URL from related section: "+route);
  assert.ok(widget.includes('href:"'+route+'"'),"Target path absent: "+route);
}
assert.match(widget,/item\.href!==current/);
assert.match(widget,/related\.map\(item=><Link key=\{item\.href\} href=\{item\.href\}/);
assert.match(widget,/aria-label="সম্পর্কিত কৃষি জ্ঞান"/);
assert.match(widget,/focus-visible:ring-2/);
assert.doesNotMatch(read("app/learn/plant-science/PlantScienceClient.tsx"),/Plant Disease Learning Lab →<\/Link>/);
const compiled=ts.transpileModule(widget,{fileName:"KnowledgeNetwork.tsx",reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.Preserve,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});
assert.equal(compiled.diagnostics?.length||0,0);
console.log("Four knowledge hubs link bidirectionally with meaningful anchors and no self-links.");
