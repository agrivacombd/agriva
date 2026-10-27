"use server";

import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  const { data: profile, error: profileError } = await supabase
    .from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError || profile?.role !== "admin") redirect("/dashboard");
  return supabase;
}

async function createProduct(formData: FormData) {
  "use server";
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(formData.get("price"));
  const stock = Number(formData.get("stock"));
  const commission = Number(formData.get("commission") ?? 0);
  const categorySlug = String(formData.get("category_slug") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim();

  let validImageUrl = "";
  if (imageUrl) {
    try {
      const parsed = new URL(imageUrl);
      if (parsed.protocol !== "https:") throw new Error("HTTPS required");
      validImageUrl = parsed.toString();
    } catch {
      redirect("/admin/products/new?notice=invalid");
    }
  }

  if (!name || name.length > 160 || !Number.isFinite(price) || price <= 0 ||
      !Number.isFinite(stock) || stock < 0 || !Number.isFinite(commission) ||
      commission < 0 || commission > 100 || description.length > 5000 ||
      brand.length > 120 || sku.length > 100 || validImageUrl.length > 2048) {
    redirect("/admin/products/new?notice=invalid");
  }

  const supabase = await requireAdmin();
  const { error } = await supabase.rpc("admin_create_product", {
    p_name: name,
    p_description: description || null,
    p_price: price,
    p_stock: stock,
    p_commission_percent: commission,
    p_category_slug: categorySlug || null,
    p_image_url: validImageUrl || null,
    p_brand: brand || null,
    p_sku: sku || null,
  });

  if (error) {
    console.error("Admin product draft creation failed:", error.message);
    redirect("/admin/products/new?notice=create_error");
  }
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/marketplace");
  revalidatePath("/sitemap.xml");
  redirect("/admin/products?notice=created");
}

export default async function NewAdminProductPage({ searchParams }: {
  searchParams?: Promise<{ notice?: string }> | { notice?: string };
}) {
  const params = await searchParams;
  const supabase = await requireAdmin();
  const { data: categories } = await supabase.from("product_categories")
    .select("name,slug").eq("is_active", true).order("sort_order");

  const notice = params?.notice;
  return (
    <main className="min-h-screen bg-[#f4f7f1] px-4 py-8 text-[#17351f] sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between gap-4 rounded-2xl bg-[#123b27] p-5 text-white">
          <div><Link href="/admin" className="text-xl font-black">AGRIVA Admin</Link><p className="mt-1 text-xs text-emerald-100">Draft product creation</p></div>
          <Link href="/admin/products" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">← পণ্যের তালিকা</Link>
        </header>
        <h1 className="mt-7 text-3xl font-black">নতুন পণ্য যোগ করুন</h1>
        <p className="mt-2 text-sm leading-6 text-[#637266]">বাস্তব পণ্যের সঠিক মূল্য, স্টক ও তথ্য দিন। নিরাপত্তার জন্য নতুন পণ্য Draft হিসেবে তৈরি হবে; যাচাই করে আলাদাভাবে Active করুন।</p>
        {notice && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">
          {notice === "invalid" ? "তথ্য যাচাই করুন। মূল্য শূন্যের বেশি, স্টক শূন্য বা বেশি এবং ছবি URL HTTPS হতে হবে।" : "পণ্য তৈরি হয়নি। Database migration ও admin permission যাচাই করুন।"}
        </p>}
        <form action={createProduct} className="mt-6 grid gap-5 rounded-2xl border border-[#dfe8dc] bg-white p-5 shadow-sm sm:p-7">
          <label className="text-sm font-bold">পণ্যের নাম *
            <input name="name" required maxLength={160} className="mt-1.5 w-full rounded-xl border px-3 py-3 font-normal" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold">বিক্রয়মূল্য (৳) *
              <input name="price" type="number" min="0.01" step="0.01" required className="mt-1.5 w-full rounded-xl border px-3 py-3 font-normal" />
            </label>
            <label className="text-sm font-bold">প্রাথমিক স্টক *
              <input name="stock" type="number" min="0" step="0.01" required className="mt-1.5 w-full rounded-xl border px-3 py-3 font-normal" />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold">ক্যাটাগরি
              <select name="category_slug" defaultValue="" className="mt-1.5 w-full rounded-xl border bg-white px-3 py-3 font-normal">
                <option value="">ক্যাটাগরি বাছাই করুন</option>
                {(categories ?? []).map(category => <option key={category.slug} value={category.slug}>{category.name}</option>)}
              </select>
            </label>
            <label className="text-sm font-bold">রিসেলার কমিশন (%)
              <input name="commission" type="number" min="0" max="100" step="0.01" defaultValue="0" required className="mt-1.5 w-full rounded-xl border px-3 py-3 font-normal" />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold">ব্র্যান্ড
              <input name="brand" maxLength={120} className="mt-1.5 w-full rounded-xl border px-3 py-3 font-normal" />
            </label>
            <label className="text-sm font-bold">SKU (ঐচ্ছিক)
              <input name="sku" maxLength={100} className="mt-1.5 w-full rounded-xl border px-3 py-3 font-normal" />
            </label>
          </div>
          <label className="text-sm font-bold">ছবির HTTPS URL (ঐচ্ছিক)
            <input name="image_url" type="url" maxLength={2048} placeholder="https://..." className="mt-1.5 w-full rounded-xl border px-3 py-3 font-normal" />
          </label>
          <label className="text-sm font-bold">পণ্যের বিবরণ
            <textarea name="description" rows={5} maxLength={5000} className="mt-1.5 w-full rounded-xl border px-3 py-3 font-normal" />
          </label>
          <button type="submit" className="min-h-12 rounded-xl bg-[#17452c] px-5 py-3 font-extrabold text-white hover:bg-emerald-900">Draft পণ্য সংরক্ষণ করুন</button>
          <p className="text-xs leading-5 text-slate-500">শুধু Admin এই পেজ ব্যবহার করতে পারবেন। Database RPC-তেও admin role যাচাই ও audit log লেখা হয়। পণ্য স্বয়ংক্রিয়ভাবে Marketplace-এ প্রকাশিত হবে না।</p>
        </form>
      </div>
    </main>
  );
}
