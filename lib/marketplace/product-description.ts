export const MAX_PRODUCT_DESCRIPTION_HTML_LENGTH = 250000;

const ALLOWED_TAGS = new Set(["p", "div", "br", "strong", "b", "em", "i", "u", "h2", "h3", "ul", "ol", "li", "blockquote", "a"]);

export function sanitizeProductDescription(input: string): string {
  let html = String(input || "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|iframe|object|svg|math)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");

  html = html.replace(/<\/?([a-z0-9]+)\b([^>]*)>/gi, (tag, rawName: string, attributes: string) => {
    const name = rawName.toLowerCase();
    if (!ALLOWED_TAGS.has(name)) return "";
    const closing = /^<\//.test(tag);
    if (closing) return name === "br" ? "" : `</${name}>`;
    if (name === "br") return "<br>";
    if (name !== "a") {
      const alignment = attributes.match(/\\bstyle\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))/i);
      const textAlign = (alignment?.[1] || alignment?.[2] || alignment?.[3] || "").match(/(?:^|;)\\s*text-align\\s*:\\s*(left|center|right|justify)\\s*(?:;|$)/i)?.[1]?.toLowerCase();
      return textAlign && ["p", "div", "h2", "h3", "li", "blockquote"].includes(name)
        ? `<${name} style="text-align:${textAlign}">`
        : `<${name}>`;
    }
    const href = attributes.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const url = (href?.[1] || href?.[2] || href?.[3] || "").trim();
    try {
      const parsed = new URL(url);
      if (parsed.protocol === "https:" || parsed.protocol === "http:" || parsed.protocol === "mailto:") {
        return `<a href="${parsed.href.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}" target="_blank" rel="noopener noreferrer">`;
      }
    } catch { /* Remove unsafe or malformed link targets. */ }
    return "<a>";
  });

  return html.trim();
}

export function productDescriptionToText(input: string): string {
  return String(input || "")
    .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, " ")
    .replace(/<br\s*\/?\s*>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}
