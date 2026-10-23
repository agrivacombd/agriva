import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ProductImageOptimizer from "@/components/admin/ProductImageOptimizer";

async function requireSuperAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin" || user.app_metadata?.agriva_super_admin !== true) redirect("/dashboard");
  return { supabase, user };
}

async function createProduct(formData: FormData) {
  "use server";
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const imageAlt = String(formData.get("image_alt") ?? "").trim();
  const seoTitle = String(formData.get("seo_title") ?? "").trim();
  const seoDescription = String(formData.get("seo_description") ?? "").trim();
  const seoKeywords = String(formData.get("seo_keywords") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim();
  const price = Number(formData.get("price"));
  const stock = Number(formData.get("stock"));
  const status = String(formData.get("status") ?? "draft");

  if (
    !name || name.length > 160 ||
    !Number.isFinite(price) || price < 0 || price > 9_999_999_999.99 ||
    !Number.isFinite(stock) || stock < 0 || stock > 9_999_999_999.99 ||
    description.length > 5000 || category.length > 120 ||
    (imageUrl && (imageUrl.length > 2048 || !/^https:\/\//i.test(imageUrl))) ||
    brand.length > 120 || sku.length > 100 || imageAlt.length > 180 || seoTitle.length > 70 || seoDescription.length > 170 || seoKeywords.length > 500 ||
    !["draft", "active"].includes(status)
  ) redirect("/admin/products?notice=invalid");

  const { supabase, user } = await requireSuperAdmin();
  const slugBase = name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
  const slug = `${slugBase || "retail-product"}-${crypto.randomUUID().slice(0, 8)}`;
  const { error } = await supabase.from("products").insert({
    farmer_id: user.id,
    name,
    slug,
    description: description || null,
    category: category || null,
    price,
    stock,
    status,
    image_url: imageUrl || null,
    image_alt: imageAlt || null,
    seo_title: seoTitle || null,
    seo_description: seoDescription || null,
    seo_keywords: seoKeywords || null,
    brand: brand || null,
    sku: sku || null,
  });

  revalidatePath("/admin/products");
  revalidatePath("/marketplace");
  revalidatePath("/sitemap.xml");
  redirect(error ? "/admin/products?notice=create_error" : "/admin/products?notice=created");
}

async function updateProduct(formData: FormData) {
  "use server";
  const productId = String(formData.get("productId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const price = Number(formData.get("price"));
  const stock = Number(formData.get("stock"));
  const status = String(formData.get("status") ?? "");
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const imageAlt = String(formData.get("image_alt") ?? "").trim();
  const seoTitle = String(formData.get("seo_title") ?? "").trim();
  const seoDescription = String(formData.get("seo_description") ?? "").trim();
  const seoKeywords = String(formData.get("seo_keywords") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim();
  if (!productId || !name || name.length > 160 || !Number.isFinite(price) || price < 0 ||
      !Number.isFinite(stock) || stock < 0 || !["draft", "active", "paused", "sold_out"].includes(status) ||
      description.length > 5000 || category.length > 120 || imageAlt.length > 180 || seoTitle.length > 70 || seoDescription.length > 170 || seoKeywords.length > 500 || brand.length > 120 || sku.length > 100 || (imageUrl && (imageUrl.length > 2048 || !/^https:\/\//i.test(imageUrl)))) {
    redirect("/admin/products?notice=invalid");
  }
  const { supabase, user } = await requireSuperAdmin();
  const { data: current } = await supabase.from("products")
    .select("reseller_commission_percent").eq("id", productId).maybeSingle();
  if (!current) redirect("/admin/products?notice=update_error");
  const { error: productError } = await supabase.rpc("admin_update_product", {
    p_product_id: productId, p_name: name, p_description: description || null,
    p_price: price, p_stock: stock, p_commission_percent: current.reseller_commission_percent, p_status: status,
  });
  const { error: categoryError } = productError ? { error: productError } : await supabase.rpc("admin_set_product_category", {
    p_product_id: productId, p_category: category || null,
  });
  const { error: seoError } = productError || categoryError ? { error: productError || categoryError } : await supabase.from("products").update({
    image_url: imageUrl || null, image_alt: imageAlt || null, seo_title: seoTitle || null,
    seo_description: seoDescription || null, seo_keywords: seoKeywords || null,
    brand: brand || null, sku: sku || null,
  }).eq("id", productId).eq("farmer_id", user.id);
  revalidatePath("/admin/products");
  revalidatePath("/marketplace");
  redirect(productError || categoryError || seoError ? "/admin/products?notice=update_error" : "/admin/products?notice=saved");
}

export default async function AdminProductsPage({ searchParams }: { searchParams?: Promise<{ notice?: string }> }) {
  const params = await searchParams;
  const { supabase } = await requireSuperAdmin();
  const [{ data: products, error }, { data: categories }] = await Promise.all([
    supabase.from("products")
      .select("id,name,slug,description,price,stock,reseller_commission_percent,status,farmer_id,category,updated_at,image_url,image_alt,seo_title,seo_description,seo_keywords,brand,sku")
      .order("updated_at", { ascending: false }).limit(100),
    supabase.from("product_categories").select("name,is_active").order("sort_order").order("name"),
  ]);
  const notice = params?.notice;
  const noticeText: Record<string, string> = {
    created: "নতুন পণ্য সংরক্ষিত হয়েছে। Active নির্বাচন করলে পণ্যটি Marketplace-এ দেখা যাবে।",
    saved: "পণ্যের তথ্য আপডেট হয়েছে।",
    invalid: "তথ্য যাচাই করুন। SEO title ৭০, description ১৭০, alt text ১৮০ অক্ষরের মধ্যে রাখুন; ছবি HTTPS হতে হবে।",
    create_error: "পণ্য তৈরি হয়নি। SKU duplicate বা database permission/schema error আছে কি না যাচাই করুন।",
    update_error: "পণ্য আপডেট হয়নি। Database RPC ও permissions যাচাই করুন।",
  };

  return <main className="min-h-screen bg-[#f4f7f1] px-4 py-8 text-[#17351f] sm:px-6">
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#123b27] p-5 text-white">
        <div><Link href="/admin" className="text-xl font-black">AGRIVA Super Admin</Link><p className="mt-1 text-xs text-emerald-100">Retail catalogue management</p></div>
        <Link href="/admin" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">← Admin overview</Link>
      </header>
      <h1 className="mt-7 text-3xl font-black">Retail পণ্য ব্যবস্থাপনা</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#637266]">এই পর্যায়ে শুধু Super Admin পণ্য যোগ ও প্রকাশ করবেন। Reseller, company প্রতিনিধি ও wholesaler-এর product entry পরে যোগ করা হবে।</p>
      {notice && noticeText[notice] && <p role="status" className={`mt-5 rounded-xl border p-3 text-sm font-semibold ${["created","saved"].includes(notice) ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-800"}`}>{noticeText[notice]}</p>}
      {error && <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">পণ্য তালিকা পড়া যায়নি। Live database schema যাচাই করুন।</p>}

      <section className="mt-6 rounded-2xl border border-[#dfe8dc] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black">নতুন Retail পণ্য যোগ করুন</h2>
        <form action={createProduct} className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="text-sm font-bold">পণ্যের নাম<input name="name" required maxLength={160} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-bold">মূল্য (৳)<input name="price" type="number" min="0" max="9999999999.99" step="0.01" required className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-bold">স্টক<input name="stock" type="number" min="0" max="9999999999.99" step="0.01" defaultValue="0" required className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-bold">ক্যাটাগরি<select name="category" defaultValue="" className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal"><option value="">ক্যাটাগরি নেই</option>{(categories ?? []).filter(c => c.is_active).map(c => <option key={c.name} value={c.name}>{c.name}</option>)}</select></label>
          <label className="text-sm font-bold">প্রকাশের অবস্থা<select name="status" defaultValue="draft" className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal"><option value="draft">Draft — এখনই প্রকাশ নয়</option><option value="active">Active — Marketplace-এ প্রকাশ</option></select></label>
          <label className="text-sm font-bold">ব্র্যান্ড (ঐচ্ছিক)<input name="brand" maxLength={120} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-bold">SKU / পণ্য কোড (ঐচ্ছিক)<input name="sku" maxLength={100} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" /></label>
          <div className="md:col-span-2 xl:col-span-3"><ProductImageOptimizer suggestedAlt="" /></div>
          <label className="text-sm font-bold">SEO title<input name="seo_title" maxLength={70} placeholder="পণ্যের নাম + প্রধান বৈশিষ্ট্য" className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-bold md:col-span-2">SEO description<textarea name="seo_description" rows={2} maxLength={170} placeholder="পণ্যের বাস্তব উপকারিতা ও প্রাসঙ্গিক তথ্য" className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-bold md:col-span-2 xl:col-span-3">SEO keywords (comma-separated, optional)<input name="seo_keywords" maxLength={500} placeholder="টমেটো বীজ, সবজি বীজ, কৃষি পণ্য বাংলাদেশ" className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-bold md:col-span-2 xl:col-span-3">বিবরণ<textarea name="description" rows={3} maxLength={5000} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" /></label>
          <div className="md:col-span-2 xl:col-span-3"><button className="rounded-xl bg-[#17452c] px-5 py-3 text-sm font-extrabold text-white">পণ্য সংরক্ষণ করুন</button></div>
        </form>
      </section>

      <h2 className="mt-8 text-xl font-black">আগে যোগ করা পণ্য</h2>
      <div className="mt-4 grid gap-4">{(products ?? []).map(p => <form key={p.id} action={updateProduct} className="rounded-2xl border border-[#dfe8dc] bg-white p-5 shadow-sm">
        <input type="hidden" name="productId" value={p.id} />
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><p className="font-black">{p.name}</p><p className="mt-1 text-xs text-[#7b887d]">SKU {p.sku || "—"} · Updated {new Date(p.updated_at).toLocaleDateString("en-GB")}</p></div><span className="rounded-full bg-[#edf4e9] px-3 py-1 text-xs font-extrabold">{p.status}</span></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="text-sm font-bold">পণ্যের নাম<input name="name" required maxLength={160} defaultValue={p.name} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-bold">মূল্য (৳)<input name="price" type="number" min="0" step="0.01" required defaultValue={p.price} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-bold">স্টক<input name="stock" type="number" min="0" step="0.01" required defaultValue={p.stock} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-bold">ক্যাটাগরি<select name="category" defaultValue={p.category ?? ""} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal"><option value="">ক্যাটাগরি নেই</option>{(categories ?? []).map(c => <option key={c.name} value={c.name}>{c.name}{c.is_active ? "" : " (Inactive)"}</option>)}</select></label>
          <label className="text-sm font-bold">অবস্থা<select name="status" defaultValue={p.status} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal"><option value="draft">Draft</option><option value="active">Active</option><option value="paused">Paused</option><option value="sold_out">Sold out</option></select></label>
          <div className="flex items-end"><button className="w-full rounded-xl bg-[#17452c] px-4 py-3 text-sm font-extrabold text-white">পরিবর্তন সংরক্ষণ</button></div>
          <label className="text-sm font-bold md:col-span-2 xl:col-span-3">বিবরণ<textarea name="description" rows={3} maxLength={5000} defaultValue={p.description ?? ""} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" /></label>
          <div className="md:col-span-2 xl:col-span-3"><ProductImageOptimizer initialUrl={p.image_url} initialAlt={p.image_alt} suggestedAlt={p.name} /></div>
          <label className="text-sm font-bold">SEO title<input name="seo_title" maxLength={70} defaultValue={p.seo_title ?? ""} placeholder="পণ্যের নাম + প্রধান বৈশিষ্ট্য" className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-bold md:col-span-2">SEO description<textarea name="seo_description" rows={2} maxLength={170} defaultValue={p.seo_description ?? ""} placeholder="পণ্যের বাস্তব উপকারিতা ও প্রাসঙ্গিক তথ্য" className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-bold md:col-span-2 xl:col-span-3">SEO keywords<input name="seo_keywords" maxLength={500} defaultValue={p.seo_keywords ?? ""} placeholder="প্রাসঙ্গিক keyword, কমা দিয়ে আলাদা" className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-bold">Brand<input name="brand" maxLength={120} defaultValue={p.brand ?? ""} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" /></label>
          <label className="text-sm font-bold">SKU<input name="sku" maxLength={100} defaultValue={p.sku ?? ""} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" /></label>
        </div>
      </form>)}
      {!products?.length && !error && <div className="rounded-2xl border border-dashed bg-white p-10 text-center"><p className="font-bold">Database-এ এখনো কোনো পণ্য নেই।</p><p className="mt-2 text-sm text-[#748074]">নতুন Retail পণ্য যোগ করলে এখানে দেখা যাবে।</p></div>}</div>
    </div>
  </main>;
}
