"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { ArrowLeft, CalendarDays, MapPin, Package, Plus, RefreshCw, ShieldCheck, Truck, X } from "lucide-react";

type Vehicle = "van" | "pickup" | "truck" | "covered" | "refrigerated";
type Unit = "kg" | "maund" | "ton" | "bag";
type Booking = {
  id: string; customer_id: string; crop_name: string; quantity: number; unit: Unit; origin: string; destination: string;
  vehicle_type: Vehicle; pickup_date: string; loading_help: string; payment_preference: string; budget: number | null;
  notes: string; status: string; selected_partner_id: string | null; selected_quote_id: string | null; created_at: string;
};
type Partner = {
  user_id: string; full_name: string; phone: string; district: string; vehicle_type: Vehicle; capacity_kg: number;
  vehicle_registration: string; notes: string; verification_status: string;
};
type Quote = { id: string; booking_id: string; partner_id: string; price: number; eta_text: string; loading_fee: number; note: string; status: string; created_at: string; };

const vehicleLabels: Record<Vehicle, string> = { van: "ভ্যান / ছোট যান", pickup: "পিকআপ", truck: "ট্রাক", covered: "কাভার্ড ভ্যান", refrigerated: "রেফ্রিজারেটেড গাড়ি" };
const unitLabels: Record<Unit, string> = { kg: "কেজি", maund: "মণ", ton: "টন", bag: "বস্তা" };
const bn = (n: number) => new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 2 }).format(n);
const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10";
const labelClass = "block text-sm font-semibold text-slate-700";

export default function TransportBooking() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [mineOnly, setMineOnly] = useState(false);
  const [crop, setCrop] = useState("আলু");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<Unit>("kg");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicle, setVehicle] = useState<Vehicle>("pickup");
  const [pickupDate, setPickupDate] = useState("");
  const [loadingHelp, setLoadingHelp] = useState("discuss");
  const [payment, setPayment] = useState("discuss");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("নওগাঁ");
  const [capacity, setCapacity] = useState("");
  const [registration, setRegistration] = useState("");
  const [partnerNotes, setPartnerNotes] = useState("");
  const [quoteFor, setQuoteFor] = useState<Booking | null>(null);
  const [quotePrice, setQuotePrice] = useState("");
  const [quoteEta, setQuoteEta] = useState("আজ/আগামীকাল");
  const [quoteLoadingFee, setQuoteLoadingFee] = useState("0");
  const [quoteNote, setQuoteNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);
    if (user) {
      const [partnerResult, bookingResult, quoteResult] = await Promise.all([
        supabase.from("transport_partners").select("user_id,full_name,phone,district,vehicle_type,capacity_kg,vehicle_registration,notes,verification_status").eq("user_id", user.id).maybeSingle(),
        supabase.from("transport_bookings").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("transport_quotes").select("*").order("created_at", { ascending: false }).limit(300),
      ]);
      if (!partnerResult.error && partnerResult.data) setPartner(partnerResult.data as Partner);
      else setPartner(null);
      if (!bookingResult.error) setBookings((bookingResult.data ?? []) as Booking[]);
      else setNotice("বুকিং লোড করা যায়নি। ডেটাবেস মাইগ্রেশন প্রয়োগ হয়েছে কি না যাচাই করুন।");
      if (!quoteResult.error) setQuotes((quoteResult.data ?? []) as Quote[]);
    } else {
      setPartner(null); setBookings([]); setQuotes([]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  async function requireUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login?next=%2Ftransport"; return null; }
    return user;
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const user = await requireUser(); if (!user) return;
    if (origin.trim().toLocaleLowerCase() === destination.trim().toLocaleLowerCase()) { setNotice("পিকআপ ও গন্তব্য আলাদা হতে হবে।"); return; }
    setBusy(true); setNotice("");
    const { error } = await supabase.from("transport_bookings").insert({
      customer_id: user.id, crop_name: crop.trim(), quantity: Number(quantity), unit, origin: origin.trim(),
      destination: destination.trim(), vehicle_type: vehicle, pickup_date: pickupDate, loading_help: loadingHelp,
      payment_preference: payment, budget: budget ? Number(budget) : null, notes: notes.trim(), status: "open",
    });
    setBusy(false);
    if (error) { setNotice("বুকিং তৈরি হয়নি। তথ্য ও ডেটাবেস মাইগ্রেশন যাচাই করে আবার চেষ্টা করুন।"); return; }
    setNotice("পরিবহনের অনুরোধ প্রকাশ হয়েছে। যাচাইকৃত পার্টনাররা অফার দিতে পারবেন।");
    setShowBookingForm(false); setMineOnly(true); setCrop("আলু"); setQuantity(""); setOrigin(""); setDestination(""); setPickupDate(""); setBudget(""); setNotes("");
    await load();
  }

  async function submitPartner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const user = await requireUser(); if (!user) return;
    setBusy(true); setNotice("");
    const { error } = await supabase.from("transport_partners").insert({
      user_id: user.id, full_name: fullName.trim(), phone: phone.trim(), district, vehicle_type: vehicle,
      capacity_kg: Number(capacity), vehicle_registration: registration.trim(), notes: partnerNotes.trim(), verification_status: "pending",
    });
    setBusy(false);
    if (error) { setNotice(error.code === "23505" ? "আপনার পার্টনার আবেদন আগেই জমা হয়েছে।" : "আবেদন জমা হয়নি। তথ্য যাচাই করে আবার চেষ্টা করুন।"); return; }
    setNotice("পার্টনার আবেদন জমা হয়েছে। যাচাই সম্পন্ন না হওয়া পর্যন্ত বুকিংয়ে অফার দেওয়া যাবে না।");
    setShowPartnerForm(false); await load();
  }

  async function submitQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!quoteFor) return;
    const user = await requireUser(); if (!user) return;
    setBusy(true); setNotice("");
    const { error } = await supabase.from("transport_quotes").insert({
      booking_id: quoteFor.id, partner_id: user.id, price: Number(quotePrice), eta_text: quoteEta,
      loading_fee: Number(quoteLoadingFee || 0), note: quoteNote.trim(), status: "pending",
    });
    setBusy(false);
    if (error) { setNotice(error.code === "23505" ? "এই বুকিংয়ে আপনি আগেই অফার দিয়েছেন।" : "অফার পাঠানো যায়নি। আপনার পার্টনার যাচাই করা হয়েছে কি না দেখুন।"); return; }
    setQuoteFor(null); setQuotePrice(""); setQuoteNote(""); setNotice("ভাড়ার অফার পাঠানো হয়েছে।"); await load();
  }

  async function acceptQuote(booking: Booking, quote: Quote) {
    if (!userId || booking.customer_id !== userId || booking.status !== "open") return;
    setBusy(true); setNotice("");
    const { error: bookingError } = await supabase.from("transport_bookings").update({
      status: "booked", selected_quote_id: quote.id, selected_partner_id: quote.partner_id,
    }).eq("id", booking.id).eq("customer_id", userId).eq("status", "open");
    if (bookingError) { setBusy(false); setNotice("অফার গ্রহণ করা যায়নি। আবার লোড করে চেষ্টা করুন।"); return; }
    const { error: quoteError } = await supabase.from("transport_quotes").update({ status: "accepted" }).eq("id", quote.id);
    setBusy(false);
    if (quoteError) { setNotice("বুকিং নিশ্চিত হয়েছে, তবে অফারের স্ট্যাটাস আপডেট হয়নি। অ্যাডমিনকে জানান।"); await load(); return; }
    setNotice("অফার গ্রহণ করা হয়েছে। বুকিংয়ের বিস্তারিত ও যোগাযোগের তথ্য এখন সংশ্লিষ্ট দুই পক্ষ দেখতে পারবেন।"); await load();
  }

  async function updateStatus(booking: Booking, status: string) {
    if (!userId || (booking.customer_id !== userId && booking.selected_partner_id !== userId)) return;
    setBusy(true); setNotice("");
    const { error } = await supabase.from("transport_bookings").update({ status }).eq("id", booking.id);
    setBusy(false);
    if (error) { setNotice("স্ট্যাটাস আপডেট হয়নি। বুকিংয়ের অনুমতি যাচাই করুন।"); return; }
    setNotice("বুকিংয়ের অবস্থা আপডেট হয়েছে।"); await load();
  }

  const shownBookings = bookings.filter((b) => mineOnly ? b.customer_id === userId : b.status === "open" || b.selected_partner_id === userId);
  const dateLabel = (value: string) => new Date(value + "T00:00:00").toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" });

  return (
    <main className="min-h-screen bg-[#f5f8f1] text-[#173629]">
      <section className="bg-gradient-to-br from-[#103f2b] via-[#145b3c] to-[#24734a] text-white">
        <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-100 hover:text-white"><ArrowLeft size={16} /> AGRIVA হোম</Link>
          <div className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-extrabold"><Truck size={15} /> AGRIVA TRANSPORT</p>
              <h1 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">কৃষিপণ্য পরিবহন বুকিং</h1>
              <p className="mt-3 text-sm leading-7 text-emerald-50/90 sm:text-base">ফসল কোথা থেকে কোথায় নেবেন জানান, যাচাইকৃত পরিবহন পার্টনারদের ভাড়ার অফার তুলনা করুন এবং উপযুক্ত গাড়ি বেছে নিন।</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { setShowBookingForm(v => !v); setShowPartnerForm(false); setQuoteFor(null); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-lime-300 px-4 py-3 text-sm font-extrabold text-[#173629]"><Plus size={17} /> বুকিং দিন</button>
              <button onClick={() => { setShowPartnerForm(v => !v); setShowBookingForm(false); setQuoteFor(null); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/30 px-4 py-3 text-sm font-bold text-white"><Truck size={17} /> পরিবহন পার্টনার হন</button>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4"><p className="text-2xl font-black">{bn(bookings.filter(b => b.status === "open").length)}</p><p className="mt-1 text-sm text-emerald-50/80">খোলা বুকিং</p></div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4"><p className="text-2xl font-black">{bn(quotes.filter(q => q.partner_id === userId).length)}</p><p className="mt-1 text-sm text-emerald-50/80">আপনার অফার</p></div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4"><p className="text-2xl font-black">{partner?.verification_status === "verified" ? "যাচাইকৃত" : partner?.verification_status === "pending" ? "যাচাই চলছে" : "পার্টনার নন"}</p><p className="mt-1 text-sm text-emerald-50/80">পার্টনার স্ট্যাটাস</p></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {notice && <div role="status" className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900"><span>{notice}</span><button aria-label="বার্তা বন্ধ করুন" onClick={() => setNotice("")}><X size={17} /></button></div>}
        {(showBookingForm || showPartnerForm || quoteFor) && <div className="mb-7 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-7">
          {showBookingForm && <form onSubmit={submitBooking}>
            <h2 className="text-xl font-black">নতুন পরিবহন বুকিং</h2><p className="mt-1 text-sm text-slate-500">বুকিং প্রকাশের পর যাচাইকৃত পার্টনাররা ভাড়ার প্রস্তাব দিতে পারবেন।</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className={labelClass}>পণ্যের নাম<input className={inputClass} required maxLength={100} value={crop} onChange={e => setCrop(e.target.value)} /></label>
              <label className={labelClass}>পরিমাণ<input className={inputClass} required type="number" min="0.01" step="0.01" value={quantity} onChange={e => setQuantity(e.target.value)} /></label>
              <label className={labelClass}>একক<select className={inputClass} value={unit} onChange={e => setUnit(e.target.value as Unit)}>{Object.entries(unitLabels).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>
              <label className={labelClass}>পণ্য তোলার স্থান<input className={inputClass} required minLength={3} maxLength={240} value={origin} onChange={e => setOrigin(e.target.value)} placeholder="গ্রাম / বাজার / উপজেলা / জেলা" /></label>
              <label className={labelClass}>গন্তব্য<input className={inputClass} required minLength={3} maxLength={240} value={destination} onChange={e => setDestination(e.target.value)} placeholder="গ্রাম / বাজার / উপজেলা / জেলা" /></label>
              <label className={labelClass}>গাড়ির ধরন<select className={inputClass} value={vehicle} onChange={e => setVehicle(e.target.value as Vehicle)}>{Object.entries(vehicleLabels).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>
              <label className={labelClass}>পণ্য তোলার তারিখ<input className={inputClass} required type="date" min={new Date().toISOString().slice(0,10)} value={pickupDate} onChange={e => setPickupDate(e.target.value)} /></label>
              <label className={labelClass}>আনুমানিক বাজেট (ঐচ্ছিক, টাকা)<input className={inputClass} type="number" min="1" step="1" value={budget} onChange={e => setBudget(e.target.value)} /></label>
              <label className={labelClass}>লোডিং / আনলোডিং<select className={inputClass} value={loadingHelp} onChange={e => setLoadingHelp(e.target.value)}><option value="self">নিজেরা করব</option><option value="partner">পার্টনারের সাহায্য লাগবে</option><option value="discuss">আলোচনা করে ঠিক করব</option></select></label>
              <label className={labelClass}>পেমেন্ট পছন্দ<select className={inputClass} value={payment} onChange={e => setPayment(e.target.value)}><option value="advance">আগে</option><option value="delivery">পণ্য পৌঁছানোর পর</option><option value="split">অগ্রিম + বাকি পরে</option><option value="discuss">আলোচনা সাপেক্ষে</option></select></label>
            </div>
            <label className={labelClass + " mt-4"}>বিশেষ নির্দেশনা<textarea className={inputClass} maxLength={2000} rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="যেমন: বৃষ্টির পানি থেকে সুরক্ষা দরকার" /></label>
            <div className="mt-5 flex gap-3"><button disabled={busy} className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-extrabold text-white disabled:opacity-60">{busy ? "জমা হচ্ছে..." : "বুকিং প্রকাশ করুন"}</button><button type="button" onClick={() => setShowBookingForm(false)} className="rounded-xl border px-5 py-3 text-sm font-bold">বাতিল</button></div>
          </form>}
          {showPartnerForm && <form onSubmit={submitPartner}>
            <h2 className="text-xl font-black">পরিবহন পার্টনার আবেদন</h2><p className="mt-1 text-sm text-slate-500">নিবন্ধনের পর অ্যাডমিন কাগজপত্র যাচাই করবেন। অনুমোদনের আগে অফার দেওয়া যাবে না।</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className={labelClass}>নাম<input className={inputClass} required minLength={2} maxLength={120} value={fullName} onChange={e => setFullName(e.target.value)} /></label>
              <label className={labelClass}>ফোন<input className={inputClass} required minLength={6} maxLength={30} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="01XXXXXXXXX" /></label>
              <label className={labelClass}>জেলা<input className={inputClass} required value={district} onChange={e => setDistrict(e.target.value)} /></label>
              <label className={labelClass}>গাড়ির ধরন<select className={inputClass} value={vehicle} onChange={e => setVehicle(e.target.value as Vehicle)}>{Object.entries(vehicleLabels).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>
              <label className={labelClass}>সর্বোচ্চ ধারণক্ষমতা (কেজি)<input className={inputClass} required type="number" min="1" step="1" value={capacity} onChange={e => setCapacity(e.target.value)} /></label>
              <label className={labelClass}>গাড়ির রেজিস্ট্রেশন নম্বর<input className={inputClass} required maxLength={40} value={registration} onChange={e => setRegistration(e.target.value)} /></label>
            </div>
            <label className={labelClass + " mt-4"}>অতিরিক্ত তথ্য<textarea className={inputClass} rows={2} maxLength={1000} value={partnerNotes} onChange={e => setPartnerNotes(e.target.value)} /></label>
            <div className="mt-5 flex gap-3"><button disabled={busy} className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-extrabold text-white disabled:opacity-60">{busy ? "জমা হচ্ছে..." : "যাচাইয়ের জন্য জমা দিন"}</button><button type="button" onClick={() => setShowPartnerForm(false)} className="rounded-xl border px-5 py-3 text-sm font-bold">বাতিল</button></div>
          </form>}
          {quoteFor && <form onSubmit={submitQuote}>
            <h2 className="text-xl font-black">ভাড়ার অফার দিন</h2><p className="mt-1 text-sm text-slate-500">{quoteFor.crop_name} · {quoteFor.origin} → {quoteFor.destination}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className={labelClass}>মোট ভাড়া (টাকা)<input className={inputClass} required type="number" min="1" step="1" value={quotePrice} onChange={e => setQuotePrice(e.target.value)} /></label>
              <label className={labelClass}>পৌঁছানোর সময়<input className={inputClass} required maxLength={120} value={quoteEta} onChange={e => setQuoteEta(e.target.value)} /></label>
              <label className={labelClass}>লোডিং খরচ (টাকা)<input className={inputClass} required type="number" min="0" step="1" value={quoteLoadingFee} onChange={e => setQuoteLoadingFee(e.target.value)} /></label>
            </div>
            <label className={labelClass + " mt-4"}>অফারের শর্ত<textarea className={inputClass} rows={2} maxLength={1000} value={quoteNote} onChange={e => setQuoteNote(e.target.value)} /></label>
            <div className="mt-5 flex gap-3"><button disabled={busy} className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-extrabold text-white disabled:opacity-60">{busy ? "পাঠানো হচ্ছে..." : "অফার পাঠান"}</button><button type="button" onClick={() => setQuoteFor(null)} className="rounded-xl border px-5 py-3 text-sm font-bold">বাতিল</button></div>
          </form>}
        </div>}

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black">{mineOnly ? "আমার বুকিং" : "খোলা পরিবহন বুকিং"}</h2><p className="mt-1 text-sm text-slate-500">ভাড়া, সময় ও শর্ত তুলনা করে সিদ্ধান্ত নিন।</p></div><div className="flex gap-2"><button onClick={() => setMineOnly(v => !v)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold">{mineOnly ? "সব খোলা বুকিং" : "আমার বুকিং"}</button><button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold"><RefreshCw size={15} /> রিফ্রেশ</button></div></div>
        {loading ? <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">বুকিং লোড হচ্ছে...</div> : shownBookings.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center"><Truck className="mx-auto text-emerald-700" size={34} /><h3 className="mt-3 text-lg font-black">{mineOnly ? "আপনার কোনো বুকিং নেই" : "এখনো কোনো খোলা বুকিং নেই"}</h3><p className="mt-2 text-sm text-slate-500">নতুন পরিবহন বুকিং দিন অথবা পরে আবার দেখুন।</p><button onClick={() => { setShowBookingForm(true); setShowPartnerForm(false); }} className="mt-4 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white">বুকিং দিন</button></div> :
          <div className="grid gap-4 lg:grid-cols-2">{shownBookings.map(booking => {
            const own = booking.customer_id === userId;
            const ownQuotes = quotes.filter(q => q.booking_id === booking.id);
            const chosenQuote = ownQuotes.find(q => q.id === booking.selected_quote_id);
            return <article key={booking.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-800">{booking.crop_name}</span><h3 className="mt-3 text-2xl font-black">{bn(Number(booking.quantity))} {unitLabels[booking.unit]}</h3><p className="mt-1 text-sm font-bold text-emerald-800">{vehicleLabels[booking.vehicle_type]}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{({open:"অফার অপেক্ষায়",booked:"বুকিং নিশ্চিত",picked_up:"পণ্য তোলা হয়েছে",in_transit:"পথে আছে",delivered:"পৌঁছে গেছে",cancelled:"বাতিল"})[booking.status] ?? booking.status}</span></div>
              <div className="mt-4 grid gap-2 text-sm text-slate-600"><p className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 text-emerald-700" />{booking.origin} → {booking.destination}</p><p className="flex items-start gap-2"><CalendarDays size={16} className="mt-0.5 text-emerald-700" />{dateLabel(booking.pickup_date)}</p><p className="flex items-start gap-2"><Package size={16} className="mt-0.5 text-emerald-700" />{booking.loading_help === "self" ? "লোডিং নিজেরা" : booking.loading_help === "partner" ? "লোডিং সহায়তা লাগবে" : "লোডিং আলোচনা সাপেক্ষে"} · {booking.payment_preference === "advance" ? "আগে পেমেন্ট" : booking.payment_preference === "delivery" ? "ডেলিভারির পর" : booking.payment_preference === "split" ? "অগ্রিম + বাকি পরে" : "পেমেন্ট আলোচনা সাপেক্ষে"}</p></div>
              {booking.notes && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">{booking.notes}</p>}
              {booking.budget && <p className="mt-3 text-sm font-semibold text-slate-600">বাজেট: ৳{bn(Number(booking.budget))}</p>}
              {own && <div className="mt-4 border-t border-slate-100 pt-4"><p className="text-sm font-extrabold">ভাড়ার অফার ({bn(ownQuotes.length)})</p>{ownQuotes.length === 0 ? <p className="mt-2 text-sm text-slate-500">এখনো অফার আসেনি।</p> : <div className="mt-3 space-y-3">{ownQuotes.map(q => <div key={q.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><strong>৳{bn(Number(q.price))}</strong><span className="text-xs text-slate-500">{q.status === "accepted" ? "গৃহীত" : q.status === "rejected" ? "প্রত্যাখ্যাত" : "অপেক্ষমাণ"}</span></div><p className="mt-1 text-sm text-slate-600">পৌঁছানোর সময়: {q.eta_text} · লোডিং: ৳{bn(Number(q.loading_fee))}</p>{q.note && <p className="mt-2 text-sm text-slate-500">{q.note}</p>}{booking.status === "open" && q.status === "pending" && <button disabled={busy} onClick={() => void acceptQuote(booking,q)} className="mt-3 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white">এই অফার গ্রহণ করুন</button>}</div>)}</div>}</div>}
              {!own && partner?.verification_status === "verified" && booking.status === "open" && !ownQuotes.some(q => q.partner_id === userId) && <button onClick={() => { setQuoteFor(booking); setShowBookingForm(false); setShowPartnerForm(false); }} className="mt-4 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-extrabold text-white">ভাড়ার অফার দিন</button>}
              {booking.status === "booked" && booking.selected_partner_id === userId && <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm"><p className="font-bold">বুকিং নিশ্চিত হয়েছে</p>{booking.selected_quote_id && chosenQuote && <p className="mt-1">সম্মত ভাড়া: ৳{bn(Number(chosenQuote.price))} + লোডিং ৳{bn(Number(chosenQuote.loading_fee))}</p>}<p className="mt-2 text-slate-600">কৃষকের সঙ্গে যোগাযোগের আগে বুকিংয়ের শর্ত ও যোগাযোগের ব্যবস্থা নিশ্চিত করুন।</p><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => void updateStatus(booking,"picked_up")} className="rounded-lg bg-white px-3 py-2 text-xs font-bold">পণ্য তোলা হয়েছে</button><button onClick={() => void updateStatus(booking,"in_transit")} className="rounded-lg bg-white px-3 py-2 text-xs font-bold">পথে আছে</button><button onClick={() => void updateStatus(booking,"delivered")} className="rounded-lg bg-white px-3 py-2 text-xs font-bold">পৌঁছে গেছে</button></div></div>}
              {booking.selected_partner_id && (booking.customer_id === userId || booking.selected_partner_id === userId) && <p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><ShieldCheck size={14} /> নির্বাচিত পরিবহন পার্টনার: {booking.selected_partner_id === userId ? "আপনি" : "নির্বাচিত পার্টনার"}</p>}
              {own && ["booked","picked_up","in_transit"].includes(booking.status) && <div className="mt-3 flex flex-wrap gap-2">{booking.status !== "delivered" && <button onClick={() => void updateStatus(booking,"delivered")} className="rounded-lg border px-3 py-2 text-xs font-bold">পণ্য পৌঁছেছে নিশ্চিত করুন</button>}</div>}
              {own && booking.status === "open" && <button disabled={busy} onClick={() => void updateStatus(booking,"cancelled")} className="mt-4 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600">বুকিং বাতিল করুন</button>}
            </article>;
          })}</div>}
        <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950"><strong>সতর্কতা:</strong> ভাড়া, লোডিং, পেমেন্ট, পণ্যের অবস্থা ও ক্ষতির দায় আগে নিশ্চিত করুন। AGRIVA-তে অফার দেওয়া মানেই বুকিং নিশ্চিত নয়। বর্তমানে অনলাইন পেমেন্ট বা লাইভ GPS ট্র্যাকিং নেই।</div>
      </section>
    </main>
  );
}
