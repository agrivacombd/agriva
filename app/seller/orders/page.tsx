import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkModuleAccess, findMarketplaceOrganizationWithAccess } from "@/lib/authz/module-access";

export const metadata = { title: "Seller Orders | AGRIVA", robots: { index: false, follow: false } };
type SellerOrderStatus = "shipped" | "delivered" | "completed" | "cancelled";

function addressText(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

async function updateSellerOrder(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") ?? "").trim();
  const status = String(formData.get("status") ?? "") as SellerOrderStatus;
  if (!/^[0-9a-f-]{36}$/i.test(orderId) || !["shipped", "delivered", "completed", "cancelled"].includes(status)) redirect("/seller/orders?notice=invalid");
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login?next=/seller/orders");
  const { error } = await supabase.rpc("set_marketplace_order_status", { p_order_id: orderId, p_status: status });
  revalidatePath("/seller/orders");
  revalidatePath("/seller/products");
  redirect(error ? "/seller/orders?notice=error" : "/seller/orders?notice=saved");
}

export default async function SellerOrdersPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const notice = typeof params?.notice === "string" ? params.notice : "";
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login?next=/seller/orders");
  const access = await findMarketplaceOrganizationWithAccess("read");
  if (!access.allowed) redirect("/account/verification?module=marketplace");
  const orderAccess = await checkModuleAccess("marketplace", "manage_orders", { type: "organization", id: access.organizationId });
  if (!orderAccess.allowed) redirect("/account/verification?module=marketplace");

  const { data: orders, error } = await supabase.from("marketplace_orders")
    .select("id,checkout_id,total_amount,quantity,unit_price,status,payment_status,payment_method,created_at,shipping_address,products(name)")
    .eq("farmer_id", user.id).order("created_at", { ascending: false }).limit(100);
  const counts = (orders ?? []).reduce<Record<string, number>>((acc, order) => { acc[order.status] = (acc[order.status] ?? 0) + 1; return acc; }, {});
  const labels: Record<string, string> = { processing: "প্রসেসিং", shipped: "পাঠানো", delivered: "ডেলিভারি", completed: "সম্পন্ন", cancelled: "বাতিল", refunded: "রিফান্ড" };

  return <main className="min-h-screen bg-[#f5f8f1] px-4 py-8 text-[#17351f] sm:px-6">
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#123b27] p-5 text-white">
        <div><p className="text-xs font-bold uppercase tracking-wider text-emerald-100">AGRIVA Seller Centre · Marketplace</p><h1 className="mt-2 text-2xl font-black">অর্ডার ম্যানেজমেন্ট</h1></div>
        <Link href="/seller/products" className="rounded-xl bg-white/10 px-4 py-3 text-sm font-bold">আমার পণ্য</Link>
      </header>
      <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[["সব অর্ডার", (orders ?? []).length], ["প্রসেসিং", counts.processing ?? 0], ["পাঠানো", counts.shipped ?? 0], ["ডেলিভারি", (counts.delivered ?? 0) + (counts.completed ?? 0)]].map(([label, count]) => <div key={label} className="rounded-xl bg-white p-4 shadow-sm"><p className="text-xs font-bold text-slate-600">{label}</p><p className="mt-1 text-2xl font-black">{count}</p></div>)}
      </section>
      {notice && <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm font-semibold">{notice === "saved" ? "অর্ডারের অবস্থা আপডেট হয়েছে।" : "অর্ডার আপডেট করা যায়নি। অনুমতি ও status transition যাচাই করুন।"}</p>}
      {error ? <p role="alert" className="mt-6 rounded-xl bg-amber-50 p-5">অর্ডার লোড করা যায়নি। পরে আবার চেষ্টা করুন।</p> : (orders ?? []).length ? <div className="mt-6 space-y-4">
        {(orders ?? []).map(order => {
          const address = order.shipping_address && typeof order.shipping_address === "object" && !Array.isArray(order.shipping_address) ? order.shipping_address as Record<string, unknown> : {};
          const product = Array.isArray(order.products) ? order.products[0] : order.products;
          const closed = ["cancelled", "refunded", "completed"].includes(order.status);
          return <article key={order.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-wider text-[#9a7625]">Order #{order.id.slice(0, 8)}{order.checkout_id ? " · Checkout " + order.checkout_id.slice(0, 8) : ""}</p><h2 className="mt-1 text-lg font-black">{product?.name ?? "Marketplace product"}</h2><p className="mt-1 text-xs text-slate-500">{new Date(order.created_at).toLocaleString("bn-BD", { timeZone: "Asia/Dhaka" })}</p></div><span className="rounded-full bg-[#edf4e9] px-3 py-1 text-xs font-bold">{labels[order.status] ?? order.status}</span></div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-[#f7faf5] p-4"><p className="font-bold">পরিমাণ: {order.quantity}</p><p className="mt-1 text-sm text-slate-600">একক মূল্য ৳{Number(order.unit_price).toLocaleString("bn-BD")}</p><p className="mt-2 text-xl font-black">৳{Number(order.total_amount).toLocaleString("bn-BD")}</p><p className="mt-1 text-xs text-slate-600">Cash on Delivery · {order.payment_status}</p></div>
              <div className="rounded-xl border p-4"><p className="text-sm font-extrabold">ক্রেতার ডেলিভারি তথ্য</p><p className="mt-2 text-sm font-semibold">{addressText(address.fullName) || "নাম নেই"}</p><p className="mt-1 text-sm">{addressText(address.phone)}</p><p className="mt-1 text-sm text-slate-600">{[addressText(address.division),addressText(address.district),addressText(address.upazila),addressText(address.unionOrArea),addressText(address.villageRoadHouse),addressText(address.address)].filter(Boolean).join(", ")}</p></div>
              <div className="rounded-xl border p-4"><p className="text-sm font-extrabold">অর্ডারের অবস্থা</p>{closed ? <p className="mt-2 text-sm text-slate-600">এই অর্ডার বন্ধ বা সম্পন্ন।</p> : <form action={updateSellerOrder} className="mt-3 space-y-3"><input type="hidden" name="orderId" value={order.id}/><select name="status" defaultValue={order.status === "processing" ? "shipped" : order.status === "shipped" ? "delivered" : "completed"} className="w-full rounded-lg border bg-white px-3 py-2 text-sm"><option value="shipped" disabled={order.status !== "processing"}>পাঠানো হয়েছে</option><option value="delivered" disabled={order.status !== "shipped"}>ডেলিভারি হয়েছে</option><option value="completed" disabled={order.status !== "delivered"}>সম্পন্ন</option><option value="cancelled" disabled={!["processing","shipped"].includes(order.status)}>বাতিল</option></select><button className="w-full rounded-lg bg-emerald-900 px-4 py-2 text-sm font-bold text-white">আপডেট করুন</button></form>}</div>
            </div>
          </article>;
        })}
      </div> : <section className="mt-6 rounded-2xl border border-dashed bg-white p-8 text-center"><h2 className="text-xl font-black">এখনো কোনো অর্ডার নেই</h2><p className="mt-2 text-sm text-slate-600">Marketplace পণ্যের অর্ডার এখানে দেখা যাবে।</p></section>}
    </div>
  </main>;
}
