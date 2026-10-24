import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import TaxonomyFields from "@/components/admin/TaxonomyFields";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/dashboard");
  return supabase;
}

async function saveProduct(formData: FormData) {
  "use server";
  const productId = String(formData.get("productId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(formData.get("price"));
  const stock = Number(formData.get("stock"));
  const commission = Number(formData.get("commission"));
  const status = String(formData.get("status") ?? "");
  const categorySlug = String(formData.get("category_slug") ?? "").trim();
  const subcategorySlug = String(formData.get("subcategory_slug") ?? "").trim();
  if (!productId || !name || !Number.isFinite(price) || price < 0 || !Number.isFinite(stock) || stock < 0 || !Number.isFinite(commission) || commission < 0 || commission > 100 || !["draft","active","paused","sold_out"].includes(status) || (!categorySlug && Boolean(subcategorySlug))) {
    redirect("/admin/products?notice=invalid");
  }
  const supabase = await requireAdmin();
  if (categorySlug) {
    const { data: category } = await supabase.from("product_categories").select("slug").eq("slug", categorySlug).eq("is_active", true).maybeSingle();
    if (!category) redirect("/admin/products?notice=invalid");
    if (subcategorySlug) {
      const { data: subcategory } = await supabase.from("product_subcategories").select("slug").eq("category_slug", categorySlug).eq("slug", subcategorySlug).eq("is_active", true).maybeSingle();
      if (!subcategory) redirect("/admin/products?notice=invalid");
    }
  }
  const { error: productError } = await supabase.rpc("admin_update_product", {
    p_product_id: productId, p_name: name, p_description: description || null,
    p_price: price, p_stock: stock, p_commission_percent: commission, p_status: status,
  });
  const { error: categoryError } = productError ? { error: productError } : await supabase.rpc("admin_set_product_taxonomy", {
    p_product_id: productId, p_category_slug: categorySlug || null, p_subcategory_slug: subcategorySlug || null,
  });
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/marketplace");
  revalidatePath("/sitemap.xml");
  redirect(productError || categoryError ? "/admin/products?notice=error" : "/admin/products?notice=saved");
}

export default async function AdminProductsPage({ searchParams }: { searchParams?: { notice?: string } }) {
  const supabase = await requireAdmin();
  const [{ data: categories }, { data: subcategories }, { data: products, error }] = await Promise.all([
    supabase.from("product_categories").select("name,slug,is_active").eq("is_active", true).order("sort_order").order("name"),
    supabase.from("product_subcategories").select("category_slug,name,slug,is_active").eq("is_active", true).order("sort_order").order("name"),
    supabase.from("products")
    .select("id,name,description,price,stock,reseller_commission_percent,status,farmer_id,category,category_slug,subcategory_slug,updated_at")
    .order("updated_at", { ascending: false }).limit(100),
  ]);

  return <main className="min-h-screen bg-[#f4f7f1] px-4 py-8 text-[#17351f] sm:px-6">
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#123b27] p-5 text-white"><div><Link href="/admin" className="text-xl font-black">AGRIVA Admin</Link><p className="mt-1 text-xs text-emerald-100">Catalogue management</p></div><Link href="/admin" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">← Admin overview</Link></header>
      <h1 className="mt-7 text-3xl font-black">পণ্য ব্যবস্থাপনা</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[#637266]">নাম, বিবরণ, মূল্য, স্টক, রিসেলার কমিশন ও পণ্যের অবস্থা পরিবর্তন করুন। পরিবর্তনগুলো audit log-এ সংরক্ষিত হবে।</p>
      {searchParams?.notice && <p role="status" className={`mt-5 rounded-xl border p-3 text-sm font-semibold ${searchParams.notice === "saved" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-800"}`}>{searchParams.notice === "saved" ? "পণ্যের তথ্য আপডেট হয়েছে।" : searchParams.notice === "invalid" ? "সঠিক তথ্য দিন; কমিশন ০ থেকে ১০০-এর মধ্যে হতে হবে।" : "আপডেট করা যায়নি। Migration 024 ও database schema যাচাই করুন।"}</p>}
      {error && <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">পণ্য তালিকা পড়া যায়নি। Database migration এবং product schema যাচাই করুন।</p>}
      <div className="mt-6 grid gap-4">{(products ?? []).map(p => <form key={p.id} action={saveProduct} className="rounded-2xl border border-[#dfe8dc] bg-white p-5 shadow-sm">
        <input type="hidden" name="productId" value={p.id}/>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><p className="font-black">{p.name}</p><p className="mt-1 text-xs text-[#7b887d]">ID {p.id.slice(0,8)} · Seller {p.farmer_id.slice(0,8)}</p></div><span className="rounded-full bg-[#edf4e9] px-3 py-1 text-xs font-extrabold">{p.status}</span></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="text-sm font-bold">পণ্যের নাম<input name="name" required maxLength={160} defaultValue={p.name} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
          <label className="text-sm font-bold">মূল্য (৳)<input name="price" type="number" min="0" step="0.01" required defaultValue={p.price} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
          <label className="text-sm font-bold">স্টক<input name="stock" type="number" min="0" step="0.01" required defaultValue={p.stock} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
          <label className="text-sm font-bold">রিসেলার কমিশন (%)<input name="commission" type="number" min="0" max="100" step="0.01" required defaultValue={p.reseller_commission_percent} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
          <TaxonomyFields categories={(categories ?? []).map(c => ({ name: c.name, slug: c.slug }))} subcategories={(subcategories ?? []).map(s => ({ name: s.name, slug: s.slug, categorySlug: s.category_slug }))} categorySlug={p.category_slug} subcategorySlug={p.subcategory_slug} legacyCategory={p.category} />
          <label className="text-sm font-bold">অবস্থা<select name="status" defaultValue={p.status} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal"><option value="draft">Draft</option><option value="active">Active</option><option value="paused">Paused</option><option value="sold_out">Sold out</option></select></label>
          <div className="flex items-end"><button className="w-full rounded-xl bg-[#17452c] px-4 py-3 text-sm font-extrabold text-white">Save changes</button></div>
          <label className="text-sm font-bold md:col-span-2 xl:col-span-3">বিবরণ<textarea name="description" rows={3} maxLength={5000} defaultValue={p.description ?? ""} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
        </div>
        <p className="mt-3 text-xs text-[#7b887d]">Last updated: {new Date(p.updated_at).toLocaleDateString("en-GB")}</p>
      </form>)}
      {!products?.length && !error && <div className="rounded-2xl border border-dashed border-[#cbd9c8] bg-white p-8 text-center sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf4e9] text-2xl" aria-hidden="true">📦</div>
        <p className="mt-4 text-lg font-black">এখনো কোনো বাস্তব পণ্য যোগ করা হয়নি</p>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#748074]">এই পেজে বর্তমানে পণ্যের তথ্য দেখা ও সম্পাদনা করা যায়। নতুন পণ্য বিক্রেতার (Farmer) অ্যাকাউন্ট থেকে যোগ করতে হবে; যোগ হলে সেটি এখানে দেখা যাবে। Sample preview products বাস্তব database পণ্য নয়।</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/admin/users" className="rounded-xl border border-[#cbd9c8] px-4 py-3 text-sm font-bold text-[#17452c] hover:bg-[#f4f7f1]">বিক্রেতা অ্যাকাউন্ট দেখুন</Link>
          <Link href="/admin" className="rounded-xl bg-[#17452c] px-4 py-3 text-sm font-extrabold text-white hover:bg-[#123b27]">Admin Overview</Link>
        </div>
      </div>}</div>
    </div>
  </main>;
}
