import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findMarketplaceOrganizationWithAccess } from "@/lib/authz/module-access";

type SellerProduct = {
  id: string;
  name: string;
  slug: string | null;
  category: string | null;
  price: number | string;
  stock: number | string;
  status: string;
  created_at: string;
};

const statusLabels: Record<string, string> = {
  draft: "পর্যালোচনাধীন",
  active: "প্রকাশিত",
  paused: "সাময়িক বন্ধ",
  sold_out: "স্টক শেষ",
};

export default async function SellerProductsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/seller/products");

  const access = await findMarketplaceOrganizationWithAccess("read");
  if (!access.allowed) redirect("/account/verification");

  const { data, error } = await supabase
    .from("products")
    .select("id,name,slug,category,price,stock,status,created_at")
    .eq("farmer_id", user.id)
    .eq("marketplace_channel", "marketplace")
    .order("created_at", { ascending: false })
    .limit(100);
  const products = (data ?? []) as SellerProduct[];

  return (
    <main className="min-h-screen bg-[#f5f8f1] px-4 py-8 text-[#17351f] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#123b27] p-5 text-white">
          <div><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-100">AGRIVA Seller Centre</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">আমার ব্যবসার পণ্য</h1></div>
          <Link href="/seller/products/new" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-lime-300 px-4 py-2.5 text-sm font-extrabold text-[#17351f]">+ নতুন পণ্য যোগ করুন</Link>
        </header>
        <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold">
          <Link href="/marketplace" className="rounded-xl border border-emerald-900/15 bg-white px-4 py-3 hover:bg-emerald-50">Marketplace দেখুন</Link>
          <Link href="/dashboard" className="rounded-xl border border-emerald-900/15 bg-white px-4 py-3 hover:bg-emerald-50">ড্যাশবোর্ড</Link>
        </div>
        {error ? (
          <p role="status" className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">পণ্যের তালিকা লোড করা যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।</p>
        ) : products.length ? (
          <div className="mt-6 space-y-3">{products.map((product) => (
            <article key={product.id} className="flex flex-col gap-3 rounded-2xl border border-emerald-950/10 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0"><h2 className="break-words text-lg font-extrabold">{product.name}</h2><p className="mt-1 text-sm text-slate-600">{product.category || "কৃষি পণ্য"} · মজুত {Number(product.stock).toLocaleString("bn-BD")}</p><p className="mt-1 text-sm font-bold text-emerald-900">৳{Number(product.price).toLocaleString("bn-BD")}</p></div>
              <div className="flex shrink-0 flex-wrap items-center gap-3"><span className={product.status === "active" ? "rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-800" : "rounded-full bg-amber-50 px-3 py-1.5 text-xs font-extrabold text-amber-900"}>{statusLabels[product.status] || "অবস্থা যাচাই করুন"}</span>{product.status === "active" && product.slug && <Link href={`/marketplace/${product.slug}`} className="text-sm font-bold text-emerald-800 underline">পণ্য দেখুন</Link>}</div>
            </article>
          ))}</div>
        ) : (
          <section className="mt-6 rounded-2xl border border-dashed border-emerald-900/20 bg-white p-8 text-center"><h2 className="text-xl font-black">এখনো কোনো পণ্য যোগ করেননি</h2><p className="mt-2 text-sm leading-6 text-slate-600">আপনার ব্যবসার পণ্য যোগ করুন। অ্যাডমিন অনুমোদনের আগে সেটি পাবলিক Marketplace-এ দেখা যাবে না।</p><Link href="/seller/products/new" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-900 px-5 py-3 text-sm font-extrabold text-white">প্রথম পণ্য যোগ করুন</Link></section>
        )}
      </div>
    </main>
  );
}
