import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ArticleEvidenceEditor from "./article-evidence-editor";

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
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError || profile?.role !== "admin") redirect("/dashboard");

  const { data: article, error } = await supabase
    .from("content_drafts")
    .select("id,title,slug,body_markdown,status,editorial_version,search_intent,primary_keyword,meta_title,meta_description,created_at,author_name,reviewer_name,hero_image_url,hero_image_width,hero_image_height,hero_image_alt,hero_image_license,hero_image_rights_note,hero_image_verified_by,author_verified_by,claim_evidence")
    .eq("id", id).eq("content_type", "article")
    .maybeSingle();

  if (error || !article) notFound();

  return (
    <main className="min-h-screen bg-[#f5f7f2] px-5 py-10 text-[#17351f]">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin/articles" className="text-sm font-bold text-emerald-800">← Article review queue</Link>
        <header className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#a47b20]">Editorial review · {article.status}</p>
          <h1 className="mt-3 text-3xl font-black">{article.title}</h1>
          <p className="mt-3 text-sm text-[#647468]">Keyword: {article.primary_keyword} · Intent: {article.search_intent ?? "—"}</p>
          <p className="mt-2 break-all text-xs text-[#647468]">Slug: {article.slug}</p>
        </header>
        <section className="mt-5 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black">SEO metadata</h2>
          <p className="mt-3 text-sm"><strong>Meta title:</strong> {article.meta_title ?? "—"}</p>
          <p className="mt-2 text-sm"><strong>Meta description:</strong> {article.meta_description ?? "—"}</p>
        </section>
        <section className="mt-5 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black">Draft content</h2>
          <pre className="mt-4 whitespace-pre-wrap break-words font-sans text-sm leading-7">{article.body_markdown ?? "No draft content."}</pre>
        </section>
        <ArticleEvidenceEditor id={article.id} status={article.status} initial={article} />
        <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          Publication requires admin authorization, verified byline, reviewed image rights and per-claim evidence. Save metadata before approval; published articles must return to review before edits.
        </p>
      </div>
    </main>
  );
}
