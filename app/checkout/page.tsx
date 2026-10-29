"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Item = { product_id: string; quantity: number; unit_price: number; name?: string };

export default function Checkout() {
  const [items, setItems] = useState<Item[]>([]);
  const [cartId, setCartId] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", address: "", city: "", area: "" });
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [codEnabled, setCodEnabled] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage("Please sign in before checkout.");
        setLoading(false);
        return;
      }
      const { data: settings } = await supabase.rpc("get_public_site_settings");
      const codSetting = (settings || []).find((setting: { key: string; value: string }) => setting.key === "cod_enabled");
      setCodEnabled(codSetting?.value === "true");

      const { data: cart } = await supabase.from("carts").select("id")
        .eq("user_id", user.id).eq("status", "active").maybeSingle();
      if (!cart) {
        setMessage("Your cart is empty.");
        setLoading(false);
        return;
      }
      setCartId(cart.id);
      const { data } = await supabase.from("cart_items")
        .select("product_id,quantity,unit_price").eq("cart_id", cart.id);
      const ids = (data || []).map((item) => item.product_id);
      const { data: products } = ids.length
        ? await supabase.from("products").select("id,name").in("id", ids)
        : { data: [] };
      const names = new Map((products || []).map((product) => [product.id, product.name]));
      setItems((data || []).map((item) => ({ ...item, name: names.get(item.product_id) || "Product" })));
      setLoading(false);
    })();
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!items.length || busy) return;
    if (!codEnabled) {
      setMessage("Cash on Delivery is currently disabled. Please contact support.");
      return;
    }

    setBusy(true);
    setMessage("");
    const placed: string[] = [];
    const placedProductIds = new Set<string>();
    const failed: string[] = [];
    const cartSyncFailed: string[] = [];

    try {
      for (const item of items) {
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: item.product_id,
            quantity: item.quantity,
            paymentMethod: "cod",
            shippingAddress: {
              fullName: form.name,
              phone: form.phone,
              district: form.city,
              address: [form.address, form.area].filter(Boolean).join(", "),
            },
          }),
        });
        const result = await response.json();
        if (!response.ok) {
          failed.push(item.name || item.product_id);
          continue;
        }

        placed.push(result.orderId);
        placedProductIds.add(item.product_id);
        // Remove each successfully ordered cart line immediately, so a later item
        // failing does not leave already-purchased items in the active cart.
        const { error: removeError } = await supabase.from("cart_items").delete()
          .eq("cart_id", cartId).eq("product_id", item.product_id);
        if (removeError) cartSyncFailed.push(item.name || item.product_id);
      }

      if (placedProductIds.size) {
        // Only remove lines whose order was successfully created from the current UI.
        setItems((current) => current.filter((item) => !placedProductIds.has(item.product_id)));
      }

      if (failed.length || cartSyncFailed.length) {
        const orderList = placed.map((id) => id.slice(0, 8)).join(", ");
        setMessage(
          `Placed orders: ${orderList || "none"}. ${failed.length ? `Could not place: ${failed.join(", ")}. ` : ""}` +
          `${cartSyncFailed.length ? "Some cart lines could not be synchronized. Check Orders before trying again." : "Successful orders were removed from the cart; remaining items can be retried."}`,
        );
      } else if (placed.length) {
        setMessage(`Order confirmed. ${placed.length} order${placed.length === 1 ? "" : "s"} placed with Cash on Delivery.`);
      } else {
        setMessage("No orders were placed. Please check the remaining items and try again.");
      }
    } catch {
      // Some earlier item requests may already have committed an order before a later
      // request failed at the network layer. Keep those known-successful items out of
      // this page's retry set and direct the buyer to verify Orders first.
      if (placedProductIds.size) {
        setItems((current) => current.filter((item) => !placedProductIds.has(item.product_id)));
      }
      const orderList = placed.map((id) => id.slice(0, 8)).join(", ");
      setMessage(
        `Checkout was interrupted. ${orderList ? `Orders already placed: ${orderList}. ` : ""}Check your Orders page before retrying to avoid duplicate orders.`,
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <main className="min-h-screen bg-[#f5f7f2] px-6 py-12"><div className="mx-auto max-w-3xl rounded-3xl bg-white p-8">Loading checkout…</div></main>;

  return (
    <main className="min-h-screen bg-[#f5f7f2] px-6 py-12 text-[#17351f]">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA Checkout</p>
        <h1 className="mt-3 text-4xl font-black">Delivery & payment</h1>
        {items.length > 0 && <div className="mt-6 rounded-2xl bg-white p-5">
          <p className="font-bold">{items.length} item type{items.length === 1 ? "" : "s"} in your cart</p>
          {items.map((item) => <p key={item.product_id} className="mt-2 text-sm text-[#647468]">{item.name} × {item.quantity} · ৳{(Number(item.unit_price) * item.quantity).toFixed(2)}</p>)}
        </div>}
        {message && <div role="status" className="mt-6 rounded-xl bg-[#eef5ed] p-4 text-sm font-semibold">{message}</div>}
        {items.length > 0 && <form onSubmit={submit} className="mt-6 space-y-4 rounded-3xl bg-white p-7 shadow-sm">
          <Field label="Full name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <Field label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
          <Field label="Full address" value={form.address} onChange={(value) => setForm({ ...form, address: value })} />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="District / City" value={form.city} onChange={(value) => setForm({ ...form, city: value })} />
            <Field label="Area / Upazila" value={form.area} onChange={(value) => setForm({ ...form, area: value })} />
          </div>
          <div className="rounded-2xl border p-4"><b>Cash on Delivery</b><p className="mt-1 text-sm text-[#647468]">{codEnabled ? "Pay when your order is delivered. Online payment will be enabled later." : "Cash on Delivery is currently disabled by the site administrator."}</p></div>
          <button disabled={busy || !codEnabled} className="w-full rounded-xl bg-[#17351f] px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? "Placing order…" : "Place COD order"}</button>
        </form>}
      </div>
    </main>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="text-sm font-bold">{label}</span><input required value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 outline-none" /></label>;
}
