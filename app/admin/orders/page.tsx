import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type OrderStatus = "processing" | "shipped" | "delivered" | "completed" | "cancelled";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/dashboard");
  return supabase;
}

async function updateOrderStatus(formData: FormData) {
  "use server";
  const orderId = String(formData.get("orderId") ?? "").trim();
  const status = String(formData.get("status") ?? "") as OrderStatus;
  const allowed: OrderStatus[] = ["processing", "shipped", "delivered", "completed", "cancelled"];
  if (!/^[0-9a-f-]{36}$/i.test(orderId) || !allowed.includes(status)) {
    redirect("/admin/orders?notice=invalid");
  }
  const supabase = await requireAdmin();
  const { error } = await supabase.rpc("set_marketplace_order_status", {
    p_order_id: orderId,
    p_status: status,
  });
  revalidatePath("/admin/orders");
  revalidatePath("/orders");
  redirect(error ? "/admin/orders?notice=error" : "/admin/orders?notice=saved");
}

const statusLabel: Record<string, string> = {
  pending: "নতুন / অপেক্ষমাণ",
  processing: "প্রসেসিং",
  shipped: "শিপড",
  delivered: "ডেলিভারি সম্পন্ন",
  completed: "সম্পন্ন",
  cancelled: "বাতিল",
  refunded: "রিফান্ড",
};

function addressLine(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

export default async function AdminOrdersPage({ searchParams }: { searchParams?: { notice?: string; status?: string } }) {
  const supabase = await requireAdmin();
  const { data: orders, error } = await supabase
    .from("marketplace_orders")
    .select("id,total_amount,delivery_fee,unit_price,quantity,status,payment_method,payment_status,created_at,paid_at,shipped_at,delivered_at,reseller_id,shipping_address,products(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  const filtered = (orders ?? []).filter((o) => !searchParams?.status || searchParams.status === "all" || o.status === searchParams.status);
  const counts = (orders ?? []).reduce<Record<string, number>>((acc, order) => {
    acc[order.status] = (acc[order.status] ?? 0) + 1;
    return acc;
  }, {});

  return <main className="min-h-screen bg-[#f5f7f2] px-4 py-8 text-[#17351f] sm:px-6">
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#123b27] p-5 text-white">
        <div><Link href="/admin" className="text-xl font-black">AGRIVA Admin</Link><p className="mt-1 text-xs text-emerald-100">COD order operations · বাংলাদেশ</p></div>
        <Link href="/admin" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">← Admin overview</Link>
      </header>
      <h1 className="mt-7 text-3xl font-black">অর্ডার ও ডেলিভারি ম্যানেজমেন্ট</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#637266]">অর্ডারের ঠিকানা, COD-তে আদায়যোগ্য টাকা এবং ডেলিভারির অবস্থা এক জায়গা থেকে দেখুন। Delivered মানেই টাকা আদায় হয়েছে—এমন ধরে নেওয়া হয় না।</p>

      {searchParams?.notice && <p role="status" className={`mt-5 rounded-xl border p-3 text-sm font-semibold ${searchParams.notice === "saved" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
        {searchParams.notice === "saved" ? "অর্ডারের অবস্থা আপডেট হয়েছে।" : searchParams.notice === "invalid" ? "অর্ডার বা status সঠিক নয়।" : "অবস্থা আপডেট করা যায়নি। অর্ডার বন্ধ হয়ে থাকলে বা permission না থাকলে transition প্রত্যাখ্যাত হতে পারে।"}
      </p>}
      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">অর্ডার তালিকা লোড করা যায়নি। Database schema এবং admin access যাচাই করুন।</p>}

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["all", "সব অর্ডার", (orders ?? []).length],
          ["processing", "নতুন / প্রসেসিং", (counts.processing ?? 0) + (counts.pending ?? 0)],
          ["shipped", "শিপড", counts.shipped ?? 0],
          ["delivered", "ডেলিভারি সম্পন্ন", counts.delivered ?? 0],
          ["cancelled", "বাতিল", counts.cancelled ?? 0],
          ["completed", "সম্পন্ন", counts.completed ?? 0],
        ].map(([key, label, count]) => <Link key={key} href={key === "all" ? "/admin/orders?status=all" : `/admin/orders?status=${key}`} className={`rounded-2xl border bg-white p-4 transition hover:border-emerald-700 ${searchParams?.status === key || (!searchParams?.status && key === "all") ? "border-emerald-800 ring-1 ring-emerald-800" : "border-[#dfe8dc]"}`}>
          <p className="text-xs font-bold text-[#68786b]">{label}</p><p className="mt-2 text-2xl font-black">{count}</p>
        </Link>)}
      </section>

      <section className="mt-6 space-y-4">
        {filtered.map((o) => {
          const address = o.shipping_address && typeof o.shipping_address === "object" && !Array.isArray(o.shipping_address) ? o.shipping_address as Record<string, unknown> : {};
          const buyerName = addressLine(address.fullName ?? address.name) || "নাম দেওয়া নেই";
          const phone = addressLine(address.phone);
          const district = addressLine(address.district ?? address.city);
          const fullAddress = [addressLine(address.division), district, addressLine(address.upazila), addressLine(address.unionOrArea ?? address.area ?? address.union), addressLine(address.villageRoadHouse ?? address.village ?? address.address), address.postalCode ? `পোস্ট কোড ${addressLine(address.postalCode)}` : ""].filter(Boolean).join(", ");
          const product = Array.isArray(o.products) ? o.products[0] : o.products;
          const status = o.status;
          return <article key={o.id} className="rounded-2xl border border-[#dfe8dc] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-xs font-extrabold uppercase tracking-wider text-[#9a7625]">Order #{o.id.slice(0, 8)}</p><h2 className="mt-1 text-lg font-black">{buyerName}</h2><p className="mt-1 text-xs text-[#748074]">{new Date(o.created_at).toLocaleString("bn-BD", { timeZone: "Asia/Dhaka" })}</p></div>
              <span className="rounded-full bg-[#edf4e9] px-3 py-1.5 text-xs font-extrabold">{statusLabel[status] ?? status}</span>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr_.8fr]">
              <div className="rounded-xl bg-[#f7faf5] p-4">
                <p className="font-bold">{product?.name ?? "পণ্য"}</p><p className="mt-1 text-sm text-[#647468]">পরিমাণ: {o.quantity} · একক মূল্য: ৳{Number(o.unit_price ?? 0).toLocaleString("bn-BD")}</p>
                <p className="mt-2 text-xl font-black">COD: ৳{Number(o.total_amount ?? 0).toLocaleString("bn-BD")}</p>
                <p className="mt-1 text-xs text-[#647468]">ডেলিভারি চার্জ: ৳{Number(o.delivery_fee ?? 0).toLocaleString("bn-BD")} · পেমেন্ট: Cash on Delivery</p>
                <p className="mt-2 text-xs font-semibold text-amber-800">আদায়ের অবস্থা: {o.payment_status === "paid" ? "পেইড হিসেবে রেকর্ড আছে" : "এখনো আদায়/পেইড হিসেবে রেকর্ড নেই"}</p>
              </div>
              <div className="rounded-xl border border-[#e4ebe1] p-4">
                <p className="text-sm font-extrabold">ডেলিভারি তথ্য</p><p className="mt-2 text-sm">{phone || "মোবাইল নম্বর নেই"}</p><p className="mt-1 text-sm font-semibold">{district || "জেলা দেওয়া নেই"}</p><p className="mt-1 whitespace-pre-wrap text-sm text-[#647468]">{fullAddress || "সম্পূর্ণ ঠিকানা দেওয়া নেই"}</p>
                {addressLine(address.landmark) && <p className="mt-2 text-xs text-[#647468]">ল্যান্ডমার্ক: {addressLine(address.landmark)}</p>}
                {addressLine(address.deliveryInstructions) && <p className="mt-2 text-xs text-[#647468]">নির্দেশনা: {addressLine(address.deliveryInstructions)}</p>}
              </div>
              <div className="rounded-xl border border-[#e4ebe1] p-4">
                <p className="text-sm font-extrabold">ডেলিভারি অবস্থা</p>
                <form action={updateOrderStatus} className="mt-3 space-y-3">
                  <input type="hidden" name="orderId" value={o.id}/>
                  <label className="block text-xs font-bold text-[#647468]">নতুন status
                    <select name="status" defaultValue={status === "pending" ? "processing" : status} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 text-sm">
                      <option value="processing">প্রসেসিং / নতুন</option><option value="shipped">শিপড</option><option value="delivered">ডেলিভারি সম্পন্ন</option><option value="completed">সম্পন্ন</option><option value="cancelled">বাতিল</option>
                    </select>
                  </label>
                  <button className="w-full rounded-xl bg-[#17452c] px-4 py-2.5 text-sm font-extrabold text-white">অবস্থা আপডেট করুন</button>
                </form>
                <p className="mt-3 text-xs leading-5 text-[#748074]">Status update database authorization মেনে চলে। বাতিল করলে বর্তমান database RPC stock ফেরত দেওয়ার চেষ্টা করে।</p>
              </div>
            </div>
          </article>;
        })}
        {!error && filtered.length === 0 && <div className="rounded-2xl bg-white p-8 text-center text-sm text-[#647468]">এই ফিল্টারে কোনো অর্ডার নেই।</div>}
      </section>
      <p className="mt-6 text-xs leading-5 text-[#7b887d]">নোট: বর্তমান database schema-তে COD collection-এর আলাদা actor/time/audit field নেই। তাই এই প্যানেল Delivered status থেকে টাকা আদায় হয়েছে বলে ধরে নেয় না; collection confirmation feature migration ও audit design শেষ না হওয়া পর্যন্ত যোগ করা হয়নি।</p>
    </div>
  </main>;
}
