import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminPage, type AdminCapability } from "@/lib/admin/authz";
import TaxonomyFields from "@/components/admin/TaxonomyFields";
import AdminCreateProductForm from "@/components/admin/AdminCreateProductForm";
import { getCategory, getSubcategory } from "@/lib/marketplace/taxonomy";

async function requireAdmin(capability: AdminCapability = "catalog.read") {
  const { supabase, user } = await requireAdminPage(capability);
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
  const seoTitle = String(formData.get("seoTitle") ?? "").trim();
  const seoDescription = String(formData.get("seoDescription") ?? "").trim();
  const seoKeywords = String(formData.get("seoKeywords") ?? "").split(",").map(value => value.trim()).filter(Boolean);
  const seoContent = String(formData.get("seoContent") ?? "").trim();
  const seoFaqsRaw = String(formData.get("seoFaqs") ?? "[]");
  const seoImageAltTexts = String(formData.get("seoImageAltTexts") ?? "").split("\\n").map(value => value.trim()).filter(Boolean);
  let seoFaqs: unknown;
  try { seoFaqs = JSON.parse(seoFaqsRaw); } catch { redirect("/admin/products?notice=invalid"); }
  const categoryEntry = categorySlug ? getCategory(categorySlug) : undefined;
  const subcategoryEntry = categorySlug && subcategorySlug ? getSubcategory(categorySlug, subcategorySlug) : undefined;
  if (!productId || !name || !Number.isFinite(price) || price < 0 || !Number.isFinite(stock) || stock < 0 || !Number.isFinite(commission) || commission < 0 || commission > 100 || !["draft","active","paused","sold_out"].includes(status) || (!categorySlug ? Boolean(subcategorySlug) : !categoryEntry || Boolean(subcategorySlug && !subcategoryEntry)) || seoTitle.length > 70 || seoDescription.length > 160 || seoContent.length > 10000 || seoKeywords.length > 10 || seoKeywords.some(value => value.length > 60) || seoImageAltTexts.length > 4 || seoImageAltTexts.some(value => value.length > 250) || !Array.isArray(seoFaqs)) {
    redirect("/admin/products?notice=invalid");
  }
  const supabase = await requireAdmin("catalog.edit");
  const { error: productError } = await supabase.rpc("admin_update_product", {
    p_product_id: productId, p_name: name, p_description: description || null,
    p_price: price, p_stock: stock, p_commission_percent: commission, p_status: status,
  });
  const { error: categoryError } = productError ? { error: productError } : await supabase.rpc("admin_set_product_taxonomy", {
    p_product_id: productId, p_category_slug: categorySlug || null, p_subcategory_slug: subcategorySlug || null,
  });
  const { error: seoError } = productError || categoryError ? { error: productError || categoryError } : await supabase.rpc("admin_update_product_seo", {
    p_product_id: productId,
    p_seo_title: seoTitle || null,
    p_seo_description: seoDescription || null,
    p_seo_keywords: seoKeywords,
    p_seo_content: seoContent || null,
    p_seo_faqs: seoFaqs as never,
  });
  const { error: altTextError } = productError || categoryError || seoError ? { error: productError || categoryError || seoError } : await supabase.rpc("admin_update_product_seo_assistant_details", {
    p_product_id: productId,
    p_seo_image_alt_texts: seoImageAltTexts,
    p_seo_attribute_suggestions: [],
  });
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/marketplace");
  revalidatePath("/sitemap.xml");
  redirect(productError || categoryError || seoError || altTextError ? "/admin/products?notice=error" : "/admin/products?notice=saved");
}

export default async function AdminProductsPage({ searchParams }: { searchParams?: { notice?: string; q?: string; status?: string } }) {
  const supabase = await requireAdmin();
  const search = String(searchParams?.q ?? "").trim().slice(0, 100).replace(/[%_]/g, "");
  const statusFilter = (["draft", "active", "paused", "sold_out"].includes(searchParams?.status ?? "") ? searchParams?.status : "") as "" | "draft" | "active" | "paused" | "sold_out";
  let productsQuery = supabase.from("products")
    .select("id,slug,name,description,price,stock,reseller_commission_percent,status,farmer_id,category,category_slug,subcategory_slug,image_url,image_urls,seo_title,seo_description,seo_keywords,seo_content,seo_faqs,seo_image_alt_texts,updated_at");
  if (search) productsQuery = productsQuery.ilike("name", `%${search}%`);
  if (statusFilter) productsQuery = productsQuery.eq("status", statusFilter);
  const { data: products, error } = await productsQuery.order("updated_at", { ascending: false }).limit(100);

  return <main className="min-h-screen bg-[#f4f7f1] px-4 py-8 text-[#17351f] sm:px-6">
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#123b27] p-5 text-white"><div><Link href="/admin" className="text-xl font-black">AGRIVA Admin</Link><p className="mt-1 text-xs text-emerald-100">Catalogue management</p></div><Link href="/admin" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">← Admin overview</Link></header>
      <h1 className="mt-7 text-3xl font-black">পণ্য ব্যবস্থাপনা</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[#637266]">নাম, বিবরণ, মূল্য, স্টক, রিসেলার কমিশন, taxonomy, gallery alt text ও SEO তথ্য পরিবর্তন করুন। Slug পরিবর্তন redirect migration প্রস্তুত না হওয়া পর্যন্ত read-only থাকবে।</p>
      <form method="get" className="mt-5 grid gap-3 rounded-2xl border border-[#dfe8dc] bg-white p-4 sm:grid-cols-[minmax(0,1fr)_180px_auto_auto] sm:items-end">
        <label className="text-sm font-bold">পণ্য খুঁজুন<input name="q" type="search" maxLength={100} defaultValue={search} placeholder="পণ্যের নাম লিখুন..." className="mt-1.5 min-h-11 w-full rounded-xl border border-[#d9e3d5] px-3 font-normal"/></label>
        <label className="text-sm font-bold">স্ট্যাটাস<select name="status" defaultValue={statusFilter} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#d9e3d5] bg-white px-3 font-normal"><option value="">সব স্ট্যাটাস</option><option value="draft">Draft</option><option value="active">Active</option><option value="paused">Paused</option><option value="sold_out">Sold out</option></select></label>
        <button type="submit" className="min-h-11 rounded-xl bg-[#17452c] px-5 text-sm font-bold text-white">Filter</button>
        <a href="/admin/products" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#d9e3d5] px-4 text-sm font-bold text-[#345a40]">Clear</a>
      </form>
      <p className="mt-3 text-xs text-[#748074]">সর্বশেষ আপডেট হওয়া সর্বোচ্চ ১০০টি পণ্য দেখানো হচ্ছে। Search ও status filter server-side প্রয়োগ হয়।</p>
      {searchParams?.notice && <p role="status" className={`mt-5 rounded-xl border p-3 text-sm font-semibold ${searchParams.notice === "saved" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-800"}`}>{searchParams.notice === "saved" ? "পণ্যের তথ্য আপডেট হয়েছে।" : searchParams.notice === "invalid" ? "সঠিক তথ্য দিন; কমিশন ০ থেকে ১০০-এর মধ্যে হতে হবে।" : "পণ্য, taxonomy বা SEO তথ্য সংরক্ষণ করা যায়নি। অনুমতি ও database RPC যাচাই করুন।"}</p>}
      {error && <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">পণ্য তালিকা পড়া যায়নি। Database migration এবং product schema যাচাই করুন।</p>}
      <AdminCreateProductForm />
      <div className="mt-6 grid gap-4">{(products ?? []).map(p => <form key={p.id} action={saveProduct} className="rounded-2xl border border-[#dfe8dc] bg-white p-5 shadow-sm">
        <input type="hidden" name="productId" value={p.id}/>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><p className="font-black">{p.name}</p><p className="mt-1 text-xs text-[#7b887d]">ID {p.id.slice(0,8)} · Seller {p.farmer_id.slice(0,8)}</p><p className="mt-1 break-all text-xs text-[#7b887d]">Slug: {p.slug ?? "Not set"}</p></div><span className="rounded-full bg-[#edf4e9] px-3 py-1 text-xs font-extrabold">{p.status}</span></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="text-sm font-bold">পণ্যের নাম<input name="name" required maxLength={160} defaultValue={p.name} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
          <label className="text-sm font-bold">মূল্য (৳)<input name="price" type="number" min="0" step="0.01" required defaultValue={p.price} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
          <label className="text-sm font-bold">স্টক<input name="stock" type="number" min="0" step="0.01" required defaultValue={p.stock} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
          <label className="text-sm font-bold">রিসেলার কমিশন (%)<input name="commission" type="number" min="0" max="100" step="0.01" required defaultValue={p.reseller_commission_percent} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
          <TaxonomyFields categorySlug={p.category_slug} subcategorySlug={p.subcategory_slug} legacyCategory={p.category} />
          <label className="text-sm font-bold">অবস্থা<select name="status" defaultValue={p.status} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal"><option value="draft">Draft</option><option value="active">Active</option><option value="paused">Paused</option><option value="sold_out">Sold out</option></select></label>
          <div className="flex items-end"><button className="w-full rounded-xl bg-[#17452c] px-4 py-3 text-sm font-extrabold text-white">Save changes</button></div>
          <label className="text-sm font-bold md:col-span-2 xl:col-span-3">বিবরণ<textarea name="description" rows={3} maxLength={5000} defaultValue={p.description ?? ""} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
        </div>
        <section className="mt-5 rounded-xl border border-[#e4eadf] bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-extrabold">Product media gallery</h3><span className="text-xs text-[#718071]">Existing media · view only</span></div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {[...new Set([...(p.image_urls ?? []), p.image_url].filter((value): value is string => Boolean(value?.trim())))].map((url, index) => (
              <div key={url} className="min-w-0 rounded-xl border border-[#e4eadf] bg-[#f8faf6] p-3">
                <a href={url} target="_blank" rel="noreferrer" className="break-all text-xs font-semibold text-emerald-800 underline">Open image {index + 1}</a>
                <p className="mt-1 break-all text-[11px] text-[#718071]">{url}</p>
              </div>
            ))}
            {!p.image_url && !p.image_urls?.length && <p className="text-sm text-[#718071]">No product images found.</p>}
          </div>
          <label className="mt-4 block text-sm font-bold">Image alt text (প্রতি লাইনে একটি; gallery order অনুযায়ী)
            <textarea name="seoImageAltTexts" rows={3} maxLength={1000} defaultValue={(p.seo_image_alt_texts ?? []).join("\\n")} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal" placeholder="প্রথম ছবির alt text\\nদ্বিতীয় ছবির alt text"/>
          </label>
          <p className="mt-2 text-xs leading-5 text-[#718071]">Admin image upload/replace এখনো বন্ধ: production Storage policy-তে seller-owned upload-ই অনুমোদিত। Access model review না করে এই browser form থেকে upload চালু করা হবে না।</p>
        </section>
        <section className="mt-5 rounded-xl border border-[#e4eadf] bg-[#f8faf6] p-4">
          <h3 className="font-extrabold">SEO ও সার্চ প্রিভিউ</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="text-sm font-bold">SEO title<input name="seoTitle" maxLength={70} defaultValue={p.seo_title ?? ""} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal" placeholder="সর্বোচ্চ ৭০ অক্ষর"/></label>
            <label className="text-sm font-bold">SEO description<input name="seoDescription" maxLength={160} defaultValue={p.seo_description ?? ""} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal" placeholder="সর্বোচ্চ ১৬০ অক্ষর"/></label>
            <label className="text-sm font-bold md:col-span-2">SEO keywords (কমা দিয়ে আলাদা করুন)<input name="seoKeywords" defaultValue={(p.seo_keywords ?? []).join(", ")} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal" placeholder="সর্বোচ্চ ১০টি keyword"/></label>
            <label className="text-sm font-bold md:col-span-2">SEO content<textarea name="seoContent" rows={3} maxLength={10000} defaultValue={p.seo_content ?? ""} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal"/></label>
            <label className="text-sm font-bold md:col-span-2">SEO FAQs (JSON array)<textarea name="seoFaqs" rows={4} defaultValue={JSON.stringify(p.seo_faqs ?? [], null, 2)} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-mono text-xs font-normal"/></label>
          </div>
          <p className="mt-2 text-xs text-[#718071]">FAQ প্রতিটি object-এ question ও answer থাকতে হবে। সর্বোচ্চ ৮টি FAQ; title ৭০, description ১৬০ অক্ষরের মধ্যে রাখুন।</p>
        </section>
        <p className="mt-3 text-xs text-[#7b887d]">Last updated: {new Date(p.updated_at).toLocaleDateString("en-GB")}</p>
      </form>)}
      {!products?.length && !error && <div className="rounded-2xl border border-dashed bg-white p-10 text-center"><p className="font-bold">{search || statusFilter ? "এই filter-এ কোনো পণ্য পাওয়া যায়নি।" : "Database-এ এখনো কোনো পণ্য নেই।"}</p><p className="mt-2 text-sm text-[#748074]">Filter clear করে আবার চেষ্টা করুন। Sample preview products বাস্তব database পণ্য নয়।</p></div>}</div>
    </div>
  </main>;
}
