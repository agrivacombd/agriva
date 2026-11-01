"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { trackAnalyticsEvent } from "@/lib/analytics";

export default function CheckoutButton({ productId, disabled }: { productId: string; disabled?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [loginRequired, setLoginRequired] = useState(false);
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("");
  const [upazila, setUpazila] = useState("");
  const [address, setAddress] = useState("");

  async function addToCart() {
    if (disabled || addingToCart) return;
    setAddingToCart(true);
    setLoginRequired(false);
    setMessage("");
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) {
        setLoginRequired(true);
        setMessage("কার্টে পণ্য যোগ করতে আগে লগইন করুন।");
        return;
      }

      const { data: product, error: productError } = await supabase
        .from("products")
        .select("id,price,stock,status")
        .eq("id", productId)
        .maybeSingle();
      if (productError) throw productError;
      if (!product || product.status !== "active") {
        setMessage("এই পণ্যটি এখন কেনার জন্য উপলভ্য নয়।");
        return;
      }
      const stock = Number(product.stock || 0);
      if (stock < 1) {
        setMessage("পণ্যটি বর্তমানে স্টকে নেই।");
        return;
      }
      const price = Number(product.price);
      if (product.price === null || product.price === undefined || !Number.isFinite(price) || price <= 0) {
        setMessage("পণ্যের মূল্য যাচাই করা যাচ্ছে না। পরে আবার চেষ্টা করুন।");
        return;
      }

      let { data: cart, error: cartError } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();
      if (cartError) throw cartError;

      if (!cart) {
        const { data: createdCart, error: createCartError } = await supabase
          .from("carts")
          .insert({ user_id: user.id, status: "active" })
          .select("id")
          .single();
        if (createCartError) throw createCartError;
        cart = createdCart;
      }

      const { data: existingItem, error: itemLookupError } = await supabase
        .from("cart_items")
        .select("id,quantity")
        .eq("cart_id", cart.id)
        .eq("product_id", productId)
        .maybeSingle();
      if (itemLookupError) throw itemLookupError;

      const nextQuantity = Number(existingItem?.quantity || 0) + 1;
      if (nextQuantity > stock) {
        setMessage(`আপনার কার্টে ইতিমধ্যে ${existingItem?.quantity || 0}টি আছে। সর্বোচ্চ ${stock}টি যোগ করা যাবে।`);
        return;
      }

      const { error: saveError } = existingItem
        ? await supabase.from("cart_items").update({
            quantity: nextQuantity,
            unit_price: price,
            updated_at: new Date().toISOString(),
          }).eq("id", existingItem.id)
        : await supabase.from("cart_items").insert({
            cart_id: cart.id,
            product_id: productId,
            quantity: 1,
            unit_price: price,
          });
      if (saveError) throw saveError;

      trackAnalyticsEvent("add_to_cart", {
        currency: "BDT",
        value: price,
        item_id: productId,
        quantity: 1,
      });
      router.push("/cart");
    } catch (error) {
      console.error("Add to cart failed:", error);
      setMessage("কার্টে পণ্য যোগ করা যায়নি। লগইন ও স্টকের তথ্য যাচাই করে আবার চেষ্টা করুন।");
    } finally {
      setAddingToCart(false);
    }
  }

  async function checkout() {
    if (!fullName.trim() || !phone.trim() || !district.trim() || !upazila.trim() || !address.trim()) {
      setMessage("অর্ডার করতে নাম, মোবাইল নম্বর, জেলা, উপজেলা ও সম্পূর্ণ ঠিকানা পূরণ করুন।");
      return;
    }
    const normalizedPhone = phone.trim().replace(/[\s()-]/g, "");
    if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(normalizedPhone)) {
      setMessage("সঠিক মোবাইল নম্বর দিন। উদাহরণ: 01XXXXXXXXX");
      return;
    }

    setLoading(true);
    setMessage("");
    setOrderId("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          quantity: 1,
          shippingAddress: { fullName: fullName.trim(), phone: phone.trim(), district: district.trim(), upazila: upazila.trim(), address: address.trim() },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setMessage(data.error || "অর্ডার তৈরি করা যায়নি। আবার চেষ্টা করুন।");
      else {
        setOrderId(String(data.orderId || ""));
        const orderTotal = Number(data.total);
        trackAnalyticsEvent("marketplace_order_placed", {
          currency: "BDT",
          ...(Number.isFinite(orderTotal) ? { value: orderTotal } : {}),
          item_id: productId,
          quantity: 1,
        });
        setMessage(`অর্ডার তৈরি হয়েছে। মোট মূল্য ৳${Number(data.total).toLocaleString("bn-BD")}।`);
      }
    } catch {
      setMessage("সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 space-y-4">
      <button
        type="button"
        disabled={disabled || addingToCart}
        onClick={addToCart}
        className="w-full rounded-2xl border-2 border-[#17351f] bg-white px-6 py-4 font-black text-[#17351f] transition hover:bg-[#eef5ed] focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {addingToCart ? "কার্টে যোগ হচ্ছে..." : disabled ? "স্টকে নেই" : "কার্টে যোগ করুন"}
      </button>
      <p className="text-center text-xs text-slate-500">কার্টে পণ্য যোগ করে পরিমাণ যাচাই করে Checkout সম্পন্ন করুন।</p>
      <div className="rounded-2xl border border-emerald-950/10 bg-[#fbfcf7] p-4 sm:p-5">
        <h2 className="text-lg font-black text-[#17351f]">সরাসরি ক্যাশ অন ডেলিভারি</h2>
        <p className="mt-1 text-sm text-slate-600">কার্ট ব্যবহার না করে চাইলে এই পণ্যটি সরাসরি অর্ডার করতে পারবেন। পেমেন্ট: পণ্য হাতে পেয়ে।</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-bold text-[#17351f]">আপনার নাম
            <input value={fullName} onChange={e => setFullName(e.target.value)} autoComplete="name" maxLength={100} required placeholder="পূর্ণ নাম" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" />
          </label>
          <label className="text-sm font-bold text-[#17351f]">মোবাইল নম্বর
            <input value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" type="tel" inputMode="tel" maxLength={16} required placeholder="01XXXXXXXXX" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" />
          </label>
          <label className="text-sm font-bold text-[#17351f] sm:col-span-2">জেলা নির্বাচন করুন
            <select value={district} onChange={e => setDistrict(e.target.value)} autoComplete="address-level1" required className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"><option value="">জেলা বেছে নিন</option>{["ঢাকা","গাজীপুর","নারায়ণগঞ্জ","নরসিংদী","মুন্সিগঞ্জ","মানিকগঞ্জ","টাঙ্গাইল","কিশোরগঞ্জ","ফরিদপুর","গোপালগঞ্জ","মাদারীপুর","শরীয়তপুর","রাজবাড়ী","চট্টগ্রাম","কক্সবাজার","কুমিল্লা","ফেনী","নোয়াখালী","লক্ষ্মীপুর","চাঁদপুর","ব্রাহ্মণবাড়িয়া","রাঙামাটি","খাগড়াছড়ি","বান্দরবান","রাজশাহী","বগুড়া","পাবনা","সিরাজগঞ্জ","নাটোর","নওগাঁ","জয়পুরহাট","চাঁপাইনবাবগঞ্জ","রংপুর","দিনাজপুর","গাইবান্ধা","কুড়িগ্রাম","লালমনিরহাট","নীলফামারী","পঞ্চগড়","ঠাকুরগাঁও","খুলনা","যশোর","সাতক্ষীরা","বাগেরহাট","নড়াইল","মাগুরা","ঝিনাইদহ","কুষ্টিয়া","চুয়াডাঙ্গা","মেহেরপুর","বরিশাল","পটুয়াখালী","ভোলা","পিরোজপুর","বরগুনা","ঝালকাঠি","সিলেট","মৌলভীবাজার","হবিগঞ্জ","সুনামগঞ্জ","ময়মনসিংহ","জামালপুর","শেরপুর","নেত্রকোণা"].map(name => <option key={name} value={name}>{name}</option>)}</select>
          </label>
          <label className="text-sm font-bold text-[#17351f] sm:col-span-2">উপজেলা / থানা
            <input value={upazila} onChange={e => setUpazila(e.target.value)} autoComplete="address-level2" maxLength={100} required placeholder="আপনার উপজেলা বা থানা লিখুন" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" />
          </label>
          <label className="text-sm font-bold text-[#17351f] sm:col-span-2">সম্পূর্ণ ঠিকানা
            <textarea value={address} onChange={e => setAddress(e.target.value)} autoComplete="street-address" maxLength={500} required rows={3} placeholder="গ্রাম/এলাকা + উপজেলা + বাড়ি/রোড (এক লাইনে লিখুন)" className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" />
          </label>
        </div>
      </div>
      <button type="button" disabled={disabled || loading} onClick={checkout} className="w-full rounded-2xl bg-[#17351f] px-6 py-4 font-black text-white transition hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
        {loading ? "অর্ডার তৈরি হচ্ছে..." : disabled ? "স্টকে নেই" : "ক্যাশ অন ডেলিভারিতে অর্ডার করুন"}
      </button>
      {message && <p role="status" aria-live="polite" className="break-words rounded-xl bg-[#eef5ed] p-3 text-sm text-[#17351f]">{message}</p>}
      {loginRequired && <Link href="/login?next=%2Fcart" className="inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">লগইন করে কার্টে ফিরুন</Link>}
      {orderId && <Link href="/orders" className="inline-flex w-full items-center justify-center rounded-xl border border-emerald-800 px-5 py-3 font-bold text-emerald-900 hover:bg-emerald-50">আমার অর্ডার দেখুন</Link>}
    </div>
  );
}
