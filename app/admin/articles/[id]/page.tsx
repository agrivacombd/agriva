import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { authorizePermission } from "@/lib/auth/server-authorization";

export const metadata = {
  title: "Review article draft | AGRIVA Admin",
  robots: { index: false, follow: false },
};

export default async function AdminArticleReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const auth = await authorizePermission("content.review");
  if (!auth.ok) {
    if (auth.status === 401) redirect("/login");
    redirect("/dashboard");
  }
  const supabase = auth.supabase;

  const { data: article, error } = await supabase
    .from("article_drafts")
    .select("id,keyword,title,slug,content,status,search_intent,meta_title,meta_description,created_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !article) notFound();

  return (
    <main className="min-h-screen bg-[#f5f7f2] px-5 py-10 text-[#17351f]">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin/articles" className="text-sm font-bold text-emerald-800">← Article review queue</Link>
        <header className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#a47b20]">Editorial review · {article.status}</p>
          <h1 className="mt-3 text-3xl font-black">{article.title}</h1>
          <p className="mt-3 text-sm text-[#647468]">Keyword: {article.keyword} · Intent: {article.search_intent ?? "—"}</p>
          <p className="mt-2 break-all text-xs text-[#647468]">Slug: {article.slug}</p>
        </header>
        <section className="mt-5 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black">SEO metadata</h2>
          <p className="mt-3 text-sm"><strong>Meta title:</strong> {article.meta_title ?? "—"}</p>
          <p className="mt-2 text-sm"><strong>Meta description:</strong> {article.meta_description ?? "—"}</p>
        </section>
        <section className="mt-5 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black">Draft content</h2>
          <pre className="mt-4 whitespace-pre-wrap break-words font-sans text-sm leading-7">{article.content ?? "No draft content."}</pre>
        </section>
        <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          Review-only page: this draft is not published here. Publication must use a separately authorized and audited workflow.
        </p>
      </div>
    </main>
  );
}
