export type ArticleSchemaInput = {
  siteUrl: string; slug: string; title: string; description?: string | null;
  publishedAt?: string | null; modifiedAt?: string | null; imageUrl?: string | null;
  authorName?: string | null; reviewerName?: string | null;
};
export function articleStructuredData(input: ArticleSchemaInput) {
  const base = input.siteUrl.replace(/\/+$/, "");
  const url = base + "/blog/" + encodeURIComponent(input.slug);
  const article: Record<string, unknown> = {
    "@context": "https://schema.org", "@type": "Article", "@id": url + "#article",
    headline: input.title, url, mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: input.authorName ? { "@type": "Person", name: input.authorName } : { "@type": "Organization", name: "AGRIVA", url: base },
    publisher: { "@type": "Organization", name: "AGRIVA", url: base },
    inLanguage: "bn-BD", isAccessibleForFree: true,
  };
  if (input.description) article.description = input.description;
  if (input.reviewerName) article.reviewedBy = { "@type": "Person", name: input.reviewerName };
  if (input.publishedAt) article.datePublished = input.publishedAt;
  if (input.modifiedAt) article.dateModified = input.modifiedAt;
  if (input.imageUrl) article.image = [input.imageUrl];
  const breadcrumbs = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "হোম", item: base },
      { "@type": "ListItem", position: 2, name: "AGRIVA Blog", item: base + "/blog" },
      { "@type": "ListItem", position: 3, name: input.title, item: url }
    ]
  };
  return { article, breadcrumbs };
}
export function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}
