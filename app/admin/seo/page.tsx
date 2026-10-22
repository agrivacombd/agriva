import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/dashboard");
  return supabase;
}

type Product = {
  id: string; name: string; slug: string | null; status: string | null; moderation_status: string | null;
  description: string | null; seo_title: string | null; seo_description: string | null; image_url: string | null;
  brand: string | null; sku: string | null; category: string | null; crop_name?: string | null;
  seed_variety?: string | null; pack_size?: string | null; germination_rate?: number | null;
  sowing_season?: string | null; suitable_regions?: string | null;
};

function audit(p: Product) {
  const checks = [
    ["SEO title", Boolean(p.seo_title?.trim() && p.seo_title.length <= 70)],
    ["Meta description", Boolean(p.seo_description?.trim() && p.seo_description.length >= 50 && p.seo_description.length <= 170)],
    ["Useful description", Boolean(p.description?.trim() && p.description.trim().length >= 80)],
    ["HTTPS product image", Boolean(p.image_url && /^https:\/\//i.test(p.image_url))],
    ["Category", Boolean(p.category?.trim())],
    ["Brand", Boolean(p.brand?.trim())],
    ["SKU", Boolean(p.sku?.trim())],
  ] as const;
  const seedChecks = [["Crop", Boolean(p.crop_name)], ["Variety", Boolean(p.seed_variety)], ["Pack size", Boolean(p.pack_size)], ["Germination", p.germination_rate != null], ["Sowing season", Boolean(p.sowing_season)], ["Suitable region", Boolean(p.suitable_regions)]] as const;
  const isSeed = /seed|বীজ/i.test([p.name, p.category ?? ""].join(" "));
  const all = isSeed ? [...checks, ...seedChecks] : [...checks];
  const done = all.filter(x => x[1]).length;
  return { score: Math.round(done / all.length * 100), missing: all.filter(x => !x[1]).map(x => x[0]), isSeed };
}

export default async function SeoAuditPage() {
  const supabase = await requireAdmin();
  const { data, error } = await supabase.from("products")
    .select("id,name,slug,status,moderation_status,description,seo_title,seo_description,image_url,brand,sku,category,crop_name,seed_variety,pack_size,germination_rate,sowing_season,suitable_regions")
    .order("updated_at", { ascending: false }).limit(500);
  const products = (data ?? []) as Product[];
  const rows = products.map(p => ({ product: p, result: audit(p) }));
  const average = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.result.score, 0) / rows.length) : 0;
  const feedEligible = products.filter(p => p.status === "active" && p.moderation_status === "approved" && Boolean(p.slug && p.image_url && Number((p as Product & { stock?: number }).stock ?? 0) > 0)).length;
  return <main className="min-h-screen bg-[#f4f7f1] px-4 py-8 text-[#17351f] sm:px-6"><div className="mx-auto max-w-7xl">
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#123b27] p-5 text-white"><div><p className="text-sm text-emerald-100">AGRIVA Admin</p><h1 className="text-2xl font-black">SEO Audit Dashboard</h1></div><Link href="/admin" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">← Admin overview</Link></header>
    <p className="mt-5 text-sm leading-6 text-[#637266]">Completeness score হলো catalogue checklist—এটি Google ranking score নয়। সর্বোচ্চ ৫০০টি সাম্প্রতিক পণ্য যাচাই করা হয়।</p>
    {error && <p role="alert" className="mt-4 rounded-xl bg-amber-50 p-4 text-amber-900">SEO audit query ব্যর্থ হয়েছে। Migration 030 প্রয়োগ করা আছে কি না যাচাই করুন।</p>}
    <section className="mt-6 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl bg-white p-5"><p className="text-sm text-slate-500">Audited products</p><p className="mt-2 text-3xl font-black">{products.length}</p></div><div className="rounded-2xl bg-white p-5"><p className="text-sm text-slate-500">Average completeness</p><p className="mt-2 text-3xl font-black">{average}%</p></div><div className="rounded-2xl bg-white p-5"><p className="text-sm text-slate-500">Potential feed candidates</p><p className="mt-2 text-3xl font-black">{feedEligible}</p><p className="mt-1 text-xs text-slate-500">Image, stock and feed requirements still need review</p></div></section>
    <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-emerald-50"><tr><th className="p-3">Product</th><th className="p-3">Score</th><th className="p-3">Missing fields</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead><tbody>{rows.map(({product,result})=><tr key={product.id} className="border-t border-slate-100"><td className="p-3"><p className="font-bold">{product.name}</p><p className="text-xs text-slate-500">{result.isSeed ? "Seed attributes included" : "General product"}</p></td><td className="p-3"><span className="font-black">{result.score}%</span><div className="mt-1 h-2 w-24 rounded bg-slate-100"><div className="h-2 rounded bg-emerald-700" style={{width:`${result.score}%`}} /></div></td><td className="max-w-sm p-3 text-slate-600">{result.missing.length ? result.missing.join(", ") : "Complete"}</td><td className="p-3">{product.status ?? "unknown"}{product.moderation_status ? ` / ${product.moderation_status}` : ""}</td><td className="p-3"><Link className="font-bold text-emerald-800 underline" href="/admin/products">Edit catalogue</Link></td></tr>)}</tbody></table></div>
    <p className="mt-5 text-sm">Merchant Center feed: <Link className="font-bold underline" href="/api/merchant-center">/api/merchant-center</Link></p>
  </div></main>;
}
