import { suggestSeoInternalLinks } from "./internal-links";

export type SeoCheck = { id: string; status: "pass" | "warning" | "fail"; message: string };
export type SeoAuditInput = {
  title: string; metaTitle: string; metaDescription: string;
  primaryKeyword: string; content: string;
};
const normalized = (value: string) => value.normalize("NFC").toLocaleLowerCase("bn-BD").replace(/\s+/g, " ").trim();
const includesKeyword = (text: string, keyword: string) => !!keyword && normalized(text).includes(normalized(keyword));
const length = (text: string) => Array.from(text.trim()).length;
const check = (id: string, ok: boolean, message: string, severity: "warning" | "fail" = "warning"): SeoCheck =>
  ({ id, status: ok ? "pass" : severity, message });
const markdownLinks = (content: string) =>
  [...content.matchAll(/\[([^\]]+)\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)].map(m => ({ anchor: m[1].trim(), href: m[2].trim() }));
const localPath = (href: string): string | null => {
  if (href.startsWith("/") && !href.startsWith("//")) return href.split(/[?#]/)[0];
  try {
    const url = new URL(href);
    return ["agriva.com.bd", "www.agriva.com.bd"].includes(url.hostname.toLowerCase())
      && ["https:", "http:"].includes(url.protocol) ? url.pathname : null;
  } catch { return null; }
};
export function auditSeoArticle(input: SeoAuditInput) {
  const { title, metaTitle, metaDescription, primaryKeyword, content } = input;
  const keyword = primaryKeyword.trim();
  const headings = [...content.matchAll(/^(#{1,6})\s+(.+)$/gm)].map(m => ({ level: m[1].length, text: m[2].trim() }));
  const links = markdownLinks(content);
  const internal = links.map(link => ({ ...link, path: localPath(link.href) })).filter(link => link.path !== null);
  const relevant = new Set(suggestSeoInternalLinks([title, keyword].join(" "), 6).map(link => link.href));
  const relevantInternal = internal.filter(link => relevant.has(link.path!));
  const intro = content.replace(/^#{1,6}\s+.+$/gm, "").trim().slice(0, 350);
  const checks: SeoCheck[] = [
    check("title-length", length(metaTitle) >= 30 && length(metaTitle) <= 65, "SEO title should generally be 30–65 characters (SERP pixels vary)."),
    check("title-keyword", includesKeyword(metaTitle, keyword), "Include the primary keyword naturally in the SEO title.", "fail"),
    check("description-length", length(metaDescription) >= 100 && length(metaDescription) <= 165, "Meta description should generally be 100–165 characters; snippets vary."),
    check("description-keyword", includesKeyword(metaDescription, keyword), "Use the primary keyword naturally in the meta description."),
    check("article-title", length(title) >= 15 && length(title) <= 110, "Article H1/title should be descriptive and readable."),
    check("structure-h2", headings.filter(h => h.level === 2).length >= 2, "Use at least two descriptive H2 sections."),
    check("structure-hierarchy", !headings.some((h,i) => i > 0 && h.level > headings[i-1].level + 1), "Avoid skipping heading levels."),
    check("content-depth", normalized(content.replace(/[#*\[\]()]/g, " ")).split(/\s+/).filter(Boolean).length >= 250, "Article should contain substantive, verified content; word count is a heuristic."),
    check("keyword-intro", includesKeyword(intro, keyword), "Mention the primary keyword naturally near the introduction."),
    check("keyword-heading", headings.some(h => includesKeyword(h.text, keyword)), "Use the primary keyword or a natural variation in a relevant heading."),
    check("internal-links", internal.length > 0, "Add at least one useful contextual AGRIVA internal link."),
    check("internal-relevance", relevant.size === 0 || relevantInternal.length > 0, "Consider linking to a topic-relevant AGRIVA tool, marketplace or learning page."),
    check("link-anchor", links.every(l => l.anchor.length >= 4 && !/^(click here|here|এখানে|লিংক)$/i.test(l.anchor)), "Use descriptive link anchor text."),
    check("link-format", links.every(l => !/^(javascript:|data:)/i.test(l.href)), "Avoid unsafe link schemes.", "fail"),
  ];
  const failures = checks.filter(c => c.status === "fail").length;
  const warnings = checks.filter(c => c.status === "warning").length;
  return {
    score: Math.round(checks.filter(c => c.status === "pass").length / checks.length * 100),
    checks, failures, warnings, requiresHumanReview: true,
    internalLinkCount: internal.length, relevantInternalLinkCount: relevantInternal.length,
    suggestedInternalLinks: suggestSeoInternalLinks([title, keyword].join(" "), 6),
    note: "Heuristic editorial checks only. Not a ranking guarantee or proof of factual accuracy, link availability, or search volume."
  };
}
