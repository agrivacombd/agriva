import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminPage, type AdminCapability } from "@/lib/admin/authz";
import TaxonomyFields from "@/components/admin/TaxonomyFields";
import AdminCreateProductForm from "@/components/admin/AdminCreateProductForm";
import AdminProductImages from "@/components/admin/AdminProductImages";
import AdminProductDescriptionEditor from "@/components/admin/AdminProductDescriptionEditor";
import { MAX_PRODUCT_DESCRIPTION_HTML_LENGTH, sanitizeProductDescription } from "@/lib/marketplace/product-description";
import { getCategory, getSubcategory } from "@/lib/marketplace/taxonomy";

async function requireAdmin(capability: AdminCapability = "catalog.read") {
  const { supabase } = await requireAdminPage(capability);
  return supabase;
}

async function saveProduct(formData: FormData) {
  "use server";
  const productId = String(formData.get("productId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const description = sanitizeProductDescription(String(formData.get("description") ?? ""));
  if (description.length > MAX_PRODUCT_DESCRIPTION_HTML_LENGTH) {
    redirect("/admin/products?notice=description-too-long");
  }
  const price = Number(formData.get("price"));
  const stock = Number(formData.get("stock"));
  const commission = Number(formData.get("commission"));
  const status = String(formData.get("status") ?? "");
  const categorySlug = String(formData.get("category_slug") ?? "").trim();
  const subcategorySlug = String(formData.get("subcategory_slug") ?? "").trim();
  const categoryEntry = categorySlug ? getCategory(categorySlug) : undefined;
  const subcategoryEntry = categorySlug && subcategorySlug ? getSubcategory(categorySlug, subcategorySlug) : undefined;
  if (!productId || !name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !Number.isFinite(price) || price < 0 ||
      !Number.isFinite(stock) || stock < 0 || !Number.isFinite(commission) || commission < 0 || commission > 100 ||
      !["draft", "active", "paused", "sold_out"].includes(status) ||
      (!categorySlug ? Boolean(subcategorySlug) : !categoryEntry || Boolean(subcategorySlug && !subcategoryEntry))) {
    redirect("/admin/products?notice=invalid");
  }

  const supabase = await requireAdmin("catalog.edit");
  const { error: productError } = await supabase.rpc("admin_update_product", {
    p_product_id: productId, p_name: name, p_slug: slug, p_description: description || null,
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
  redirect(error ? "/admin/products?notice=delete-error" : intent === "trash" ? "/admin/products?notice=trashed" : intent === "restore" ? "/admin/products?notice=restored" : "/admin/products?status=trash&notice=permanently-deleted");
}

export default async function AdminProductsPage({ searchParams }: { searchParams?: { notice?: string; status?: string; q?: string } }) {
  const supabase = await requireAdmin();
  const requestedStatus = searchParams?.status ?? "all";
  const activeStatus = ["all", "draft", "active", "paused", "sold_out", "trash"].includes(requestedStatus) ? requestedStatus : "all";
  const searchTerm = String(searchParams?.q ?? "").trim().slice(0, 120);
  const productQuery = supabase.from("products")
    .select("id,name,slug,description,price,stock,reseller_commission_percent,status,farmer_id,category,category_slug,subcategory_slug,image_url,image_urls,updated_at,deleted_at,sku")
    .order("updated_at", { ascending: false });
  let filteredQuery = productQuery;
  if (activeStatus === "trash") filteredQuery = filteredQuery.not("deleted_at", "is", null);
  else {
    filteredQuery = filteredQuery.is("deleted_at", null);
    if (activeStatus !== "all") filteredQuery = filteredQuery.eq("status", activeStatus);
  }
  if (searchTerm) filteredQuery = filteredQuery.ilike("name", `%${searchTerm}%`);
  const { data: products, error } = await filteredQuery.limit(500);

  return <main className="mx-auto min-h-[calc(100vh-68px)] w-full max-w-[1600px] px-4 py-5 text-[#17351f] sm:px-6 sm:py-7 xl:px-8">
    <div className="min-w-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#a47b20]">Marketplace catalogue</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">পণ্য ব্যবস্থাপনা</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[#637266]">নাম, বিবরণ, মূল্য, স্টক, রিসেলার কমিশন, ছবি ও পণ্যের অবস্থা পরিবর্তন করুন। পরিবর্তনগুলো audit log-এ সংরক্ষিত হবে।</p></div><Link href="/admin/products" className="hidden text-xs font-semibold text-[#54705b] sm:inline-flex">সব পণ্য দেখুন</Link></div>
      {searchParams?.notice && <p role="status" className={`mt-5 rounded-xl border p-3 text-sm font-semibold ${searchParams.notice === "saved" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-800"}`}>{searchParams.notice === "saved" ? "পণ্যের তথ্য আপডেট হয়েছে।" : searchParams.notice === "invalid" ? "সঠিক তথ্য দিন; কমিশন ০ থেকে ১০০-এর মধ্যে হতে হবে এবং সর্বোচ্চ ৪টি ছবি দিন।" : searchParams.notice === "description-too-long" ? "বিবরণ ২,৫০,০০০ অক্ষরের বেশি। কোনো লেখা কেটে সেভ হয়নি; বিবরণ ভাগ করে আবার চেষ্টা করুন।" : "আপডেট করা যায়নি। Product schema ও storage যাচাই করুন।"}</p>}
      {error && <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">পণ্য তালিকা পড়া যায়নি। Database migration এবং product schema যাচাই করুন।</p>}
      <AdminCreateProductForm />
      <form method="get" className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#dfe8dc] bg-white p-4 sm:flex-row">
        <input name="q" defaultValue={searchTerm} placeholder="পণ্যের নাম দিয়ে খুঁজুন..." className="min-h-11 min-w-0 flex-1 rounded-xl border px-3 py-2" />
        <select name="status" defaultValue={activeStatus} className="min-h-11 rounded-xl border bg-white px-3 py-2">
          <option value="all">সব Product</option><option value="draft">Draft</option><option value="active">Published / Active</option><option value="paused">Paused</option><option value="sold_out">Sold out</option><option value="trash">Trash</option>
        </select>
        <button className="min-h-11 rounded-xl bg-[#17452c] px-5 font-bold text-white">খুঁজুন / Filter</button>
        <Link href="/admin/products" className="inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm font-bold">Reset</Link>
      </form>
      <p className="mt-3 text-sm text-[#637266]">{products?.length ?? 0}টি পণ্য দেখানো হচ্ছে · {activeStatus}</p>
      <div className="mt-5 grid min-w-0 gap-4">{(products ?? []).map(p => <form key={p.id} action={saveProduct} className="min-w-0 rounded-2xl border border-[#dfe8dc] bg-white p-4 shadow-sm sm:p-5">
        <input type="hidden" name="productId" value={p.id}/>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><p className="font-black">{p.name}</p><p className="mt-1 text-xs text-[#7b887d]">ID {p.id.slice(0, 8)} · Seller {p.farmer_id.slice(0, 8)}</p></div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#edf4e9] px-3 py-1 text-xs font-extrabold">{p.deleted_at ? "Trash" : p.status}</span>{p.deleted_at ? <><button formAction={manageProduct} name="intent" value="restore" className="rounded-lg border border-emerald-300 px-3 py-2 text-xs font-bold text-emerald-800">Restore</button><button formAction={manageProduct} name="intent" value="permanent" formNoValidate className="rounded-lg border border-red-300 px-3 py-2 text-xs font-bold text-red-700">Permanently delete</button></> : <button formAction={manageProduct} name="intent" value="trash" formNoValidate className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-bold text-amber-800">Move to Trash</button>}</div></div>
        <div className="grid min-w-0 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="text-sm font-bold">পণ্যের নাম<input name="name" required maxLength={160} defaultValue={p.name} className="mt-1.5 min-h-11 w-full min-w-0 rounded-xl border border-[#d9e3d5] px-3 py-2.5 font-normal"/></label>
          <label className="text-sm font-bold">Product URL Slug<input name="slug" required maxLength={100} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={p.slug ?? ""} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
          <label className="text-sm font-bold">মূল্য (৳)<input name="price" type="number" min="0" step="0.01" required defaultValue={p.price} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
          <label className="text-sm font-bold">স্টক<input name="stock" type="number" min="0" step="0.01" required defaultValue={p.stock} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
          <label className="text-sm font-bold">রিসেলার কমিশন (%)<input name="commission" type="number" min="0" max="100" step="0.01" required defaultValue={p.reseller_commission_percent} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
          <TaxonomyFields categorySlug={p.category_slug} subcategorySlug={p.subcategory_slug} legacyCategory={p.category}/>
          <label className="text-sm font-bold">অবস্থা<select name="status" defaultValue={p.status} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 font-normal"><option value="draft">Draft</option><option value="active">Active</option><option value="paused">Paused</option><option value="sold_out">Sold out</option></select></label>
          <div className="flex items-end"><button className="w-full rounded-xl bg-[#17452c] px-4 py-3 text-sm font-extrabold text-white">Save changes</button></div>
          <AdminProductDescriptionEditor value={sanitizeProductDescription(p.description ?? "")} productName={p.name} />
          <AdminProductImages productId={p.id} initialUrls={[...(Array.isArray(p.image_urls) ? p.image_urls : []), ...(p.image_url ? [p.image_url] : [])].filter((value, index, all) => all.indexOf(value) === index).slice(0, 4)}/>
        </div>
        <p className="mt-3 text-xs text-[#7b887d]">Last updated: {new Date(p.updated_at).toLocaleDateString("en-GB")} {p.sku ? `· SKU ${p.sku}` : ""}</p>
      </form>)}
      {!products?.length && !error && <div className="rounded-2xl border border-dashed bg-white p-10 text-center"><p className="font-bold">Database-এ এখনো কোনো পণ্য নেই।</p><p className="mt-2 text-sm text-[#748074]">Sample preview products বাস্তব database পণ্য নয়।</p></div>}</div>
    </div>
  </main>;
}
