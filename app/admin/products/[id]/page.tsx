import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminPage } from "@/lib/admin/authz";
import TaxonomyFields from "@/components/admin/TaxonomyFields";
import AdminProductImages from "@/components/admin/AdminProductImages";
import AdminProductDescriptionEditor from "@/components/admin/AdminProductDescriptionEditor";
import { MAX_PRODUCT_DESCRIPTION_HTML_LENGTH, sanitizeProductDescription } from "@/lib/marketplace/product-description";
import { getCategory, getSubcategory } from "@/lib/marketplace/taxonomy";

async function updateProduct(formData: FormData) {
  "use server";
  const productId = String(formData.get("productId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const description = sanitizeProductDescription(String(formData.get("description") ?? ""));
  if (description.length > MAX_PRODUCT_DESCRIPTION_HTML_LENGTH) redirect(`/admin/products/${productId}?notice=description-too-long`);
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
    redirect(`/admin/products/${productId}?notice=invalid`);
  }
  const { supabase } = await requireAdminPage("catalog.edit");
  const { error: productError } = await supabase.rpc("admin_update_product", {
    p_product_id: productId, p_name: name, p_slug: slug, p_description: description || null,
    p_price: price, p_stock: stock, p_commission_percent: commission, p_status: status,
  });
  const { error: categoryError } = productError ? { error: productError } : await supabase.rpc("admin_set_product_taxonomy", {
    p_product_id: productId, p_category_slug: categorySlug || null, p_subcategory_slug: subcategorySlug || null,
  });
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/marketplace");
  revalidatePath("/sitemap.xml");
  redirect(productError || categoryError ? `/admin/products/${productId}?notice=error` : `/admin/products/${productId}?notice=saved`);
}

export default async function EditAdminProductPage({ params, searchParams }: { params: { id: string }; searchParams?: { notice?: string } }) {
  const { supabase } = await requireAdminPage("catalog.read");
  const { data: product, error } = await supabase.from("products")
    .select("id,name,slug,description,price,stock,reseller_commission_percent,status,farmer_id,category,category_slug,subcategory_slug,image_url,image_urls,updated_at,deleted_at,sku,seo_title,seo_description,seo_keywords")
    .eq("id", params.id).maybeSingle();
  if (error || !product) notFound();
  const imageUrls = [...(Array.isArray(product.image_urls) ? product.image_urls : []), ...(product.image_url ? [product.image_url] : [])].filter((value: string, index: number, all: string[]) => all.indexOf(value) === index).slice(0,4);
  return <main className="mx-auto min-h-[calc(100vh-68px)] w-full max-w-6xl px-4 py-6 text-[#17351f] sm:px-6">
    <Link href="/admin/products" className="text-sm font-bold text-[#54705b] hover:underline">← Back to Products</Link>
    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#a47b20]">Product editor</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">Edit Product</h1><p className="mt-1 text-sm text-[#637266]">{product.name}</p></div><span className="w-fit rounded-full bg-[#edf4e9] px-3 py-1 text-xs font-bold">{product.deleted_at ? "Trash" : product.status}</span></div>
    {searchParams?.notice && <p role="status" className={`mt-5 rounded-xl border p-3 text-sm font-semibold ${searchParams.notice === "saved" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-800"}`}>{searchParams.notice === "saved" ? "পণ্যের তথ্য আপডেট হয়েছে।" : searchParams.notice === "description-too-long" ? "বিবরণ ২,৫০,০০০ অক্ষরের বেশি।" : "আপডেট করা যায়নি। তথ্য ও permission যাচাই করুন।"}</p>}
    <form action={updateProduct} className="mt-6 space-y-5 rounded-2xl border border-[#dfe8dc] bg-white p-4 shadow-sm sm:p-6">
      <input type="hidden" name="productId" value={product.id}/>
      <section className="space-y-4"><div><h2 className="text-lg font-black">Basic information</h2><p className="text-xs text-[#718072]">Product name, URL and category</p></div>
        <label className="block text-sm font-bold">Product name<input name="name" required maxLength={160} defaultValue={product.name} className="mt-1.5 min-h-11 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
        <label className="block text-sm font-bold">Product URL slug<input name="slug" required maxLength={100} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={product.slug || `product-${product.id.slice(0,8)}`} className="mt-1.5 min-h-11 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
        <TaxonomyFields categorySlug={product.category_slug} subcategorySlug={product.subcategory_slug} legacyCategory={product.category}/>
      </section>
      <section className="space-y-4 border-t border-[#edf1eb] pt-5"><h2 className="text-lg font-black">Pricing & inventory</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm font-bold">Price (৳)<input name="price" type="number" min="0" step="0.01" required defaultValue={product.price} className="mt-1.5 min-h-11 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
        <label className="text-sm font-bold">Stock<input name="stock" type="number" min="0" step="0.01" required defaultValue={product.stock} className="mt-1.5 min-h-11 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
        <label className="text-sm font-bold">Reseller commission (%)<input name="commission" type="number" min="0" max="100" step="0.01" required defaultValue={product.reseller_commission_percent} className="mt-1.5 min-h-11 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
        <label className="text-sm font-bold">Status<select name="status" defaultValue={product.status} className="mt-1.5 min-h-11 w-full rounded-xl border bg-white px-3 py-2.5 font-normal"><option value="draft">Draft</option><option value="active">Published / Active</option><option value="paused">Paused</option><option value="sold_out">Sold out</option></select></label>
      </div></section>
      <section className="space-y-4 border-t border-[#edf1eb] pt-5"><h2 className="text-lg font-black">Product images</h2><AdminProductImages productId={product.id} initialUrls={imageUrls}/></section>
      <section className="space-y-4 border-t border-[#edf1eb] pt-5"><h2 className="text-lg font-black">Product description</h2><AdminProductDescriptionEditor value={sanitizeProductDescription(product.description ?? "")} productName={product.name}/></section>
      <section className="space-y-4 border-t border-[#edf1eb] pt-5"><h2 className="text-lg font-black">SEO settings</h2>
        <label className="block text-sm font-bold">SEO title<input name="seo_title" maxLength={70} defaultValue={product.seo_title ?? ""} className="mt-1.5 min-h-11 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
        <label className="block text-sm font-bold">Meta description<textarea name="seo_description" maxLength={160} defaultValue={product.seo_description ?? ""} rows={3} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
        <label className="block text-sm font-bold">SEO keywords (comma separated)<input name="seo_keywords" defaultValue={(product.seo_keywords ?? []).join(", ")} className="mt-1.5 min-h-11 w-full rounded-xl border px-3 py-2.5 font-normal"/></label>
      </section>
      <div className="flex flex-col-reverse gap-3 border-t border-[#edf1eb] pt-5 sm:flex-row sm:justify-between"><Link href="/admin/products" className="inline-flex min-h-11 items-center justify-center rounded-xl border px-5 text-sm font-bold">Cancel</Link><button className="min-h-11 rounded-xl bg-[#17452c] px-7 py-3 text-sm font-extrabold text-white">Update Product</button></div>
    </form>
    <p className="mt-3 text-xs text-[#718072]">Product ID: {product.id} · Seller ID: {product.farmer_id}</p>
  </main>;
}
