import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  const category = String(formData.get("category") ?? "").trim();
  const seoTitle = String(formData.get("seo_title") ?? "").trim();
  const seoDescription = String(formData.get("seo_description") ?? "").trim();
  const seoKeywords = String(formData.get("seo_keywords") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim();
  if (seoTitle.length > 70 || seoDescription.length > 170 || seoKeywords.length > 500 || imageUrl.length > 2048 || (imageUrl && !/^https:\/\//i.test(imageUrl)) || brand.length > 120 || sku.length > 100) redirect("/admin/products?notice=invalid");
  if (!productId || !name || !Number.isFinite(price) || price < 0 || !Number.isFinite(stock) || stock < 0 || !Number.isFinite(commission) || commission < 0 || commission > 100 || !["draft","active","paused","sold_out"].includes(status)) {
    redirect("/admin/products?notice=invalid");
  }
  const supabase = await requireAdmin();
  const { error: productError } = await supabase.rpc("admin_update_product", {
    p_product_id: productId, p_name: name, p_description: description || null,
    p_price: price, p_stock: stock, p_commission_percent: commission, p_status: status,
    p_category: category || null, p_seo_title: seoTitle || null, p_seo_description: seoDescription || null,
    p_seo_keywords: seoKeywords || null, p_image_url: imageUrl || null, p_brand: brand || null, p_sku: sku || null,
  });
  const { error: categoryError } = productError ? { error: productError } : await supabase.rpc("admin_set_product_category", {
    p_product_id: productId, p_category: category || null,
  });
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/marketplace");
  redirect(productError || categoryError ? "/admin/products?notice=error" : "/admin/products?notice=saved");
}


async function createProduct(formData: FormData) {
  "use server";
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(formData.get("price"));
  const stock = Number(formData.get("stock"));
  const commission = Number(formData.get("commission"));
  const status = String(formData.get("status") ?? "draft");
  const category = String(formData.get("category") ?? "").trim();
  const seoTitle = String(formData.get("seo_title") ?? "").trim();
  const seoDescription = String(formData.get("seo_description") ?? "").trim();
  const seoKeywords = String(formData.get("seo_keywords") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim();
  if (seoTitle.length > 70 || seoDescription.length > 170 || seoKeywords.length > 500 || imageUrl.length > 2048 || (imageUrl && !/^https:\/\//i.test(imageUrl)) || brand.length > 120 || sku.length > 100) redirect("/admin/products?notice=invalid");
  if (!name || name.length > 160 || !Number.isFinite(price) || price < 0 || !Number.isFinite(stock) || stock < 0 || !Number.isFinite(commission) || commission < 0 || commission > 100 || !["draft","active","paused","sold_out"].includes(status)) {
    redirect("/admin/products?notice=invalid");
  }
  const supabase = await requireAdmin();
  const { error } = await supabase.rpc("admin_create_product", {
    p_name: name, p_description: description || null, p_price: price, p_stock: stock,
    p_commission_percent: commission, p_status: status, p_category: category || null,
    p_seo_title: seoTitle || null, p_seo_description: seoDescription || null, p_seo_keywords: seoKeywords || null,
    p_image_url: imageUrl || null, p_brand: brand || null, p_sku: sku || null,
  });
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/marketplace");
  redirect(error ? "/admin/products?notice=create_error" : "/admin/products?notice=created");
}

export default async function AdminProductsPage({ searchParams }: { searchParams?: Promise<{ notice?: string }> }) {
  const params = await searchParams;
  const supabase = await requireAdmin();
  const [{ data: products, error }, { data: categories }] = await Promise.all([
    supabase.from("products")
      .select("id,name,description,price,stock,reseller_commission_percent,status,farmer_id,category,updated_at,seo_title,seo_description,seo_keywords,image_url,brand,sku")
      .order("updated_at", { ascending: false }).limit(100),
    supabase.from("product_categories").select("name,is_active").order("sort_order").order("name"),
  ]);

  return <main className="min-h-screen bg-[#f4f7f1] px-4 py-8 text-[#17351f] sm:px-6">
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#123b27] p-5 text-white"><div><Link href="/admin" className="text-xl font-black">AGRIVA Admin</Link><p className="mt-1 text-xs text-emerald-100">Catalogue management</p></div><Link href="/admin" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">← Admin overview</Link></header>
      <h1 className="mt-7 text-3xl font-black">পণ্য ব্যবস্থাপনা</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[#637266]">নাম, বিবরণ, মূল্য, স্টক, রিসেলার কমিশন ও পণ্যের অবস্থা পরিবর্তন করুন। পরিবর্তনগুলো audit log-এ সংরক্ষিত হবে।</p>
      {params?.notice && <p role="status" className={`mt-5 rounded-xl border p-3 text-sm font-semibold ${["saved","created"].includes(params.notice) ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-800"}`}>{params.notice === "saved" ? "পণ্যের তথ্য আপডেট হয়েছে।" : params.notice === "created" ? "নতুন পণ্য database-এ সংরক্ষিত হয়েছে।" : params.notice === "invalid" ? "সঠিক তথ্য দিন; কমিশন ০ থেকে ১০০-এর মধ্যে হতে হবে।" : params.notice === "create_error" ? "নতুন পণ্য তৈরি হয়নি। Migration 028, category ও database permissions যাচাই করুন।" : "আপডেট করা যায়নি। Migration 024 ও database schema যাচাই করুন।"}</p>}
      {error && <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">পণ্য তালিকা পড়া যায়নি। Database migration এবং product schema যাচাই করুন।</p>}

      <section className="mt-6 rounded-2xl border border-[#dfe8dc] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black">নতুন পণ্য যোগ করুন</h2>
        <p className="mt-1 text-sm text-[#748074]">এখানে সংরক্ষিত পণ্যই বাস্তব marketplace catalogue-এ ব্যবহার হবে। সঠিক পণ্য-তথ্য দিন; নমুনা তথ্য দিয়ে live পণ্য তৈরি করবেন না।</p>
        <form action={createProduct} className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="text-sm font-bold">পণ্যের নাম<input name="name" required maxLength={160} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-bold">মূল্য (৳)<input name="price" type="number" min="0" step="0.01" required className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-bold">স্টক<input name="stock" type="number" min="0" step="0.01" defaultValue="0" required className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-bold">রিসেলার কমিশন (%)<input name="commission" type="number" min="0" max="100" step="0.01" defaultValue="0" required className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-bold">ক্যাটাগরি<select name="category" defaultValue="" className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal"><option value="">ক্যাটাগরি নেই</option>{(categories ?? []).filter(category => category.is_active).map(category => <option key={category.name} value={category.name}>{category.name}</option>)}</select></label>
          <label className="text-sm font-bold">অবস্থা<select name="status" defaultValue="draft" className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal"><option value="draft">Draft</option><option value="active">Active</option><option value="paused">Paused</option><option value="sold_out">Sold out</option></select></label>
          <label className="text-sm font-bold md:col-span-2 xl:col-span-3">বিবরণ<textarea name="description" rows={3} maxLength={5000} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" /></label>
          <div className="md:col-span-2 xl:col-span-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4"><h3 className="font-extrabold">SEO ও Google Product Schema</h3><p className="mt-1 text-xs text-slate-600">নিজস্ব, সঠিক তথ্য দিন। Title ৫০–৬০ অক্ষর এবং description প্রায় ১৫০–১৬০ অক্ষর রাখুন। Google ranking নিশ্চিত নয়।</p><div className="mt-3 grid gap-3 md:grid-cols-2"><label className="text-sm font-bold">SEO title (সর্বোচ্চ ৭০)<input name="seo_title" maxLength={70} placeholder="যেমন: উন্নত মানের ধান বীজ | AGRIVA" className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"/></label><label className="text-sm font-bold">Brand<input name="brand" maxLength={120} placeholder="প্রকৃত ব্র্যান্ডের নাম" className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"/></label><label className="text-sm font-bold md:col-span-2">Meta description (সর্বোচ্চ ১৭০)<textarea name="seo_description" maxLength={170} rows={2} placeholder="বীজের জাত, প্যাকেটের পরিমাণ, উপযোগিতা ও গুরুত্বপূর্ণ তথ্য লিখুন" className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"/></label><label className="text-sm font-bold">Keywords (কমা দিয়ে আলাদা)<input name="seo_keywords" maxLength={500} placeholder="ধানের বীজ, বীজ বাংলাদেশ" className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"/></label><label className="text-sm font-bold">SKU / পণ্য কোড<input name="sku" maxLength={100} placeholder="নিজস্ব ইউনিক কোড" className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"/></label><label className="text-sm font-bold md:col-span-2">পণ্যের ছবির HTTPS URL<input name="image_url" type="url" maxLength={2048} placeholder="https://... (পণ্যের আসল ছবি)" className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"/></label></div></div>
          <div className="md:col-span-2 xl:col-span-3"><button className="rounded-xl bg-[#17452c] px-5 py-3 text-sm font-extrabold text-white">পণ্য সংরক্ষণ করুন</button></div>
        </form>
      </section>
      <div className="mt-6 grid gap-4">{(products ?? []).map(p => <form key={p.id} action={saveProduct} className="rounded-2xl border border-[#dfe8dc] bg-white p-5 shadow-sm">
        <input type="hidden" name="productId" value={p.id}/>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><p className="font-black">{p.name}</p><p className="mt-1 text-xs text-[#7b887d]">ID {p.id.slice(0,8)} · Seller {p.farmer_id.slice(0,8)}</p></div><span className="rounded-full bg-[#edf4e9] px-3 py-1 text-xs font-extrabold">{p.status}</span></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="text-sm font-bold">পণ্যের নাম<input name="name" required maxLength={160} defaultValue={p.name} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
          <label className="text-sm font-bold">মূল্য (৳)<input name="price" type="number" min="0" step="0.01" required defaultValue={p.price} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
          <label className="text-sm font-bold">স্টক<input name="stock" type="number" min="0" step="0.01" required defaultValue={p.stock} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
          <label className="text-sm font-bold">রিসেলার কমিশন (%)<input name="commission" type="number" min="0" max="100" step="0.01" required defaultValue={p.reseller_commission_percent} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
          <label className="text-sm font-bold">ক্যাটাগরি<select name="category" defaultValue={p.category ?? ""} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal"><option value="">ক্যাটাগরি নেই</option>{(categories ?? []).map(category => <option key={category.name} value={category.name}>{category.name}{category.is_active ? "" : " (Inactive)"}</option>)}</select></label>
          <label className="text-sm font-bold">অবস্থা<select name="status" defaultValue={p.status} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal"><option value="draft">Draft</option><option value="active">Active</option><option value="paused">Paused</option><option value="sold_out">Sold out</option></select></label>
          <div className="flex items-end"><button className="w-full rounded-xl bg-[#17452c] px-4 py-3 text-sm font-extrabold text-white">Save changes</button></div>
          <label className="text-sm font-bold md:col-span-2 xl:col-span-3">বিবরণ<textarea name="description" rows={3} maxLength={5000} defaultValue={p.description ?? ""} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
        </div>
          <div className="md:col-span-2 xl:col-span-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4"><h3 className="font-extrabold">SEO ও Google Product Schema</h3><p className="mt-1 text-xs text-slate-600">Title ৫০–৬০ অক্ষর, description প্রায় ১৫০–১৬০ অক্ষর। শুধু সত্য তথ্য দিন।</p><div className="mt-3 grid gap-3 md:grid-cols-2"><label className="text-sm font-bold">SEO title<input name="seo_title" maxLength={70} defaultValue={p.seo_title ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"/></label><label className="text-sm font-bold">Brand<input name="brand" maxLength={120} defaultValue={p.brand ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"/></label><label className="text-sm font-bold md:col-span-2">Meta description<textarea name="seo_description" maxLength={170} rows={2} defaultValue={p.seo_description ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"/></label><label className="text-sm font-bold">Keywords<input name="seo_keywords" maxLength={500} defaultValue={p.seo_keywords ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"/></label><label className="text-sm font-bold">SKU<input name="sku" maxLength={100} defaultValue={p.sku ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"/></label><label className="text-sm font-bold md:col-span-2">পণ্যের ছবির HTTPS URL<input name="image_url" type="url" maxLength={2048} defaultValue={p.image_url ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"/></label></div></div>
        <p className="mt-3 text-xs text-[#7b887d]">Last updated: {new Date(p.updated_at).toLocaleDateString("en-GB")}</p>
      </form>)}
      {!products?.length && !error && <div className="rounded-2xl border border-dashed bg-white p-10 text-center"><p className="font-bold">Database-এ এখনো কোনো পণ্য নেই।</p><p className="mt-2 text-sm text-[#748074]">Sample preview products বাস্তব database পণ্য নয়।</p></div>}</div>
    </div>
  </main>;
}
