import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/dashboard");
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
  const image = formData.get("image");

  if (!name || name.length > 160 || !Number.isFinite(price) || price <= 0 ||
      !Number.isFinite(stock) || stock < 0 || !Number.isFinite(commission) ||
      commission < 0 || commission > 100 || description.length > 5000 ||
      !(image instanceof File) || image.size < 1 || image.size > MAX_IMAGE_SIZE ||
      !ALLOWED_IMAGE_TYPES.has(image.type)) {
    redirect("/admin/products/new?notice=invalid");
  }

  const supabase = await requireAdmin();
  const extension = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" } as Record<string, string>)[image.type];
  const safeBase = name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  const slug = `${safeBase || "agriva-product"}-${crypto.randomUUID().slice(0, 8)}`;
  const objectPath = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("product-images").upload(objectPath, new Uint8Array(await image.arrayBuffer()), {
    contentType: image.type,
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) redirect("/admin/products/new?notice=upload_error");

  const { data: publicImage } = supabase.storage.from("product-images").getPublicUrl(objectPath);
  const { error: createError } = await supabase.rpc("admin_create_product", {
    p_name: name,
    p_slug: slug,
    p_description: description || null,
    p_price: price,
    p_stock: stock,
    p_commission_percent: commission,
    p_category_slug: categorySlug || null,
    p_subcategory_slug: null,
    p_image_url: publicImage.publicUrl,
  });

  if (createError) {\n    await supabase.storage.from("product-images").remove([objectPath]);\n    redirect("/admin/products/new?notice=create_error");\n  }
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/marketplace");
  revalidatePath("/sitemap.xml");
  redirect("/admin/products?notice=created");
}

const notices: Record<string, string> = {
  invalid: "তথ্য যাচাই করুন। ছবি JPG, PNG, WebP বা AVIF হতে হবে এবং ৫ MB-এর মধ্যে হতে হবে।",
  upload_error: "ছবি আপলোড হয়নি। Storage migration ও admin permission যাচাই করুন।",
  create_error: "পণ্য তৈরি হয়নি। Product migration, category ও database logs যাচাই করুন।",
};

export default async function NewAdminProductPage({ searchParams }: { searchParams?: { notice?: string } }) {
  const supabase = await requireAdmin();
  const { data: categories } = await supabase.from("product_categories").select("name,slug").eq("is_active", true).order("sort_order");
  return <main className="min-h-screen bg-[#f4f7f1] px-4 py-8 text-[#17351f] sm:px-6">
    <div className="mx-auto max-w-3xl">
      <header className="flex items-center justify-between gap-4 rounded-2xl bg-[#123b27] p-5 text-white">
        <div><Link href="/admin" className="text-xl font-black">AGRIVA Admin</Link><p className="mt-1 text-xs text-emerald-100">Create marketplace product</p></div>
        <Link href="/admin/products" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">← পণ্যের তালিকা</Link>
      </header>
      <h1 className="mt-7 text-3xl font-black">নতুন পণ্য যোগ করুন</h1>
      <p className="mt-2 text-sm leading-6 text-[#637266]">পণ্যের ছবি, বিক্রয়মূল্য ও স্টক দিন। Save করলে পণ্যটি approved এবং active হয়ে Marketplace-এ প্রকাশিত হবে।</p>
      {searchParams?.notice && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">{notices[searchParams.notice] ?? "পণ্য যোগ করা যায়নি।"}</p>}
      <form action={createProduct} encType="multipart/form-data" className="mt-6 grid gap-5 rounded-2xl border border-[#dfe8dc] bg-white p-5 shadow-sm sm:p-7">
        <label className="text-sm font-bold">পণ্যের নাম *
          <input name="name" required maxLength={160} placeholder="যেমন: উন্নত মানের ধানের বীজ" className="mt-1.5 w-full rounded-xl border px-3 py-3 font-normal" />
        </label>
        <label className="text-sm font-bold">পণ্যের ছবি *
          <input name="image" type="file" required accept="image/jpeg,image/png,image/webp,image/avif" className="mt-1.5 block w-full rounded-xl border p-3 font-normal file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:font-bold file:text-emerald-900" />
          <span className="mt-1 block text-xs font-normal text-slate-500">JPG, PNG, WebP বা AVIF · সর্বোচ্চ ৫ MB</span>
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
        <label className="text-sm font-bold">পণ্যের বিবরণ
          <textarea name="description" rows={5} maxLength={5000} placeholder="পণ্যের বৈশিষ্ট্য, প্যাকেটের পরিমাণ, ব্যবহারবিধি ও প্রয়োজনীয় তথ্য..." className="mt-1.5 w-full rounded-xl border px-3 py-3 font-normal" />
        </label>
        <button type="submit" className="min-h-12 rounded-xl bg-[#17452c] px-5 py-3 font-extrabold text-white hover:bg-emerald-900">পণ্য যোগ করুন ও Marketplace-এ প্রকাশ করুন</button>
        <p className="text-xs leading-5 text-slate-500">নিরাপত্তা: এই পেজে কেবল Admin প্রবেশ করতে পারবেন। ছবি Storage-এ যাবে; database-এ service role key ব্যবহার করা হয় না।</p>
      </form>
    </div>
  </main>;
}
