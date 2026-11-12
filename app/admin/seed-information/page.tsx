import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminPage } from "@/lib/admin/authz";
import { MAX_PRODUCT_DESCRIPTION_HTML_LENGTH, sanitizeProductDescription } from "@/lib/marketplace/product-description";
import AdminSeedRichTextEditor from "@/components/admin/AdminSeedRichTextEditor";

async function saveCommonSection(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "").trim();
  const sectionKey = String(formData.get("section_key") ?? "").trim().toLowerCase();
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const content = sanitizeProductDescription(String(formData.get("content_html") ?? ""));
  const enabled = String(formData.get("is_enabled") ?? "false") === "true";
  const sortOrder = Number(formData.get("sort_order") ?? 0);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(sectionKey) || !title || title.length > 160 || summary.length > 500 || content.length > MAX_PRODUCT_DESCRIPTION_HTML_LENGTH || !Number.isInteger(sortOrder)) redirect("/admin/seed-information?notice=invalid");
  const { supabase, user } = await requireAdminPage("catalog.edit");
  const payload = { section_key: sectionKey, category_slug: "seeds", title, summary, content_html: content, is_enabled: enabled, sort_order: sortOrder, updated_by: user.id };
  const result = id
    ? await supabase.from("seed_category_content_sections").update(payload).eq("id", id)
    : await supabase.from("seed_category_content_sections").upsert(payload, { onConflict: "section_key" });
  revalidatePath("/admin/seed-information");
  revalidatePath("/marketplace");
  redirect(result.error ? "/admin/seed-information?notice=error" : "/admin/seed-information?notice=saved");
}

async function saveCropGuide(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "").trim();
  const cropSlug = String(formData.get("crop_slug") ?? "").trim().toLowerCase();
  const cropName = String(formData.get("crop_name") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const content = sanitizeProductDescription(String(formData.get("content_html") ?? ""));
  const active = String(formData.get("is_active") ?? "false") === "true";
  const sortOrder = Number(formData.get("sort_order") ?? 0);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cropSlug) || !cropName || cropName.length > 120 || summary.length > 500 || content.length > MAX_PRODUCT_DESCRIPTION_HTML_LENGTH || !Number.isInteger(sortOrder)) redirect("/admin/seed-information?notice=invalid");
  const { supabase, user } = await requireAdminPage("catalog.edit");
  const payload = { crop_slug: cropSlug, crop_name: cropName, summary, content_html: content, is_active: active, sort_order: sortOrder, updated_by: user.id };
  const result = id
    ? await supabase.from("seed_crop_guides").update(payload).eq("id", id)
    : await supabase.from("seed_crop_guides").upsert(payload, { onConflict: "crop_slug" });
  revalidatePath("/admin/seed-information");
  revalidatePath("/marketplace");
  redirect(result.error ? "/admin/seed-information?notice=error" : "/admin/seed-information?notice=saved");
}

async function deleteCommonSection(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/seed-information?notice=invalid");
  const { supabase } = await requireAdminPage("catalog.edit");
  const { error } = await supabase.from("seed_category_content_sections").delete().eq("id", id);
  revalidatePath("/marketplace");
  redirect(error ? "/admin/seed-information?notice=error" : "/admin/seed-information?notice=saved");
}

async function deleteCropGuide(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/seed-information?notice=invalid");
  const { supabase } = await requireAdminPage("catalog.edit");
  const { error } = await supabase.from("seed_crop_guides").delete().eq("id", id);
  revalidatePath("/marketplace");
  redirect(error ? "/admin/seed-information?notice=error" : "/admin/seed-information?notice=saved");
}

async function saveProductSeedDetails(formData: FormData) {
  "use server";
  const productId = String(formData.get("product_id") ?? "").trim();
  const cropGuideId = String(formData.get("crop_guide_id") ?? "").trim() || null;
  const varietyName = String(formData.get("variety_name") ?? "").trim();
  const germinationRaw = String(formData.get("germination_rate") ?? "").trim();
  const purityRaw = String(formData.get("purity_rate") ?? "").trim();
  const treatment = String(formData.get("seed_treatment") ?? "").trim();
  const warnings = String(formData.get("special_warnings") ?? "").trim();
  const germination = germinationRaw ? Number(germinationRaw) : null;
  const purity = purityRaw ? Number(purityRaw) : null;
  if (!productId || varietyName.length > 160 || treatment.length > 4000 || warnings.length > 8000 ||
      (germination !== null && (!Number.isFinite(germination) || germination < 0 || germination > 100)) ||
      (purity !== null && (!Number.isFinite(purity) || purity < 0 || purity > 100))) redirect("/admin/seed-information?notice=invalid");
  const { supabase, user } = await requireAdminPage("catalog.edit");
  const { data: product } = await supabase.from("products").select("id,category_slug").eq("id", productId).maybeSingle();
  if (!product || product.category_slug !== "seeds") redirect("/admin/seed-information?notice=wrong-category");
  const payload = { product_id: productId, crop_guide_id: cropGuideId, variety_name: varietyName, germination_rate: germination, purity_rate: purity, seed_treatment: treatment, special_warnings: warnings, updated_by: user.id };
  const result = await supabase.from("product_seed_details").upsert(payload, { onConflict: "product_id" });
  revalidatePath("/admin/seed-information");
  revalidatePath("/marketplace");
  redirect(result.error ? "/admin/seed-information?notice=error" : "/admin/seed-information?notice=saved");
}

export default async function AdminSeedInformationPage({ searchParams }: { searchParams?: { notice?: string } }) {
  const { supabase } = await requireAdminPage("catalog.read");
  const [{ data: sections, error: sectionsError }, { data: guides, error: guidesError }, { data: products, error: productsError }, { data: details }] = await Promise.all([
    supabase.from("seed_category_content_sections").select("*").order("sort_order").order("title"),
    supabase.from("seed_crop_guides").select("*").order("sort_order").order("crop_name"),
    supabase.from("products").select("id,name,slug,category_slug,status").eq("category_slug", "seeds").order("name").limit(300),
    supabase.from("product_seed_details").select("product_id,crop_guide_id,variety_name,germination_rate,purity_rate,seed_treatment,special_warnings"),
  ]);
  const detailByProduct = new Map((details ?? []).map((item) => [item.product_id, item]));
  const notice = searchParams?.notice;

  return <main className="mx-auto min-h-[calc(100vh-68px)] max-w-[1600px] px-4 py-6 text-[#17351f] sm:px-6 xl:px-8">
    <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#a47b20]">Marketplace knowledge base</p>
    <h1 className="mt-2 text-2xl font-black sm:text-3xl">Seeds Information Manager</h1>
    <p className="mt-2 max-w-4xl text-sm leading-6 text-[#637266]">সাধারণ বীজ তথ্য একবার সংরক্ষণ করুন, ফসলভিত্তিক গাইড তৈরি করুন এবং প্রতিটি বীজ পণ্যের নিজস্ব বৈশিষ্ট্য যুক্ত করুন। এই ম্যানেজার শুধু category_slug = seeds পণ্য নিয়ে কাজ করে।</p>
    {notice && <p role="status" className={`mt-5 rounded-xl border p-3 text-sm font-semibold ${notice === "saved" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-800"}`}>{notice === "saved" ? "তথ্য সংরক্ষণ হয়েছে।" : notice === "wrong-category" ? "শুধু Seeds ক্যাটাগরির পণ্যে এই তথ্য যোগ করা যাবে।" : notice === "invalid" ? "তথ্য যাচাই করুন। শতকরা হার ০–১০০ এবং slug ইংরেজি ছোট হাতের অক্ষরে দিন।" : "সংরক্ষণ করা যায়নি। Migration প্রয়োগ হয়েছে কি না এবং database schema যাচাই করুন।"}</p>}
    {(sectionsError || guidesError || productsError) && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Seed information tables পাওয়া যায়নি। Migration প্রয়োগ করার পর পেজটি refresh করুন।</p>}

    <section className="mt-7 rounded-2xl border border-[#dfe8dc] bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-xl font-black">১. Common Seeds Information</h2>
      <p className="mt-1 text-sm text-[#68776b]">যে তথ্য সব Seeds product-এর জন্য সত্যিই প্রযোজ্য, শুধু সেটিই এখানে রাখুন।</p>
      <form action={saveCommonSection} className="mt-5 grid gap-3 md:grid-cols-2">
        <input type="hidden" name="id" value=""/>
        <label className="text-sm font-bold">Section key<input name="section_key" required maxLength={80} placeholder="seed-storage" className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
        <label className="text-sm font-bold">শিরোনাম<input name="title" required maxLength={160} placeholder="বীজ সংরক্ষণের নিয়ম" className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
        <label className="text-sm font-bold md:col-span-2">Product page-এর সংক্ষিপ্ত সারাংশ<input name="summary" maxLength={500} placeholder="সংক্ষিপ্ত ১–২ বাক্যের সারাংশ" className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
        <label className="text-sm font-bold">ক্রম<input name="sort_order" type="number" defaultValue="10" className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
        <label className="text-sm font-bold">অবস্থা<select name="is_enabled" defaultValue="true" className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal"><option value="true">সক্রিয়</option><option value="false">বন্ধ</option></select></label>
        <AdminSeedRichTextEditor name="content_html" value="" label="বিস্তারিত নির্দেশনা" placeholder="বীজ সংরক্ষণের নির্দেশনা লিখুন..." />
        <div className="md:col-span-2"><button className="rounded-xl bg-[#17452c] px-5 py-3 text-sm font-extrabold text-white">Common information save করুন</button></div>
      </form>
      <div className="mt-6 space-y-3">{(sections ?? []).map((section) => <div key={section.id}><form action={saveCommonSection} className="rounded-xl border border-[#e5ece2] p-4">
        <input type="hidden" name="id" value={section.id}/>
        <div className="grid gap-3 md:grid-cols-2"><label className="text-sm font-bold">Key<input name="section_key" defaultValue={section.section_key} required className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"/></label><label className="text-sm font-bold">শিরোনাম<input name="title" defaultValue={section.title} required className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"/></label><label className="text-sm font-bold md:col-span-2">Product page-এর সংক্ষিপ্ত সারাংশ<input name="summary" defaultValue={section.summary ?? ""} maxLength={500} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"/></label><label className="text-sm font-bold">ক্রম<input name="sort_order" type="number" defaultValue={section.sort_order} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"/></label><label className="text-sm font-bold">অবস্থা<select name="is_enabled" defaultValue={String(section.is_enabled)} className="mt-1 w-full rounded-lg border bg-white px-3 py-2 font-normal"><option value="true">সক্রিয়</option><option value="false">বন্ধ</option></select></label><AdminSeedRichTextEditor name="content_html" value={section.content_html} label="বিস্তারিত নির্দেশনা" /></div><div className="mt-3 flex justify-end"><button className="rounded-lg border border-[#17452c] px-4 py-2 text-sm font-bold">Update</button></div>
      </form><form action={deleteCommonSection} className="mt-2 flex justify-end"><input type="hidden" name="id" value={section.id}/><button className="rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-700">Delete section</button></form></div>)}</div>
    </section>

    <section className="mt-6 rounded-2xl border border-[#dfe8dc] bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-xl font-black">২. Crop-wise Cultivation Guides</h2>
      <p className="mt-1 text-sm text-[#68776b]">প্রতিটি ফসলের গাইড একবার তৈরি হবে; পণ্যের সঙ্গে গাইডটি assign করবেন।</p>
      <form action={saveCropGuide} className="mt-5 grid gap-3 md:grid-cols-2">
        <input type="hidden" name="id" value=""/>
        <label className="text-sm font-bold">Crop slug<input name="crop_slug" required placeholder="ridge-gourd" className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
        <label className="text-sm font-bold">ফসলের নাম<input name="crop_name" required placeholder="ঝিঙা" className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
        <label className="text-sm font-bold md:col-span-2">সংক্ষিপ্ত পরিচিতি<input name="summary" maxLength={500} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
        <AdminSeedRichTextEditor name="content_html" value="" label="পূর্ণ চাষাবাদ নির্দেশনা" />
        <label className="text-sm font-bold">ক্রম<input name="sort_order" type="number" defaultValue="10" className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
        <label className="text-sm font-bold">অবস্থা<select name="is_active" defaultValue="true" className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal"><option value="true">সক্রিয়</option><option value="false">বন্ধ</option></select></label>
        <div className="md:col-span-2"><button className="rounded-xl bg-[#17452c] px-5 py-3 text-sm font-extrabold text-white">Crop guide save করুন</button></div>
      </form>
      <div className="mt-6 space-y-3">{(guides ?? []).map((guide) => <div key={guide.id}><form action={saveCropGuide} className="rounded-xl border border-[#e5ece2] p-4">
        <input type="hidden" name="id" value={guide.id}/><div className="grid gap-3 md:grid-cols-2"><label className="text-sm font-bold">Slug<input name="crop_slug" defaultValue={guide.crop_slug} required className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"/></label><label className="text-sm font-bold">ফসলের নাম<input name="crop_name" defaultValue={guide.crop_name} required className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"/></label><label className="text-sm font-bold md:col-span-2">সংক্ষিপ্ত পরিচিতি<input name="summary" defaultValue={guide.summary} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"/></label><AdminSeedRichTextEditor name="content_html" value={guide.content_html} label="পূর্ণ চাষাবাদ নির্দেশনা" /><label className="text-sm font-bold">ক্রম<input name="sort_order" type="number" defaultValue={guide.sort_order} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"/></label><label className="text-sm font-bold">অবস্থা<select name="is_active" defaultValue={String(guide.is_active)} className="mt-1 w-full rounded-lg border bg-white px-3 py-2 font-normal"><option value="true">সক্রিয়</option><option value="false">বন্ধ</option></select></label></div><div className="mt-3 flex justify-end"><button className="rounded-lg border border-[#17452c] px-4 py-2 text-sm font-bold">Update guide</button></div>
      </form><form action={deleteCropGuide} className="mt-2 flex justify-end"><input type="hidden" name="id" value={guide.id}/><button className="rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-700">Delete guide</button></form></div>)}</div>
    </section>

    <section className="mt-6 rounded-2xl border border-[#dfe8dc] bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-xl font-black">৩. Product-specific Seed Details</h2>
      <p className="mt-1 text-sm text-[#68776b]">নিচের তালিকায় শুধু category_slug = seeds পণ্য থাকবে। এখানে পণ্যের বিবরণ, ছবি, মূল্য বা পুরোনো description পরিবর্তন হবে না।</p>
      {!(products ?? []).length && <p className="mt-4 text-sm text-[#68776b]">Seeds category-তে কোনো product পাওয়া যায়নি।</p>}
      <div className="mt-4 space-y-4">{(products ?? []).map((product) => { const detail = detailByProduct.get(product.id); return <form key={product.id} action={saveProductSeedDetails} className="rounded-xl border border-[#e5ece2] p-4">
        <input type="hidden" name="product_id" value={product.id}/><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><p className="font-black">{product.name}</p><p className="text-xs text-[#718071]">/{product.slug} · {product.status}</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">Seeds only</span></div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"><label className="text-sm font-bold">Crop guide<select name="crop_guide_id" defaultValue={detail?.crop_guide_id ?? ""} className="mt-1 w-full rounded-lg border bg-white px-3 py-2 font-normal"><option value="">গাইড নির্বাচন করুন</option>{(guides ?? []).map((guide) => <option key={guide.id} value={guide.id}>{guide.crop_name}</option>)}</select></label><label className="text-sm font-bold">জাত / Variety<input name="variety_name" defaultValue={detail?.variety_name ?? ""} maxLength={160} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"/></label><label className="text-sm font-bold">Germination (%)<input name="germination_rate" type="number" min="0" max="100" step="0.01" defaultValue={detail?.germination_rate ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"/></label><label className="text-sm font-bold">Purity (%)<input name="purity_rate" type="number" min="0" max="100" step="0.01" defaultValue={detail?.purity_rate ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"/></label><label className="text-sm font-bold md:col-span-2">Seed treatment<input name="seed_treatment" defaultValue={detail?.seed_treatment ?? ""} maxLength={4000} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"/></label><label className="text-sm font-bold md:col-span-2">Special warnings<textarea name="special_warnings" rows={3} defaultValue={detail?.special_warnings ?? ""} maxLength={8000} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"/></label></div><div className="mt-3 flex justify-end"><button className="rounded-lg bg-[#17452c] px-4 py-2 text-sm font-bold text-white">পণ্যের Seed Details save করুন</button></div>
      </form>;})}</div>
    </section>
  </main>;
}
