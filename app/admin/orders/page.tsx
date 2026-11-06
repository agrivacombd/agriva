import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAvailableAdminCapabilities, requireAdminPage, type AdminCapability } from "@/lib/admin/authz";

type OrderStatus = "processing" | "shipped" | "delivered" | "completed" | "cancelled";

const FINANCE_MUTATIONS_ENABLED = false; // Re-enable only after audited service-role RPC workflow is deployed.

async function requireAdmin(capability: AdminCapability = "orders.read") {
  const { supabase } = await requireAdminPage(capability);
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
  const supabase = await requireAdmin("orders.transition");
  const { error } = await supabase.rpc("set_marketplace_order_status", {
    p_order_id: orderId,
    p_status: status,
  });
  revalidatePath("/admin/orders");
  revalidatePath("/orders");
  redirect(error ? "/admin/orders?notice=error" : "/admin/orders?notice=saved");
}


async function recordCodCollection(formData: FormData) {
  "use server";
  if (!FINANCE_MUTATIONS_ENABLED) redirect("/admin/orders?notice=finance-disabled");
  const checkoutId = String(formData.get("checkoutId") ?? "").trim();
  const amount = Number(formData.get("collectedAmount"));
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);
  if (!/^[0-9a-f-]{36}$/i.test(checkoutId) || !Number.isFinite(amount) || amount < 0) redirect("/admin/orders?notice=invalid");
  const supabase = await requireAdmin("payments.reconcile");
  const { error } = await supabase.rpc("record_cod_collection", {
    p_checkout_id: checkoutId, p_collected_amount: amount, p_note: note || null,
  });
  revalidatePath("/admin/orders");
  revalidatePath("/orders");
  redirect(error ? "/admin/orders?notice=collection-error" : "/admin/orders?notice=collection-saved");
}

const orderTransitionOptions: Record<string, { value: OrderStatus; label: string }[]> = {
  pending: [{ value: "processing", label: "প্রসেসিং" }, { value: "cancelled", label: "বাতিল" }],
  processing: [{ value: "shipped", label: "শিপড" }, { value: "cancelled", label: "বাতিল" }],
  shipped: [{ value: "delivered", label: "ডেলিভারি সম্পন্ন" }, { value: "cancelled", label: "বাতিল" }],
  delivered: [{ value: "completed", label: "সম্পন্ন" }],
};

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

export default async function AdminOrdersPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const notice = typeof params?.notice === "string" ? params.notice : "";
  const selectedStatus = typeof params?.status === "string" ? params.status : "";
  const supabase = await requireAdmin("orders.read");
  const availableCapabilities = new Set<string>(await getAvailableAdminCapabilities(["payments.read", "payments.reconcile"]));
  const canReadPayments = availableCapabilities.has("payments.read");
  const canReconcilePayments = FINANCE_MUTATIONS_ENABLED && availableCapabilities.has("payments.reconcile");
  const { data: orders, error: ordersError } = await supabase
    .from("marketplace_orders")
    .select("id,checkout_id,total_amount,delivery_fee,unit_price,quantity,status,payment_method,payment_status,created_at,paid_at,shipped_at,delivered_at,reseller_id,shipping_address,products(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  const checkoutIds = Array.from(new Set((orders ?? []).map((order) => order.checkout_id).filter(Boolean)));
  const { data: checkouts } = checkoutIds.length && canReadPayments
    ? await supabase.from("marketplace_checkouts").select("id,total_amount,payment_status,collection_status").in("id", checkoutIds)
    : { data: [] };
  const { data: collectionEvents } = checkoutIds.length && canReadPayments
    ? await supabase.from("cod_collection_events").select("id,checkout_id,collected_amount,cumulative_collected,discrepancy_amount,collected_by,created_at,note").in("checkout_id", checkoutIds).order("created_at", { ascending: false })
    : { data: [] };
  const checkoutMap = new Map((checkouts ?? []).map((checkout) => [checkout.id, checkout]));
  const collectionEventsByCheckout = new Map<string, typeof collectionEvents>([]);
  for (const event of collectionEvents ?? []) {
    const existing = collectionEventsByCheckout.get(event.checkout_id) ?? [];
    collectionEventsByCheckout.set(event.checkout_id, [...existing, event]);
  }

  const filtered = (orders ?? []).filter((o) => !selectedStatus || selectedStatus === "all" || o.status === selectedStatus);
  const counts = (orders ?? []).reduce<Record<string, number>>((acc, order) => {
    acc[order.status] = (acc[order.status] ?? 0) + 1;
    return acc;
  }, {});

  return <main className="min-h-[calc(100vh-64px)] bg-[#f5f8f3] px-4 py-6 text-[#17351f] sm:px-6 lg:px-8 lg:py-8">
    <div className="mx-auto max-w-[1500px]">
      <header className="relative overflow-hidden rounded-[28px] bg-[#123b27] p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full border-[28px] border-white/5" />
        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[.2em] text-emerald-200">AGRIVA · ORDERS & FINANCE</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Orders & Delivery</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-50/90 sm:text-base">অর্ডারের ঠিকানা, COD-তে আদায়যোগ্য টাকা এবং delivery progress এক জায়গায় পরিচালনা করুন। Delivered মানেই টাকা আদায় হয়েছে—এমন ধরে নেওয়া হয় না।</p>
        </div>
      </header>
      {!canReadPayments && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">COD collection ledger ও reconciliation details hidden. The separate payments.read capability is required.</p>}

      {notice && <p role="status" className={`mt-5 rounded-xl border p-3 text-sm font-semibold ${notice === "saved" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
        {notice === "saved" ? "অর্ডারের অবস্থা আপডেট হয়েছে।" : notice === "collection-saved" ? "COD collection audit সংরক্ষিত হয়েছে।" : notice === "collection-error" ? "COD collection সংরক্ষণ করা যায়নি।" : notice === "invalid" ? "অর্ডার বা status সঠিক নয়।" : notice === "finance-disabled" ? "COD reconciliation সাময়িকভাবে বন্ধ। Audited secure workflow চালু হলে পুনরায় enable করা হবে।" : "অবস্থা আপডেট করা যায়নি। অর্ডার বন্ধ হয়ে থাকলে বা permission না থাকলে transition প্রত্যাখ্যাত হতে পারে।"}
      </p>}
      {ordersError && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">অর্ডার তালিকা লোড করা যায়নি। Database schema এবং admin access যাচাই করুন।</p>}

      <section aria-label="Order status filters" className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["all", "সব অর্ডার", (orders ?? []).length],
          ["processing", "নতুন / প্রসেসিং", (counts.processing ?? 0) + (counts.pending ?? 0)],
          ["shipped", "শিপড", counts.shipped ?? 0],
          ["delivered", "ডেলিভারি সম্পন্ন", counts.delivered ?? 0],
          ["cancelled", "বাতিল", counts.cancelled ?? 0],
          ["completed", "সম্পন্ন", counts.completed ?? 0],
        ].map(([key, label, count]) => <Link key={key} href={key === "all" ? "/admin/orders?status=all" : `/admin/orders?status=${key}`} className={`rounded-2xl border bg-white p-4 transition hover:border-emerald-700 ${selectedStatus === key || (!selectedStatus && key === "all") ? "border-emerald-800 ring-1 ring-emerald-800" : "border-[#dfe8dc]"}`}>
          <p className="text-xs font-bold text-[#68786b]">{label}</p><p className="mt-2 text-2xl font-black">{count}</p>
        </Link>)}
      </section>

      <section aria-label="Orders list" className="mt-6 space-y-4">
        {filtered.map((o) => {
          const address = o.shipping_address && typeof o.shipping_address === "object" && !Array.isArray(o.shipping_address) ? o.shipping_address as Record<string, unknown> : {};
          const buyerName = addressLine(address.fullName ?? address.name) || "নাম দেওয়া নেই";
          const phone = addressLine(address.phone);
          const district = addressLine(address.district ?? address.city);
          const fullAddress = [addressLine(address.division), district, addressLine(address.upazila), addressLine(address.unionOrArea ?? address.area ?? address.union), addressLine(address.villageRoadHouse ?? address.village ?? address.address), address.postalCode ? `পোস্ট কোড ${addressLine(address.postalCode)}` : ""].filter(Boolean).join(", ");
          const product = Array.isArray(o.products) ? o.products[0] : o.products;
          const status = o.status;
          const checkout = o.checkout_id ? checkoutMap.get(o.checkout_id) : null;
          const firstCheckoutOrder = !o.checkout_id || (orders ?? []).find((candidate) => candidate.checkout_id === o.checkout_id)?.id === o.id;
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
                {(orderTransitionOptions[status]?.length ?? 0) > 0 ? <form action={updateOrderStatus} className="mt-3 space-y-3">
                  <input type="hidden" name="orderId" value={o.id}/>
                  <label className="block text-xs font-bold text-[#647468]">নতুন status
                    <select name="status" defaultValue={orderTransitionOptions[status]?.[0]?.value ?? status} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 text-sm">
                      {(orderTransitionOptions[status] ?? []).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                  <button className="w-full rounded-xl bg-[#17452c] px-4 py-2.5 text-sm font-extrabold text-white">অবস্থা আপডেট করুন</button>
                </form> : <p className="mt-3 text-xs text-[#748074]">এই terminal status থেকে routine transition করা যাবে না।</p>}
                <p className="mt-3 text-xs leading-5 text-[#748074]">Status update database transition rules মেনে চলে। শুধু pending/processing অবস্থায় বাতিল করলে reserved stock ফেরত আসে; shipment-এর পর stock স্বয়ংক্রিয়ভাবে ফেরত আসে না।</p>
              </div>

              {checkout && firstCheckoutOrder && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 lg:col-span-3">
                <p className="text-sm font-extrabold">COD collection audit · Checkout #{String(checkout.id).slice(0, 8)}</p>
                <p className="mt-1 text-sm">Expected: ৳{Number(checkout.total_amount).toLocaleString("bn-BD")} · Status: {checkout.collection_status} · Payment: {checkout.payment_status}</p>
                {(collectionEventsByCheckout.get(checkout.id) ?? []).map((event) => <p key={event.id} className="mt-2 border-t border-amber-200 pt-2 text-xs leading-5 text-[#654b18]">
                  {new Date(event.created_at).toLocaleString("bn-BD", { timeZone: "Asia/Dhaka" })} · Admin {String(event.collected_by).slice(0, 8)} · আদায় ৳{Number(event.collected_amount).toLocaleString("bn-BD")} · মোট ৳{Number(event.cumulative_collected).toLocaleString("bn-BD")} · পার্থক্য ৳{Number(event.discrepancy_amount).toLocaleString("bn-BD")}{event.note ? ` · ${event.note}` : ""}
                </p>)}
                {checkout.payment_status !== "paid" && canReconcilePayments && <form action={recordCodCollection} className="mt-3 grid gap-2 sm:grid-cols-[1fr_1.5fr_auto]">
                  <input type="hidden" name="checkoutId" value={checkout.id}/>
                  <label className="text-xs font-bold">এবার আদায় (৳)<input required name="collectedAmount" type="number" min="0" step="0.01" className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm" placeholder="0.00"/></label>
                  <label className="text-xs font-bold">নোট / পার্থক্যের কারণ<input name="note" maxLength={500} className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm" placeholder="ঐচ্ছিক"/></label>
                  <button type="submit" className="self-end rounded-lg bg-[#17452c] px-4 py-2.5 text-sm font-bold text-white">আদায় রেকর্ড</button>
                </form>}
                {checkout.payment_status !== "paid" && !canReconcilePayments && <p className="mt-3 rounded-lg border border-amber-200 bg-white/70 p-3 text-xs leading-5 text-amber-900">COD collection entry is disabled until the audited server-side finance workflow is deployed.</p>}
              </div>}
            </div>
          </article>;
        })}
        {!ordersError && !orders?.length && <div className="rounded-2xl bg-white p-8 text-center text-sm text-[#647468]">এখনো কোনো অর্ডার নেই।</div>}
        {!ordersError && Boolean(orders?.length) && filtered.length === 0 && <div className="rounded-2xl bg-white p-8 text-center text-sm text-[#647468]">এই ফিল্টারে কোনো অর্ডার নেই।</div>}
      </section>

    </div>
  </main>;
}
