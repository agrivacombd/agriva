import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authorizePermission } from "@/lib/auth/server-authorization";

async function requireModerator() {
  const auth = await authorizePermission("catalog.moderate");
  if (!auth.ok) {
    if (auth.status === 401) redirect("/login?next=/admin/moderation");
    redirect("/dashboard");
  }
  if (!auth.roles.some((role) => role === "admin" || role === "super_admin" || role === "product_moderator")) redirect("/dashboard");
  return auth;
}

async function decideModeration(formData: FormData) {
  "use server";
  const productId = String(formData.get("productId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!productId || !["approve", "reject", "request_changes"].includes(decision)) redirect("/admin/moderation?notice=invalid");
  if (decision !== "approve" && (reason.length < 3 || reason.length > 1000)) redirect("/admin/moderation?notice=reason");
  const auth = await requireModerator();
  if (decision === "approve") {
    const { data: candidate, error: candidateError } = await auth.supabase
      .from("products").select("image_url").eq("id", productId).maybeSingle();
    if (candidateError || !candidate) redirect("/admin/moderation?notice=error");
    if (!candidate.image_url) redirect("/admin/moderation?notice=image");
  }
  const { error } = await auth.supabase.rpc("admin_moderate_marketplace_product", {
    p_product_id: productId,
    p_decision: decision,
    p_reason: reason || null,
  });
  revalidatePath("/admin/moderation");
  revalidatePath("/admin/products");
  revalidatePath("/admin");
  revalidatePath("/marketplace");
  revalidatePath("/sitemap.xml");
  redirect(error ? "/admin/moderation?notice=error" : "/admin/moderation?notice=saved");
}

type Product = {
  id: string; name: string; description: string | null; price: number | string;
  stock: number | string; category: string; farmer_id: string;
  moderation_status: "pending" | "approved" | "rejected" | "changes_requested";
  moderation_reason: string | null; created_at: string;
};

export default async function ProductModerationPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const auth = await requireModerator();
  const { notice } = await searchParams;
  const { data, error } = await auth.supabase
    .from("products")
    .select("id,name,description,price,stock,category,image_url,farmer_id,moderation_status,moderation_reason,created_at")
    .in("moderation_status", ["pending", "changes_requested"])
    .order("created_at", { ascending: true })
    .limit(100);
  const products = (data ?? []) as Product[];
  const notices: Record<string, string> = {
    saved: "Moderation decision সংরক্ষণ হয়েছে।",
    error: "সিদ্ধান্ত সংরক্ষণ করা যায়নি। Database migration ও admin permission যাচাই করুন।",
    invalid: "পণ্যের তথ্য বা সিদ্ধান্ত সঠিক নয়।",
    reason: "Reject বা changes request করার সময় ৩–১০০০ অক্ষরের কারণ লিখুন।",
    image: "ছবি সংরক্ষণ না হওয়া পর্যন্ত পণ্য Approve করা যাবে না। Catalogue-এ ছবি যোগ করে আবার যাচাই করুন.",
  };

  return (
    <main className="min-h-screen bg-[#f5f7f2] px-4 py-8 text-[#17351f] sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-[#123b27] p-6 text-white">
          <div><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-100">AGRIVA • Catalog governance</p><h1 className="mt-2 text-3xl font-black">Product Moderation</h1><p className="mt-2 text-sm text-emerald-50">পণ্য অনুমোদন, প্রত্যাখ্যান বা সংশোধনের অনুরোধ—প্রতিটি সিদ্ধান্ত audit log-এ সংরক্ষিত হয়।</p></div>
          <div className="flex gap-2"><Link href="/admin" className="rounded-xl bg-white/10 px-4 py-3 text-sm font-bold">Super Admin</Link><Link href="/admin/products" className="rounded-xl bg-white/10 px-4 py-3 text-sm font-bold">Catalogue</Link></div>
        </header>
        {notice && <p role="status" className={notice === "saved" ? "mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900" : "mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800"}>{notices[notice] ?? "অপারেশন সম্পন্ন হয়নি।"}</p>}
        {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">Moderation queue লোড করা যায়নি। Migration প্রয়োগ ও database permission যাচাই করুন।</p>}
        <section className="mt-7 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-black">Review queue</h2><p className="mt-1 text-sm text-[#647568]">সর্বোচ্চ ১০০টি অপেক্ষমাণ বা সংশোধন-প্রয়োজন পণ্য দেখানো হচ্ছে।</p></div><span className="rounded-full bg-white px-4 py-2 text-sm font-bold">{products.length}টি অপেক্ষমাণ</span></section>
        <div className="mt-5 grid gap-4">
          {products.map((product) => <article key={product.id} className="rounded-3xl border border-[#e1e9df] bg-white p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-[#a67f25]">{product.category}</p><h3 className="mt-2 text-xl font-black">{product.name}</h3><p className="mt-2 text-sm text-[#647568]">Seller ID: {product.farmer_id.slice(0, 8)} · Submitted {new Date(product.created_at).toLocaleDateString("en-GB")}</p></div><span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900">{product.moderation_status}</span></div>
            {product.image_url ? <div role="img" aria-label={`${product.name} product image preview`} className="mt-4 h-44 w-44 rounded-2xl border bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url("${product.image_url}")` }} /> : <p role="alert" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-900">পণ্যের ছবি নেই—Approve করার আগে ছবি সংরক্ষণ করুন।</p>}
            <div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-[#f5f7f2] p-3"><p className="text-xs text-[#647568]">Price</p><p className="mt-1 font-black">৳{Number(product.price).toLocaleString("en-BD")}</p></div><div className="rounded-xl bg-[#f5f7f2] p-3"><p className="text-xs text-[#647568]">Stock</p><p className="mt-1 font-black">{Number(product.stock).toLocaleString("en-BD")}</p></div><div className="rounded-xl bg-[#f5f7f2] p-3"><p className="text-xs text-[#647568]">Previous reason</p><p className="mt-1 text-sm">{product.moderation_reason || "—"}</p></div></div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#526357]">{product.description || "বিবরণ দেওয়া হয়নি।"}</p>
            <form action={decideModeration} className="mt-5 rounded-2xl border border-[#e1e9df] p-4">
              <input type="hidden" name="productId" value={product.id}/>
              <label className="block text-sm font-bold">কারণ / seller-এর জন্য feedback <textarea name="reason" minLength={3} maxLength={1000} rows={2} className="mt-2 w-full rounded-xl border px-3 py-3 font-normal" placeholder="Reject বা changes request করলে কারণ লিখুন। Approval-এর জন্য ঐচ্ছিক।"/></label>
              <div className="mt-4 flex flex-wrap gap-2"><button name="decision" value="approve" className="rounded-xl bg-[#17452c] px-4 py-3 text-sm font-bold text-white">Approve & publish</button><button name="decision" value="request_changes" className="rounded-xl border border-amber-300 px-4 py-3 text-sm font-bold text-amber-900">Request changes</button><button name="decision" value="reject" className="rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-800">Reject listing</button></div>
            </form>
          </article>)}
          {!error && products.length === 0 && <div className="rounded-3xl border border-dashed bg-white p-10 text-center"><h3 className="text-lg font-black">Review queue is clear</h3><p className="mt-2 text-sm text-[#647568]">এই মুহূর্তে কোনো pending product নেই।</p></div>}
        </div>
      </div>
    </main>
  );
}
