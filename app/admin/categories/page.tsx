import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminPage, type AdminCapability } from "@/lib/admin/authz";

async function requireAdmin(capability: AdminCapability = "catalog.read") {
  const { supabase, user } = await requireAdminPage(capability);
  return supabase;
}

async function saveCategory(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const description = String(formData.get("description") ?? "").trim();
  const isActive = String(formData.get("is_active") ?? "false") === "true";
  const sortOrder = Number(formData.get("sort_order") ?? 100);
  if (!name || !slug || !Number.isFinite(sortOrder) || !Number.isInteger(sortOrder) || Math.abs(sortOrder)>100000) redirect("/admin/categories?notice=invalid");
  const supabase = await requireAdmin("catalog.edit");
  const {error} = await supabase.rpc("admin_save_product_category", {
    p_category_id: id || null,p_name:name,p_slug:slug,p_description:description,p_is_active:isActive,p_sort_order:sortOrder,
  });
  revalidatePath("/admin/categories");
  revalidatePath("/marketplace");
  redirect(error?"/admin/categories?notice=error":"/admin/categories?notice=saved");
}

export default async function AdminCategoriesPage({searchParams}:{searchParams?:{notice?:string}}) {
  const supabase = await requireAdmin();
  const {data:categories,error} = await supabase.from("product_categories").select("id,name,slug,description,is_active,sort_order,updated_at").order("sort_order").order("name").limit(200);
  return <main className="mx-auto min-h-[calc(100vh-68px)] w-full max-w-[1600px] px-4 py-5 text-[#17351f] sm:px-6 sm:py-7 xl:px-8"><div className="min-w-0">
    <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#a47b20]">Marketplace catalogue</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">ক্যাটাগরি ব্যবস্থাপনা</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[#637266]">ক্যাটাগরি তৈরি/সম্পাদনা, URL slug, প্রদর্শনের ক্রম ও active status নিয়ন্ত্রণ করুন।</p>
    {searchParams?.notice&&<p role="status" className={`mt-5 rounded-xl border p-3 text-sm font-semibold ${searchParams.notice==="saved"?"border-emerald-200 bg-emerald-50 text-emerald-900":"border-red-200 bg-red-50 text-red-800"}`}>{searchParams.notice==="saved"?"ক্যাটাগরি সংরক্ষণ হয়েছে।":searchParams.notice==="invalid"?"নাম, slug ও sort order যাচাই করুন।":"ক্যাটাগরি সংরক্ষণ হয়নি। Migration 025 এবং duplicate slug/name যাচাই করুন।"}</p>}
    {error&&<p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Category table পড়া যায়নি। Migration 025 প্রয়োগ হয়েছে কি না যাচাই করুন।</p>}
    <form action={saveCategory} className="mt-5 rounded-2xl border border-[#dfe8dc] bg-white p-4 shadow-sm sm:p-5"><h2 className="text-lg font-black">নতুন ক্যাটাগরি যোগ করুন</h2><input type="hidden" name="id" value=""/><div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <label className="text-sm font-bold">নাম<input name="name" required maxLength={100} placeholder="যেমন: Seeds" className="mt-1.5 min-h-11 w-full min-w-0 rounded-xl border border-[#d9e3d5] px-3 py-2.5 font-normal"/></label>
      <label className="text-sm font-bold">Slug<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={120} placeholder="seeds" className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
      <label className="text-sm font-bold">Sort order<input name="sort_order" type="number" defaultValue="100" step="1" className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
      <label className="text-sm font-bold md:col-span-2">বিবরণ<textarea name="description" rows={2} maxLength={1000} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
      <label className="text-sm font-bold">অবস্থা<select name="is_active" defaultValue="true" className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal"><option value="true">Active</option><option value="false">Inactive</option></select></label>
    </div><div className="mt-4 flex justify-end"><button className="rounded-xl bg-[#17452c] px-5 py-3 text-sm font-extrabold text-white">Create category</button></div></form>
    <div className="mt-5 grid gap-4">{(categories??[]).map(category=><form key={category.id} action={saveCategory} className="min-w-0 rounded-2xl border border-[#dfe8dc] bg-white p-4 shadow-sm sm:p-5"><input type="hidden" name="id" value={category.id}/><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><p className="font-black">{category.name}</p><p className="mt-1 text-xs text-[#7b887d]">/{category.slug} · Updated {new Date(category.updated_at).toLocaleDateString("en-GB")}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${category.is_active?"bg-[#edf4e9] text-[#28623b]":"bg-gray-100 text-gray-600"}`}>{category.is_active?"Active":"Inactive"}</span></div><div className="grid min-w-0 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
      <label className="text-sm font-bold">নাম<input name="name" required maxLength={100} defaultValue={category.name} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
      <label className="text-sm font-bold">Slug<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={120} defaultValue={category.slug} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
      <label className="text-sm font-bold">Sort order<input name="sort_order" type="number" step="1" defaultValue={category.sort_order} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
      <label className="text-sm font-bold md:col-span-2">বিবরণ<textarea name="description" rows={2} maxLength={1000} defaultValue={category.description} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
      <label className="text-sm font-bold">অবস্থা<select name="is_active" defaultValue={String(category.is_active)} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal"><option value="true">Active</option><option value="false">Inactive</option></select></label>
    </div><div className="mt-4 flex justify-end"><button className="rounded-xl border border-[#17452c] px-5 py-2.5 text-sm font-extrabold text-[#17452c]">Save category</button></div></form>)}
    {!categories?.length&&!error&&<p className="rounded-2xl border border-dashed bg-white p-8 text-sm text-[#748074]">এখনো কোনো category নেই। প্রথমটি উপরের form থেকে তৈরি করুন।</p>}</div>
  </div></main>;
}
