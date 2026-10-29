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
  const seoTitle = String(formData.get("seo_title") ?? "").trim();
  const seoDescription = String(formData.get("seo_description") ?? "").trim();
  const seoKeywords = String(formData.get("seo_keywords") ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  const seoContent = String(formData.get("seo_content") ?? "").trim();
  const seoFaqsText = String(formData.get("seo_faqs") ?? "").trim();
  const seoFaqs = seoFaqsText ? seoFaqsText.split(/\\r?\\n/).map((line) => { const separator = line.indexOf("|"); return separator < 0 ? null : { question: line.slice(0, separator).trim(), answer: line.slice(separator + 1).trim() }; }).filter((faq): faq is { question: string; answer: string } => Boolean(faq && faq.question && faq.answer)) : [];
  const price = Number(formData.get("price"));
  const stock = Number(formData.get("stock"));
  const commission = Number(formData.get("commission"));
  const status = String(formData.get("status") ?? "");
  const categorySlug = String(formData.get("category_slug") ?? "").trim();
  const subcategorySlug = String(formData.get("subcategory_slug") ?? "").trim();
  const categoryEntry = categorySlug ? getCategory(categorySlug) : undefined;
  const subcategoryEntry = categorySlug && subcategorySlug ? getSubcategory(categorySlug, subcategorySlug) : undefined;
  if (!productId || !name || !Number.isFinite(price) || price < 0 || !Number.isFinite(stock) || stock < 0 || !Number.isFinite(commission) || commission < 0 || commission > 100 || !["draft","active","paused","sold_out"].includes(status) || (!categorySlug ? Boolean(subcategorySlug) : !categoryEntry || Boolean(subcategorySlug && !subcategoryEntry)) || seoTitle.length > 70 || seoDescription.length > 160 || seoKeywords.length > 10 || seoKeywords.some((keyword) => keyword.length > 60) || seoContent.length > 10000 || seoFaqs.length > 8 || seoFaqs.some((faq) => faq.question.length > 160 || faq.answer.length > 500)) {
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
  const { error: seoError } = productError || categoryError ? { error: productError || categoryError } : await supabase.from("products").update({
    seo_title: seoTitle || null,
    seo_description: seoDescription || null,
    seo_keywords: seoKeywords,
    seo_content: seoContent || null,
    seo_faqs: seoFaqs,
  }).eq("id", productId);
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/marketplace");
  revalidatePath("/sitemap.xml");
  revalidatePath(`/marketplace/${productId}`);
  redirect(productError || categoryError || seoError ? "/admin/products?notice=error" : "/admin/products?notice=saved");
}

export default async function AdminProductsPage({ searchParams }: { searchParams?: { notice?: string } }) {
  const supabase = await requireAdmin();
  const { data: products, error } = await supabase.from("products")
    .select("id,slug,name,description,price,stock,reseller_commission_percent,status,farmer_id,category,category_slug,subcategory_slug,image_url,image_urls,seo_title,seo_description,seo_keywords,seo_content,seo_faqs,updated_at")
    .order("updated_at", { ascending: false }).limit(100);

  return <main className="min-h-screen bg-[#f4f7f1] px-4 py-8 text-[#17351f] sm:px-6">
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#123b27] p-5 text-white"><div><Link href="/admin" className="text-xl font-black">AGRIVA Admin</Link><p className="mt-1 text-xs text-emerald-100">Catalogue management</p></div><Link href="/admin" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">← Admin overview</Link></header>
      <h1 className="mt-7 text-3xl font-black">পণ্য ব্যবস্থাপনা</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[#637266]">নাম, বিবরণ, মূল্য, স্টক, রিসেলার কমিশন ও পণ্যের অবস্থা পরিবর্তন করুন। পরিবর্তনগুলো audit log-এ সংরক্ষিত হবে।</p>
      {searchParams?.notice && <p role="status" className={`mt-5 rounded-xl border p-3 text-sm font-semibold ${searchParams.notice === "saved" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-800"}`}>{searchParams.notice === "saved" ? "পণ্যের তথ্য আপডেট হয়েছে।" : searchParams.notice === "invalid" ? "সঠিক তথ্য দিন; কমিশন ০ থেকে ১০০-এর মধ্যে হতে হবে।" : "আপডেট করা যায়নি। Migration 024 ও database schema যাচাই করুন।"}</p>}
      {error && <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">পণ্য তালিকা পড়া যায়নি। Database migration এবং product schema যাচাই করুন।</p>}
      <AdminCreateProductForm />
      <div className="mt-6 grid gap-4">{(products ?? []).map(p => <form key={p.id} action={saveProduct} className="rounded-2xl border border-[#dfe8dc] bg-white p-5 shadow-sm">
        <input type="hidden" name="productId" value={p.id}/>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><p className="font-black">{p.name}</p><p className="mt-1 text-xs text-[#7b887d]">ID {p.id.slice(0,8)} · Seller {p.farmer_id.slice(0,8)}</p><Link href={`/marketplace/${p.slug}`} target="_blank" className="mt-2 inline-block text-xs font-bold text-emerald-800 underline">পাবলিক পণ্য পেজ দেখুন ↗</Link></div><span className="rounded-full bg-[#edf4e9] px-3 py-1 text-xs font-extrabold">{p.status}</span></div>
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
        <section className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 sm:p-5"><h3 className="text-base font-black">SEO Landing Page সেটিংস</h3><p className="mt-1 text-xs leading-5 text-[#637266]">Google title/description, search keywords, বিস্তারিত landing-page content এবং FAQ সম্পাদনা করুন। ফাঁকা title/description হলে পণ্যের নাম ও বিবরণ থেকে fallback ব্যবহার হবে।</p><div className="mt-4 grid gap-4 md:grid-cols-2"><label className="text-sm font-bold">SEO Title <span className="font-normal text-slate-500">(সর্বোচ্চ ৭০ অক্ষর)</span><input name="seo_title" maxLength={70} defaultValue={p.seo_title ?? ""} placeholder={`${p.name} | AGRIVA`} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal"/></label><label className="text-sm font-bold">Meta Description <span className="font-normal text-slate-500">(সর্বোচ্চ ১৬০ অক্ষর)</span><textarea name="seo_description" rows={2} maxLength={160} defaultValue={p.seo_description ?? ""} placeholder="পণ্যের প্রধান উপকারিতা, ধরন ও প্রাসঙ্গিক তথ্য লিখুন..." className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal"/></label><label className="text-sm font-bold md:col-span-2">Target Keywords <span className="font-normal text-slate-500">(কমা দিয়ে আলাদা, সর্বোচ্চ ১০টি)</span><input name="seo_keywords" defaultValue={Array.isArray(p.seo_keywords) ? p.seo_keywords.join(", ") : ""} placeholder="ধানের বীজ, উচ্চ ফলনশীল ধান, rice seeds Bangladesh" className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal"/></label><label className="text-sm font-bold md:col-span-2">SEO Landing Page Content <span className="font-normal text-slate-500">(সর্বোচ্চ ১০,০০০ অক্ষর)</span><textarea name="seo_content" rows={5} maxLength={10000} defaultValue={p.seo_content ?? ""} placeholder="ব্যবহার, বৈশিষ্ট্য, উপযোগিতা, সংরক্ষণ/যত্ন, প্যাক সাইজ বা যাচাইকৃত পণ্যের তথ্য লিখুন..." className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal"/></label><label className="text-sm font-bold md:col-span-2">FAQ <span className="font-normal text-slate-500">(প্রতি লাইনে প্রশ্ন | উত্তর; সর্বোচ্চ ৮টি)</span><textarea name="seo_faqs" rows={4} defaultValue={Array.isArray(p.seo_faqs) ? p.seo_faqs.map((faq: {question?: string; answer?: string}) => `${faq.question ?? ""} | ${faq.answer ?? ""}`).join("\\n") : ""} placeholder={"এই পণ্যটি কী কাজে লাগে? | যাচাইকৃত ব্যবহার লিখুন।\\nডেলিভারি কীভাবে হবে? | প্রযোজ্য ডেলিভারি তথ্য লিখুন।"} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal"/></label></div><div className="mt-4 grid gap-2 text-xs sm:grid-cols-3"><p className={`rounded-lg p-2 ${p.seo_title ? "bg-white text-emerald-800" : "bg-amber-50 text-amber-900"}`}>{p.seo_title ? "✓" : "○"} SEO title</p><p className={`rounded-lg p-2 ${p.seo_description ? "bg-white text-emerald-800" : "bg-amber-50 text-amber-900"}`}>{p.seo_description ? "✓" : "○"} Meta description</p><p className={`rounded-lg p-2 ${(p.image_url || (Array.isArray(p.image_urls) && p.image_urls.length)) ? "bg-white text-emerald-800" : "bg-amber-50 text-amber-900"}`}>{(p.image_url || (Array.isArray(p.image_urls) && p.image_urls.length)) ? "✓" : "○"} Product image</p></div><p className="mt-3 break-all text-xs text-slate-600">Canonical URL: https://agriva.com.bd/marketplace/{p.slug}</p></section>\n        <p className="mt-3 text-xs text-[#7b887d]">Last updated: {new Date(p.updated_at).toLocaleDateString("en-GB")}</p>
      </form>)}
      {!products?.length && !error && <div className="rounded-2xl border border-dashed bg-white p-10 text-center"><p className="font-bold">Database-এ এখনো কোনো পণ্য নেই।</p><p className="mt-2 text-sm text-[#748074]">Sample preview products বাস্তব database পণ্য নয়।</p></div>}</div>
    </div>
  </main>;
}
