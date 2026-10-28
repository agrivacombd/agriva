import { redirect } from "next/navigation";

export default async function LegacyArticleRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/blog/${encodeURIComponent(slug)}`);
}
