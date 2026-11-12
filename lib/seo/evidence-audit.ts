/** Editorial evidence checks: a source URL is not proof that a claim is correct. */
export type EvidenceCheck = { id: string; status: "pass" | "warning" | "fail"; message: string };
const official = ["dae.gov.bd","bari.gov.bd","brri.gov.bd","bina.gov.bd","badc.gov.bd","fao.org","cgiar.org","irri.org","extension.org"];
export function auditArticleEvidence(markdown: string): EvidenceCheck[] {
  const links = [...markdown.matchAll(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g)].map(m => m[2]);
  const external = links.filter(link => {
    try { return !["agriva.com.bd","www.agriva.com.bd"].includes(new URL(link).hostname.toLowerCase()); }
    catch { return false; }
  });
  const reputable = external.some(link => {
    try { const host = new URL(link).hostname.toLowerCase(); return official.some(domain => host === domain || host.endsWith("." + domain)); }
    catch { return false; }
  });
  const highRisk = /(কীটনাশক|বালাইনাশক|pesticide|fungicide|ডোজ|মাত্রা|গ্রাম\s*\/\s*লিটার|ml\s*\/\s*l|রোগের চিকিৎসা|বিষাক্ত)/i.test(markdown);
  return [
    { id: "evidence-external-sources", status: external.length ? "pass" : "warning", message: external.length ? "External source links present; verify each supports its associated claim." : "Add relevant, independently verifiable references for factual claims." },
    { id: "evidence-authoritative", status: reputable ? "pass" : "warning", message: reputable ? "A recognized agricultural institution is cited; confirm the specific guidance." : "Consider official agriculture research/extension references where relevant." },
    { id: "evidence-high-risk-review", status: highRisk ? "fail" : "pass", message: highRisk ? "Agricultural chemical/dosage or treatment claims require qualified manual verification before publishing." : "No high-risk treatment/dosage terms detected; factual review is still required." }
  ];
}
