import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminPage, type AdminCapability } from "@/lib/admin/authz";
import { MARKETPLACE_CATEGORIES } from "@/lib/marketplace/taxonomy";

async function requireAdmin(capability: AdminCapability = "catalog.read") {
  const { supabase } = await requireAdminPage(capability);
  return supabase;
}

async function manageProduct(formData: FormData) {
  "use server";
  const productId = String(formData.get("productId") ?? "");
  const intent = String(formData.get("intent") ?? "");
  if (!productId || !["trash", "restore", "permanent"].includes(intent)) redirect("/admin/products?notice=invalid");
  const supabase = await requireAdmin("catalog.delete");
  const rpc = intent === "trash" ? "admin_trash_marketplace_product" : intent === "restore" ? "admin_restore_marketplace_product" : "admin_permanently_delete_marketplace_product";
  const { error } = await supabase.rpc(rpc, { p_product_id: productId });
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/marketplace");
  revalidatePath("/sitemap.xml");
  redirect(error ? "/admin/products?notice=action-error" : intent === "trash" ? "/admin/products?notice=trashed" : intent === "restore" ? "/admin/products?notice=restored" : "/admin/products?status=trash&notice=permanently-deleted");
}

const statusLabels: Record<string, string> = { active: "Published", draft: "Draft", paused: "Paused", sold_out: "Sold out" };

export default async function AdminProductsPage({ searchParams }: { searchParams?: { notice?: string; status?: string; q?: string; category?: string; page?: string; sort?: string } }) {
  const supabase = await requireAdmin();
  const requestedStatus = searchParams?.status ?? "all";
  const activeStatus = ["all", "draft", "active", "paused", "sold_out", "trash"].includes(requestedStatus) ? requestedStatus : "all";
  const searchTerm = String(searchParams?.q ?? "").trim().slice(0, 120);
  const category = String(searchParams?.category ?? "").trim().slice(0, 80);
  const page = Math.max(1, Math.min(10000, Number(searchParams?.page) || 1));
  const sort = searchParams?.sort === "name" ? "name" : "updated_at";
  const pageSize = 20;
  const countQuery = supabase.from("products").select("id", { count: "exact", head: true });
  let totalsQuery = countQuery.is("deleted_at", null);
  const [{ count: totalCount }, { count: activeCount }, { count: draftCount }, { count: trashCount }] = await Promise.all([
    totalsQuery,
    supabase.from("products").select("id", { count: "exact", head: true }).is("deleted_at", null).eq("status", "active"),
    supabase.from("products").select("id", { count: "exact", head: true }).is("deleted_at", null).eq("status", "draft"),
    supabase.from("products").select("id", { count: "exact", head: true }).not("deleted_at", "is", null),
  ]);
  let query = supabase.from("products")
    .select("id,name,slug,price,stock,status,category,category_slug,image_url,image_urls,updated_at,deleted_at,sku", { count: "exact" })
    .order(sort, { ascending: sort === "name" });
  if (activeStatus === "trash") query = query.not("deleted_at", "is", null);
  else {
    query = query.is("deleted_at", null);
    if (activeStatus !== "all") query = query.eq("status", activeStatus);
  }
  if (searchTerm) query = query.ilike("name", `%${searchTerm}%`);
  if (category) query = query.eq("category_slug", category);
  const { data: products, error, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize));
  const params = new URLSearchParams();
  if (searchTerm) params.set("q", searchTerm);
  if (activeStatus !== "all") params.set("status", activeStatus);
  if (category) params.set("category", category);
  if (sort !== "updated_at") params.set("sort", sort);
  const pageHref = (next: number) => { const nextParams = new URLSearchParams(params); nextParams.set("page", String(next)); return `/admin/products?${nextParams.toString()}`; };

  return <main className="mx-auto min-h-[calc(100vh-68px)] w-full max-w-[1600px] px-4 py-5 text-[#17351f] sm:px-6 sm:py-7 xl:px-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#a47b20]">Marketplace catalogue</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">Products</h1><p className="mt-2 text-sm leading-6 text-[#637266]">সব পণ্য এক জায়গা থেকে পরিচালনা করুন। Edit করতে পণ্যের নামে ক্লিক করুন।</p></div>
      <Link href="/admin/products/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#17452c] px-5 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-[#103820]"><span aria-hidden="true">＋</span> Add New Product</Link>
    </div>
    {searchParams?.notice && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">{({saved:"Product updated.",trashed:"Product moved to Trash.",restored:"Product restored.", "permanently-deleted":"Product permanently deleted.", "action-error":"Action failed. Please check permissions and try again."} as Record<string,string>)[searchParams.notice] ?? "Action completed."}</p>}
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[["All products",totalCount ?? 0],["Published",activeCount ?? 0],["Drafts",draftCount ?? 0],["Trash",trashCount ?? 0]].map(([label,value])=><div key={String(label)} className="rounded-2xl border border-[#dfe8dc] bg-white p-4"><p className="text-2xl font-black tabular-nums">{value}</p><p className="mt-1 text-xs font-semibold text-[#637266]">{label}</p></div>)}
    </div>
    <form method="get" className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#dfe8dc] bg-white p-4 sm:flex-row">
      <input name="q" defaultValue={searchTerm} placeholder="Search products by name..." className="min-h-11 min-w-0 flex-1 rounded-xl border border-[#d9e3d5] px-3 py-2"/>
      <select name="status" defaultValue={activeStatus} className="min-h-11 rounded-xl border border-[#d9e3d5] bg-white px-3 py-2"><option value="all">All statuses</option><option value="active">Published</option><option value="draft">Draft</option><option value="paused">Paused</option><option value="sold_out">Sold out</option><option value="trash">Trash</option></select>
      <select name="category" defaultValue={category} className="min-h-11 rounded-xl border border-[#d9e3d5] bg-white px-3 py-2"><option value="">All categories</option>{MARKETPLACE_CATEGORIES.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select>
      <select name="sort" defaultValue={sort} className="min-h-11 rounded-xl border border-[#d9e3d5] bg-white px-3 py-2"><option value="updated_at">Recently updated</option><option value="name">Name A–Z</option></select>
      <button className="min-h-11 rounded-xl bg-[#17452c] px-5 font-bold text-white">Filter</button><Link href="/admin/products" className="inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm font-bold">Reset</Link>
    </form>
    <div className="mt-5 overflow-hidden rounded-2xl border border-[#dfe8dc] bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e8eee5] px-4 py-3"><p className="text-sm font-bold">{count ?? 0} products</p><p className="text-xs text-[#718072]">Page {page} of {totalPages}</p></div>
      {error && <p className="p-5 text-sm text-red-700">Product list could not be loaded. Check database permissions.</p>}
      {(products ?? []).map((p:any) => {
        const image = (Array.isArray(p.image_urls) ? p.image_urls[0] : null) || p.image_url;
        return <div key={p.id} className="flex flex-col gap-3 border-b border-[#edf1eb] p-4 last:border-0 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {image ? <img src={image} alt="" className="h-14 w-14 shrink-0 rounded-xl border border-[#e5ebe2] object-cover"/> : <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#f0f5ed] text-xl">📦</div>}
            <div className="min-w-0"><Link href={`/admin/products/${p.id}`} className="block truncate font-extrabold text-[#17351f] hover:text-[#267044] hover:underline">{p.name}</Link><p className="mt-1 truncate text-xs text-[#788578]">{p.category || "Uncategorised"} {p.sku ? `· SKU ${p.sku}` : ""} · ৳{Number(p.price).toLocaleString("en-BD")}</p><div className="mt-2"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${p.deleted_at ? "bg-red-50 text-red-700" : p.status === "active" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{p.deleted_at ? "Trash" : statusLabels[p.status] ?? p.status}</span></div></div>
          </div>
          <div className="flex items-center gap-2 sm:justify-end">
            <Link href={`/admin/products/${p.id}`} className="inline-flex min-h-9 items-center rounded-lg border border-[#d9e3d5] px-3 text-xs font-bold hover:bg-[#f5f8f3]">Edit</Link>
            {p.deleted_at ? <><form action={manageProduct}><input type="hidden" name="productId" value={p.id}/><button name="intent" value="restore" className="min-h-9 rounded-lg border border-emerald-200 px-3 text-xs font-bold text-emerald-800">Restore</button></form><form action={manageProduct}><input type="hidden" name="productId" value={p.id}/><button name="intent" value="permanent" className="min-h-9 rounded-lg border border-red-200 px-3 text-xs font-bold text-red-700">Delete forever</button></form></> : <form action={manageProduct}><input type="hidden" name="productId" value={p.id}/><button name="intent" value="trash" className="min-h-9 rounded-lg border border-amber-200 px-3 text-xs font-bold text-amber-800">Trash</button></form>}
          </div>
        </div>;
      })}
      {!products?.length && !error && <div className="p-12 text-center"><p className="font-bold">No products found.</p><p className="mt-2 text-sm text-[#718072]">Try changing the filters or add a new product.</p><Link href="/admin/products/new" className="mt-4 inline-flex rounded-xl bg-[#17452c] px-4 py-2.5 text-sm font-bold text-white">Add New Product</Link></div>}
      {totalPages > 1 && <div className="flex items-center justify-between border-t border-[#e8eee5] p-4"><Link aria-disabled={page<=1} className={`rounded-lg border px-4 py-2 text-sm font-bold ${page<=1?"pointer-events-none opacity-40":""}`} href={pageHref(Math.max(1,page-1))}>← Previous</Link><span className="text-xs text-[#718072]">{page} / {totalPages}</span><Link aria-disabled={page>=totalPages} className={`rounded-lg border px-4 py-2 text-sm font-bold ${page>=totalPages?"pointer-events-none opacity-40":""}`} href={pageHref(Math.min(totalPages,page+1))}>Next →</Link></div>}
    </div>
  </main>;
}
