import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const source=read("lib/content/article-quality.ts");
const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const quality=await import("data:text/javascript;base64,"+Buffer.from(code).toString("base64"));
const intro="কালো ধানের বীজের দাম বাংলাদেশে জানতে চাইলে জাতের পরিচয় এবং বাজারদর মিলিয়ে দেখুন।";
const body=intro+"\n\n## পরিচয়\n"+("কালো ধানের সঠিক জাত যাচাই করে কিনুন। ".repeat(45))+
"\n\n## চাষ\n"+("জাত, পানি, সার ও পরিচর্যা নিয়ে কৃষি অফিসের পরামর্শ নেওয়া প্রয়োজন। ".repeat(40))+
"\n\n## সাধারণ প্রশ্ন (FAQ)\n### দাম কত?\nপ্রতি কেজির মূল্য ও প্যাক সাইজ অনুযায়ী পার্থক্য হতে পারে; বিক্রেতার তথ্য মিলিয়ে দেখুন।\n### কোন জাতটি ভালো?\nনির্দিষ্ট জাত, জমির ধরন ও মৌসুম দেখে সিদ্ধান্ত নেওয়া উচিত; সব জাত এক নয়।"+
"\n\n## তথ্যসূত্র\n- [BRRI](https://brri.gov.bd/pages/static-pages/699d278d0517136ccaa33510)\n- [ICAR](https://icar.gov.in/en/icar-manipur-centre-releases-indias-first-high-yielding-semi-dwarf-black-rice-variety-rc)"+
"\n\n## বীজ\n[AGRIVA black rice seeds](https://agriva.com.bd/marketplace/black-rice-seeds)";
const meta={title:"বাংলাদেশে কালো ধানের বীজের দাম ও চাষের গাইড",keyword:"কালো ধানের বীজের দাম",metaTitle:"Black Rice Seed Price in Bangladesh | কালো ধানের বীজের দাম",metaDescription:"বাংলাদেশে কালো ধানের বীজের দাম ও জাতের পরিচয় সম্পর্কে জানুন। ব্রি ধান১১৫, কালো চালের ধরন, প্যাকের মূল্য এবং বীজ কেনার প্রয়োজনীয় তথ্য যাচাই করুন।",body};
assert.equal(quality.editorialReady(meta),true,JSON.stringify(quality.getEditorialChecks(meta).filter(x=>!x.passed)));
assert.equal(quality.editorialReady({...meta,body:body.replace("## তথ্যসূত্র","## নোট")}),false);
assert.equal(quality.editorialReady({...meta,body:body.replace("https://agriva.com.bd/marketplace/black-rice-seeds","https://example.com")}),false);
assert.equal(quality.editorialReady({...meta,body:body+"\n[সূত্রের নাম](https://example.com)"}),false);
assert.ok(quality.normalizeEditorialMarkdown(String.raw`\## তথ্যসূত্র`).startsWith("##"));
assert.match(read("app/admin/content-drafts/workflow/route.ts"),/getEditorialChecks/);
assert.match(read("app/admin/content-drafts/ContentDraftsClient.tsx"),/getEditorialChecks/);
console.log("SEO article preflight requirements and unsafe placeholders verified.");
