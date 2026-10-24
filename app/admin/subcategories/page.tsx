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

async function saveSubcategory(formData: FormData) {
  "use server";
  const categorySlug = String(formData.get("category_slug") ?? "").trim();
  const oldSlug = String(formData.get("old_slug") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const description = String(formData.get("description") ?? "").trim();
  const isActive = String(formData.get("is_active") ?? "false") === "true";
  const sortOrder = Number(formData.get("sort_order") ?? 100);
  if (!categorySlug || !name || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || !Number.isInteger(sortOrder) || Math.abs(sortOrder) > 100000) {
    redirect("/admin/subcategories?notice=invalid");
  }
  const supabase = await requireAdmin();
  const { error } = await supabase.rpc("admin_save_product_subcategory", {
    p_category_slug: categorySlug,
    p_old_slug: oldSlug || null,
    p_name: name,
    p_slug: slug,
    p_description: description,
    p_is_active: isActive,
    p_sort_order: sortOrder,
  });
  revalidatePath("/admin/subcategories");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/marketplace");
  revalidatePath("/sitemap.xml");
  redirect(error ? "/admin/subcategories?notice=error" : "/admin/subcategories?notice=saved");
}

export default async function AdminSubcategoriesPage({ searchParams }: { searchParams?: { notice?: string } }) {
  const supabase = await requireAdmin();
  const [{ data: categories }, { data: subcategories, error }] = await Promise.all([
    supabase.from("product_categories").select("name,slug,is_active").order("sort_order").order("name"),
    supabase.from("product_subcategories").select("category_slug,slug,name,description,is_active,sort_order,updated_at").order("category_slug").order("sort_order").order("name"),
  ]);
  const categoryRows = categories ?? [];
  const categoryNames = new Map(categoryRows.map(category => [category.slug, category.name]));
  return <main className="min-h-screen bg-[#f4f7f1] px-4 py-8 text-[#17351f] sm:px-6"><div className="mx-auto max-w-7xl">
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#123b27] p-5 text-white"><div><Link href="/admin" className="text-xl font-black">AGRIVA Admin</Link><p className="mt-1 text-xs text-emerald-100">Catalogue taxonomy</p></div><div className="flex gap-2"><Link href="/admin/categories" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">Categories</Link><Link href="/admin" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">← Admin overview</Link></div></header>
    <p className="mt-7 text-xs font-extrabold uppercase tracking-[.18em] text-[#a47b20]">Marketplace catalogue</p><h1 className="mt-2 text-3xl font-black">সাব-ক্যাটাগরি ব্যবস্থাপনা</h1><p className="mt-2 text-sm leading-6 text-[#637266]">প্রতিটি সাব-ক্যাটাগরি একটি parent category-র অধীনে থাকবে। পণ্য যুক্ত হয়ে গেলে slug স্থির থাকবে; URL ভাঙা এড়াতে নতুন slug-এর জন্য নতুন সাব-ক্যাটাগরি তৈরি করে প্রয়োজন হলে পণ্য পুনরায় ম্যাপ করুন।</p>
    {searchParams?.notice && <p role="status" className={`mt-5 rounded-xl border p-3 text-sm font-semibold ${searchParams.notice === "saved" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-800"}`}>{searchParams.notice === "saved" ? "সাব-ক্যাটাগরি সংরক্ষণ হয়েছে।" : searchParams.notice === "invalid" ? "Category, name, slug ও sort order যাচাই করুন।" : "সাব-ক্যাটাগরি সংরক্ষণ হয়নি। Migration এবং duplicate slug যাচাই করুন।"}</p>}
    {error && <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">সাব-ক্যাটাগরি পড়া যায়নি। নতুন migration প্রয়োগ হয়েছে কি না যাচাই করুন।</p>}
    <form action={saveSubcategory} className="mt-6 rounded-2xl border border-[#dfe8dc] bg-white p-5 shadow-sm"><h2 className="text-lg font-black">নতুন সাব-ক্যাটাগরি</h2><input type="hidden" name="old_slug" value=""/><div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <label className="text-sm font-bold">Parent Category<select name="category_slug" required className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal"><option value="">Category নির্বাচন করুন</option>{categoryRows.map(category => <option key={category.slug} value={category.slug} disabled={!category.is_active}>{category.name} ({category.slug})</option>)}</select></label>
      <label className="text-sm font-bold">নাম<input name="name" required maxLength={100} placeholder="যেমন: ধানের বীজ" className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
      <label className="text-sm font-bold">SEO Slug<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={120} placeholder="rice-seeds" className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
      <label className="text-sm font-bold">Sort order<input name="sort_order" type="number" defaultValue="100" step="1" className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
      <label className="text-sm font-bold md:col-span-2">SEO description<textarea name="description" rows={2} maxLength={1000} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
      <label className="text-sm font-bold">অবস্থা<select name="is_active" defaultValue="true" className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal"><option value="true">Active</option><option value="false">Inactive</option></select></label>
    </div><div className="mt-4 flex justify-end"><button className="rounded-xl bg-[#17452c] px-5 py-3 text-sm font-extrabold text-white">Create subcategory</button></div></form>
    <div className="mt-6 grid gap-4">{(subcategories ?? []).map(item => <form key={item.category_slug + ":" + item.slug} action={saveSubcategory} className="rounded-2xl border border-[#dfe8dc] bg-white p-5 shadow-sm">
      <input type="hidden" name="old_slug" value={item.slug}/><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><p className="font-black">{item.name}</p><p className="mt-1 text-xs text-[#7b887d]">{categoryNames.get(item.category_slug) ?? item.category_slug} · /{item.category_slug}/{item.slug}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${item.is_active ? "bg-[#edf4e9] text-[#28623b]" : "bg-gray-100 text-gray-600"}`}>{item.is_active ? "Active" : "Inactive"}</span></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <input type="hidden" name="category_slug" value={item.category_slug}/><div className="text-sm font-bold">Parent Category<p className="mt-1.5 rounded-xl border bg-slate-50 px-3 py-2.5 font-normal">{categoryNames.get(item.category_slug) ?? item.category_slug} ({item.category_slug})</p><p className="mt-1 text-xs font-normal text-[#7b887d]">Parent বদলাতে হলে নতুন subcategory তৈরি করুন; এতে পুরোনো URL অক্ষত থাকবে।</p></div>
        <label className="text-sm font-bold">নাম<input name="name" required maxLength={100} defaultValue={item.name} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
        <label className="text-sm font-bold">SEO Slug<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={120} defaultValue={item.slug} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
        <label className="text-sm font-bold">Sort order<input name="sort_order" type="number" step="1" defaultValue={item.sort_order} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
        <label className="text-sm font-bold md:col-span-2">SEO description<textarea name="description" rows={2} maxLength={1000} defaultValue={item.description} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
        <label className="text-sm font-bold">অবস্থা<select name="is_active" defaultValue={String(item.is_active)} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal"><option value="true">Active</option><option value="false">Inactive</option></select></label>
      </div><div className="mt-4 flex justify-end"><button className="rounded-xl border border-[#17452c] px-5 py-2.5 text-sm font-extrabold text-[#17452c]">Save subcategory</button></div>
    </form>)}
    {!subcategories?.length && !error && <p className="rounded-2xl border border-dashed bg-white p-8 text-sm text-[#748074]">এখনো সাব-ক্যাটাগরি নেই। প্রথমটি উপরের form থেকে তৈরি করুন।</p>}</div>
  </div></main>;
}
