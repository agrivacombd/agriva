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
  const originalStatus = String(formData.get("originalStatus") ?? "");
  const seoEnabled = String(formData.get("seoEnabled") ?? "") === "true";
  const seoTitle = String(formData.get("seo_title") ?? "").trim();
  const metaDescription = String(formData.get("meta_description") ?? "").trim();
  const shortDescription = String(formData.get("short_description") ?? "").trim();
  const imageAltText = String(formData.get("image_alt_text") ?? "").trim();
  const imageUrls = String(formData.get("image_urls") ?? "").split(/\\n|,/).map(value => value.trim()).filter(Boolean);
  const searchKeywords = String(formData.get("search_keywords") ?? "").split(/\\n|,/).map(value => value.trim()).filter(Boolean);
  const faqQuestion = String(formData.get("faq_question") ?? "").trim();
  const faqAnswer = String(formData.get("faq_answer") ?? "").trim();
  const categoryEntry = categorySlug ? getCategory(categorySlug) : undefined;
  const subcategoryEntry = categorySlug && subcategorySlug ? getSubcategory(categorySlug, subcategorySlug) : undefined;
  if (!productId || !name || !Number.isFinite(price) || price < 0 || !Number.isFinite(stock) || stock < 0 || !Number.isFinite(commission) || commission < 0 || commission > 100 || !["draft","active","paused","sold_out"].includes(status) || (!categorySlug ? Boolean(subcategorySlug) : !categoryEntry || Boolean(subcategorySlug && !subcategoryEntry))) {
    redirect("/admin/products?notice=invalid");
  }
  const supabase = await requireAdmin("catalog.edit");
  let seoError: { message: string } | null = null;
  let seoStatus = "needs_review";
  if (seoEnabled) {
    const { data: seoData, error } = await supabase.rpc("admin_update_product_seo", {
      p_product_id: productId, p_short_description: shortDescription,
      p_seo_title: seoTitle, p_meta_description: metaDescription,
      p_image_alt_text: imageAltText, p_image_urls: imageUrls,
      p_search_keywords: searchKeywords,
      p_seo_faqs: faqQuestion && faqAnswer ? [{ question: faqQuestion, answer: faqAnswer }] : [],
    });
    seoError = error;
    seoStatus = seoData?.seo_review_status ?? "needs_review";
  }
  if (seoError) redirect("/admin/products?notice=seo-error");
  if (status === "active" && originalStatus !== "active" && seoEnabled && seoStatus !== "ready") {
    redirect("/admin/products?notice=seo");
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
  const legacyColumns = "id,name,description,price,stock,reseller_commission_percent,status,farmer_id,category,category_slug,subcategory_slug,updated_at";
  const seoColumns = legacyColumns + ",seo_review_status,seo_title,meta_description,short_description,image_url,image_urls,image_alt_text,search_keywords,seo_faqs";
  let { data: products, error } = await supabase.from("products").select(seoColumns).order("updated_at", { ascending: false }).limit(100);
  if (error) ({ data: products, error } = await supabase.from("products").select(legacyColumns).order("updated_at", { ascending: false }).limit(100));

  return <main className="min-h-screen bg-[#f4f7f1] px-4 py-8 text-[#17351f] sm:px-6">
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#123b27] p-5 text-white"><div><Link href="/admin" className="text-xl font-black">AGRIVA Admin</Link><p className="mt-1 text-xs text-emerald-100">Catalogue management</p></div><div className="flex flex-wrap gap-2"><Link href="/admin/product-studio" className="rounded-xl bg-[#d9b85b] px-4 py-2 text-sm font-extrabold text-[#17351f]">✦ Product SEO Studio</Link><Link href="/admin" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">← Admin overview</Link></div></header>
      <h1 className="mt-7 text-3xl font-black">পণ্য ব্যবস্থাপনা</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[#637266]">নাম, বিবরণ, মূল্য, স্টক, রিসেলার কমিশন ও পণ্যের অবস্থা পরিবর্তন করুন। পরিবর্তনগুলো audit log-এ সংরক্ষিত হবে।</p>
      {searchParams?.notice && <p role="status" className={`mt-5 rounded-xl border p-3 text-sm font-semibold ${searchParams.notice === "saved" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-800"}`}>{searchParams.notice === "saved" ? "পণ্যের তথ্য আপডেট হয়েছে।" : searchParams.notice === "invalid" ? "সঠিক তথ্য দিন; কমিশন ০ থেকে ১০০-এর মধ্যে হতে হবে।" : "আপডেট করা যায়নি। Migration 024 ও database schema যাচাই করুন।"}</p>}
      {error && <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">পণ্য তালিকা পড়া যায়নি। Database migration এবং product schema যাচাই করুন।</p>}
      <AdminCreateProductForm />
      <div className="mt-6 grid gap-4">{(products ?? []).map(p => <form key={p.id} action={saveProduct} className="rounded-2xl border border-[#dfe8dc] bg-white p-5 shadow-sm">
        <input type="hidden" name="productId" value={p.id}/><input type="hidden" name="originalStatus" value={p.status}/><input type="hidden" name="seoEnabled" value={p.seo_review_status !== undefined ? "true" : "false"}/>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><p className="font-black">{p.name}</p><p className="mt-1 text-xs text-[#7b887d]">ID {p.id.slice(0,8)} · Seller {p.farmer_id.slice(0,8)}</p></div><div className="flex flex-wrap gap-2"><span className="rounded-full bg-[#edf4e9] px-3 py-1 text-xs font-extrabold">{p.status}</span>{p.seo_review_status !== undefined && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">SEO: {p.seo_review_status}</span>}</div></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="text-sm font-bold">পণ্যের নাম<input name="name" required maxLength={160} defaultValue={p.name} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
          <label className="text-sm font-bold">মূল্য (৳)<input name="price" type="number" min="0" step="0.01" required defaultValue={p.price} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
          <label className="text-sm font-bold">স্টক<input name="stock" type="number" min="0" step="0.01" required defaultValue={p.stock} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
          <label className="text-sm font-bold">রিসেলার কমিশন (%)<input name="commission" type="number" min="0" max="100" step="0.01" required defaultValue={p.reseller_commission_percent} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
          <TaxonomyFields categorySlug={p.category_slug} subcategorySlug={p.subcategory_slug} legacyCategory={p.category} />
          <label className="text-sm font-bold">অবস্থা<select name="status" defaultValue={p.status} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal"><option value="draft">Draft</option><option value="active">Active</option><option value="paused">Paused</option><option value="sold_out">Sold out</option></select></label>
          <div className="flex items-end"><button className="w-full rounded-xl bg-[#17452c] px-4 py-3 text-sm font-extrabold text-white">Save changes</button></div>
          <label className="text-sm font-bold md:col-span-2 xl:col-span-3">বিবরণ<textarea name="description" rows={3} maxLength={10000} defaultValue={p.description ?? ""} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
          {p.seo_review_status !== undefined && <div className="md:col-span-2 xl:col-span-3 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4"><p className="font-black text-emerald-900">SEO metadata editor</p><div className="mt-3 grid gap-3 md:grid-cols-2"><label className="text-sm font-bold">SEO title<input name="seo_title" maxLength={70} defaultValue={p.seo_title ?? ""} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label><label className="text-sm font-bold">Meta description<textarea name="meta_description" rows={2} maxLength={180} defaultValue={p.meta_description ?? ""} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label><label className="text-sm font-bold">Short description<textarea name="short_description" rows={2} maxLength={320} defaultValue={p.short_description ?? ""} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label><label className="text-sm font-bold">Image alt text<input name="image_alt_text" maxLength={180} defaultValue={p.image_alt_text ?? ""} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label><label className="text-sm font-bold md:col-span-2">Image URLs (প্রতি লাইনে একটি)<textarea name="image_urls" rows={2} defaultValue={(p.image_urls ?? (p.image_url ? [p.image_url] : [])).join("\\n")} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label><label className="text-sm font-bold md:col-span-2">Search keywords<textarea name="search_keywords" rows={2} defaultValue={(p.search_keywords ?? []).join("\\n")} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label><label className="text-sm font-bold">FAQ question<input name="faq_question" defaultValue={p.seo_faqs?.[0]?.question ?? ""} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label><label className="text-sm font-bold">FAQ answer<textarea name="faq_answer" rows={2} defaultValue={p.seo_faqs?.[0]?.answer ?? ""} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label></div></div>}
        </div>
        <p className="mt-3 text-xs text-[#7b887d]">Last updated: {new Date(p.updated_at).toLocaleDateString("en-GB")}</p>
      </form>)}
      {!products?.length && !error && <div className="rounded-2xl border border-dashed bg-white p-10 text-center"><p className="font-bold">Database-এ এখনো কোনো পণ্য নেই।</p><p className="mt-2 text-sm text-[#748074]">Sample preview products বাস্তব database পণ্য নয়।</p></div>}</div>
    </div>
  </main>;
}
