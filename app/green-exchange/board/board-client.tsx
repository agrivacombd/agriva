"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type ExchangeRequest = {
  id: string;
  listing_id: string;
  requester_id: string;
  message: string;
  offered_item: string;
  status: "pending" | "accepted" | "declined" | "countered" | "cancelled" | "completed";
  counter_message: string | null;
  created_at: string;
  green_exchange_listings?: { title: string; owner_id: string } | null;
};

type Listing = {
  id: string;
  slug: string;
  title: string;
  plant_name: string;
  description: string;
  exchange_type: "plant_swap" | "cutting" | "seed" | "gift" | "garden_item";
  wanted_items: string | null;
  area: string;
  district: string | null;
  condition: string;
  quantity: number;
  status: string;
  moderation_status: string;
  created_at: string;
};

const typeLabels: Record<Listing["exchange_type"], string> = {
  plant_swap: "গাছের বদলে গাছ",
  cutting: "চারা / কাটিং",
  seed: "বীজ",
  gift: "উপহার",
  garden_item: "বাগানের উপকরণ",
};

const slugify = (value: string) =>
  value.normalize("NFKD").toLowerCase().replace(/[^a-z0-9\u0980-\u09ff]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

export default function GreenExchangeBoard() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<ExchangeRequest[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [requestListingId, setRequestListingId] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [offeredItem, setOfferedItem] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);
  const [form, setForm] = useState({
    title: "", plant_name: "", description: "", exchange_type: "plant_swap" as Listing["exchange_type"],
    wanted_items: "", area: "", district: "", quantity: "1", condition: "healthy",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const { data: authData } = await supabase.auth.getUser();
    const currentUser = authData.user?.id ?? null;
    setUserId(currentUser);
    const publicQuery = supabase.from("green_exchange_listings")
      .select("id,slug,title,plant_name,description,exchange_type,wanted_items,area,district,condition,quantity,status,moderation_status,created_at")
      .eq("status", "active").eq("moderation_status", "approved")
      .order("created_at", { ascending: false }).limit(100);
    const ownQuery = currentUser
      ? supabase.from("green_exchange_listings")
          .select("id,slug,title,plant_name,description,exchange_type,wanted_items,area,district,condition,quantity,status,moderation_status,created_at")
          .eq("owner_id", currentUser).order("created_at", { ascending: false }).limit(30)
      : Promise.resolve({ data: [] as Listing[], error: null });
    const requestsQuery = currentUser
      ? supabase.from("green_exchange_requests")
          .select("id,listing_id,requester_id,message,offered_item,status,counter_message,created_at,green_exchange_listings!inner(title,owner_id)")
          .eq("green_exchange_listings.owner_id", currentUser)
          .order("created_at", { ascending: false }).limit(50)
      : Promise.resolve({ data: [] as ExchangeRequest[], error: null });
    const [publicResult, ownResult, requestsResult] = await Promise.all([publicQuery, ownQuery, requestsQuery]);
    const combined = new Map<string, Listing>();
    for (const item of [...(publicResult.data ?? []), ...(ownResult.data ?? [])] as Listing[]) combined.set(item.id, item);
    setListings([...combined.values()]);
    setIncomingRequests((requestsResult.data ?? []) as unknown as ExchangeRequest[]);
    if (publicResult.error || ownResult.error) setMessage("লিস্টিং লোড করা যায়নি। ডেটাবেস মাইগ্রেশন ও অ্যাক্সেস সেটিংস যাচাই করুন।");
    if (requestsResult.error && requestsResult.error.code !== "42P01" && requestsResult.error.code !== "PGRST205") {
      setMessage("আপনার পাওয়া বিনিময়ের অনুরোধ লোড করা যায়নি।");
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function submitListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setMessage("লিস্টিং দিতে আগে লগইন করুন।");
      return;
    }
    if (form.title.trim().length < 4 || form.plant_name.trim().length < 2 || form.description.trim().length < 10 || form.area.trim().length < 2) {
      setMessage("শিরোনাম, গাছের নাম, অন্তত ১০ অক্ষরের বিবরণ এবং এলাকা ঠিকভাবে পূরণ করুন।");
      return;
    }
    setSaving(true);
    const slug = `${slugify(form.plant_name)}-${crypto.randomUUID().slice(0, 8)}`;
    const { error } = await supabase.from("green_exchange_listings").insert({
      owner_id: data.user.id,
      slug,
      title: form.title.trim(),
      plant_name: form.plant_name.trim(),
      description: form.description.trim(),
      exchange_type: form.exchange_type,
      wanted_items: form.wanted_items.trim() || null,
      area: form.area.trim(),
      district: form.district.trim() || null,
      quantity: Math.max(1, Math.min(500, Number.parseInt(form.quantity, 10) || 1)),
      condition: form.condition,
      status: "active",
      moderation_status: "pending",
    });
    setSaving(false);
    if (error) {
      setMessage(error.code === "42P01" || error.code === "PGRST205"
        ? "Green Exchange ডেটাবেস এখনো সেটআপ হয়নি। নিরাপদ migration অনুমোদন ও প্রয়োগের পর চেষ্টা করুন।"
        : "লিস্টিং প্রকাশ করা যায়নি। লগইন ও ডেটাবেস অনুমতি যাচাই করে আবার চেষ্টা করুন।");
      return;
    }
    setMessage("আপনার পোস্ট জমা হয়েছে। নিরাপত্তা ও মান যাচাই শেষে অনুমোদিত হলে পাবলিক তালিকায় দেখা যাবে।");
    setForm({ title: "", plant_name: "", description: "", exchange_type: "plant_swap", wanted_items: "", area: "", district: "", quantity: "1", condition: "healthy" });
    setShowForm(false);
    await load();
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>, listingId: string) {
    event.preventDefault();
    setMessage("");
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setMessage("বিনিময়ের অনুরোধ পাঠাতে আগে লগইন করুন।");
      return;
    }
    if (requestMessage.trim().length < 10 || offeredItem.trim().length < 2) {
      setMessage("অনুরোধের বার্তা অন্তত ১০ অক্ষরের এবং আপনার প্রস্তাবটি লিখুন।");
      return;
    }
    setSendingRequest(true);
    const { error } = await supabase.from("green_exchange_requests").insert({
      listing_id: listingId,
      requester_id: data.user.id,
      message: requestMessage.trim(),
      offered_item: offeredItem.trim(),
    });
    setSendingRequest(false);
    if (error) {
      setMessage(error.code === "23505"
        ? "এই পোস্টে আপনি ইতিমধ্যে অনুরোধ পাঠিয়েছেন।"
        : error.code === "42P01" || error.code === "PGRST205"
          ? "বিনিময়ের অনুরোধ ব্যবস্থা এখনো ডেটাবেসে চালু হয়নি।"
          : "অনুরোধ পাঠানো যায়নি। পোস্টটি এখনও সক্রিয় কি না এবং লগইন অবস্থা যাচাই করুন।");
      return;
    }
    setMessage("আপনার বিনিময়ের অনুরোধ পাঠানো হয়েছে। পোস্টের মালিকের উত্তর না পাওয়া পর্যন্ত অপেক্ষা করুন।");
    setRequestListingId(null);
    setRequestMessage("");
    setOfferedItem("");
  }

  async function respondToRequest(requestId: string, status: "accepted" | "declined") {
    setMessage("");
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setMessage("অনুরোধের উত্তর দিতে লগইন করুন।");
      return;
    }
    const { error } = await supabase.rpc("respond_green_exchange_request", {
      p_request_id: requestId,
      p_status: status,
      p_counter_message: null,
    });
    if (error) {
      setMessage("অনুরোধের উত্তর সংরক্ষণ করা যায়নি। ডেটাবেস migration প্রয়োগ হয়েছে কি না যাচাই করুন।");
      return;
    }
    setMessage(status === "accepted" ? "বিনিময়ের অনুরোধ গ্রহণ করা হয়েছে।" : "বিনিময়ের অনুরোধ প্রত্যাখ্যান করা হয়েছে।");
    await load();
  }

  const visible = listings.filter((item) => {
    const text = [item.title, item.plant_name, item.description, item.wanted_items ?? "", item.area, item.district ?? ""].join(" ").toLowerCase();
    return text.includes(query.toLowerCase()) && (!district || (item.district ?? "").toLowerCase().includes(district.toLowerCase()));
  });

  return (
    <main className="min-h-screen bg-[#f7faf6] text-slate-900">
      <section className="bg-emerald-950 px-4 py-10 text-white sm:px-6 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <Link href="/green-exchange" className="text-sm text-emerald-200 underline underline-offset-4">← Green Exchange গাইড</Link>
          <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">গাছ বিনিময়ের বোর্ড</h1>
          <p className="mt-3 max-w-2xl leading-7 text-emerald-100">গাছ, চারা, কাটিং, বীজ বা বাগানের উপকরণ খুঁজুন। নিরাপদ বিনিময়ের জন্য পোস্ট অনুমোদনের পরই সবার কাছে দেখানো হবে।</p>
          <button type="button" onClick={() => { setShowForm((v) => !v); setMessage(""); }} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-lime-300 px-5 py-3 font-bold text-emerald-950 hover:bg-lime-200 focus:outline-none focus:ring-2 focus:ring-white">{showForm ? "ফর্ম বন্ধ করুন" : "＋ বিনিময়ের পোস্ট দিন"}</button>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {message && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-white p-4 leading-7">{message}</p>}
        {showForm && <form onSubmit={submitListing} className="mb-8 grid gap-4 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-6">
          <div className="sm:col-span-2"><h2 className="text-xl font-bold">আপনার বিনিময়ের পোস্ট</h2><p className="mt-1 text-sm leading-6 text-slate-600">সঠিক তথ্য দিন। এই MVP-তে ছবি আপলোডের সুবিধা যোগ করা হয়নি।</p></div>
          <label className="grid gap-1 text-sm font-semibold">পোস্টের শিরোনাম<input required minLength={4} maxLength={120} value={form.title} onChange={e => setForm({...form,title:e.target.value})} className="rounded-lg border border-slate-300 px-3 py-2.5 font-normal" placeholder="যেমন: মানিপ্ল্যান্ট কাটিং বিনিময় করব" /></label>
          <label className="grid gap-1 text-sm font-semibold">গাছ / উপকরণের নাম<input required minLength={2} maxLength={100} value={form.plant_name} onChange={e => setForm({...form,plant_name:e.target.value})} className="rounded-lg border border-slate-300 px-3 py-2.5 font-normal" placeholder="যেমন: মানিপ্ল্যান্ট" /></label>
          <label className="grid gap-1 text-sm font-semibold">বিনিময়ের ধরন<select value={form.exchange_type} onChange={e => setForm({...form,exchange_type:e.target.value as Listing["exchange_type"]})} className="rounded-lg border border-slate-300 px-3 py-2.5 font-normal">{Object.entries(typeLabels).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label className="grid gap-1 text-sm font-semibold">পরিমাণ<input type="number" min="1" max="500" value={form.quantity} onChange={e => setForm({...form,quantity:e.target.value})} className="rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>
          <label className="grid gap-1 text-sm font-semibold sm:col-span-2">বিবরণ<textarea required minLength={10} maxLength={3000} rows={3} value={form.description} onChange={e => setForm({...form,description:e.target.value})} className="rounded-lg border border-slate-300 px-3 py-2.5 font-normal" placeholder="গাছের অবস্থা, আকার ও বিশেষ তথ্য লিখুন" /></label>
          <label className="grid gap-1 text-sm font-semibold">কী পেতে চান?<input maxLength={500} value={form.wanted_items} onChange={e => setForm({...form,wanted_items:e.target.value})} className="rounded-lg border border-slate-300 px-3 py-2.5 font-normal" placeholder="যেমন: ফুলের গাছ বা অন্য চারা" /></label>
          <label className="grid gap-1 text-sm font-semibold">এলাকা<input required minLength={2} maxLength={100} value={form.area} onChange={e => setForm({...form,area:e.target.value})} className="rounded-lg border border-slate-300 px-3 py-2.5 font-normal" placeholder="এলাকার নাম" /></label>
          <label className="grid gap-1 text-sm font-semibold">জেলা (ঐচ্ছিক)<input maxLength={100} value={form.district} onChange={e => setForm({...form,district:e.target.value})} className="rounded-lg border border-slate-300 px-3 py-2.5 font-normal" placeholder="জেলার নাম" /></label>
          <label className="grid gap-1 text-sm font-semibold">গাছের অবস্থা<select value={form.condition} onChange={e => setForm({...form,condition:e.target.value})} className="rounded-lg border border-slate-300 px-3 py-2.5 font-normal"><option value="healthy">সুস্থ</option><option value="needs_attention">যত্ন প্রয়োজন</option><option value="unknown">নিশ্চিত নই</option></select></label>
          <div className="sm:col-span-2"><button disabled={saving} className="min-h-11 rounded-xl bg-emerald-800 px-5 py-3 font-bold text-white hover:bg-emerald-700 disabled:opacity-60">{saving ? "জমা হচ্ছে…" : "বিনিময়ের পোস্ট জমা দিন"}</button></div>
        </form>}
        {userId && incomingRequests.length > 0 && <section className="mb-8"><div className="mb-4 flex items-end justify-between gap-3"><h2 className="text-2xl font-extrabold">আপনার পোস্টে পাওয়া অনুরোধ</h2><span className="text-sm text-slate-500">{incomingRequests.filter(r => r.status === "pending").length}টি অপেক্ষমাণ</span></div><div className="grid gap-4 md:grid-cols-2">{incomingRequests.map(request => <article key={request.id} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm"><p className="text-xs font-bold text-emerald-800">{request.green_exchange_listings?.title ?? "আপনার বিনিময়ের পোস্ট"}</p><h3 className="mt-2 font-bold">প্রস্তাব: {request.offered_item}</h3><p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">{request.message}</p><p className="mt-3 text-xs text-slate-500">অবস্থা: {({pending:"অপেক্ষমাণ",accepted:"গৃহীত",declined:"প্রত্যাখ্যাত",countered:"পাল্টা প্রস্তাব",cancelled:"বাতিল",completed:"সম্পন্ন"} as Record<ExchangeRequest["status"],string>)[request.status]}</p>{request.status === "pending" && <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => void respondToRequest(request.id,"accepted")} className="min-h-10 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-bold text-white">গ্রহণ করুন</button><button type="button" onClick={() => void respondToRequest(request.id,"declined")} className="min-h-10 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">প্রত্যাখ্যান</button></div>}</article>)}</div></section>}
        <div className="grid gap-3 rounded-2xl border border-emerald-100 bg-white p-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold">গাছ বা পোস্ট খুঁজুন<input value={query} onChange={e => setQuery(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2.5 font-normal" placeholder="গাছের নাম, বিবরণ…" /></label>
          <label className="grid gap-1 text-sm font-semibold">জেলা দিয়ে ফিল্টার<input value={district} onChange={e => setDistrict(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2.5 font-normal" placeholder="জেলার নাম" /></label>
        </div>
        <div className="mb-4 mt-8 flex items-end justify-between gap-3"><h2 className="text-2xl font-extrabold">বিনিময়ের পোস্ট</h2><span className="text-sm text-slate-500">{visible.length}টি পোস্ট</span></div>
        {loading ? <p className="py-10 text-center text-slate-600">পোস্ট লোড হচ্ছে…</p> : visible.length === 0 ? <div className="rounded-2xl border border-dashed border-emerald-200 bg-white px-5 py-12 text-center"><p className="text-lg font-bold">এখনো কোনো অনুমোদিত পোস্ট নেই</p><p className="mt-2 text-sm leading-6 text-slate-600">নতুন পোস্ট জমা দিন। যাচাইয়ের পর এটি এখানে দেখা যাবে। নিজের জমা দেওয়া পোস্ট লগইন অবস্থায় দেখা যাবে।</p></div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{visible.map(item => <article key={item.id} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">{typeLabels[item.exchange_type]}</span>{item.moderation_status === "pending" && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">যাচাই চলছে</span>}</div><h3 className="mt-3 text-lg font-bold"><Link href={`/green-exchange/${encodeURIComponent(item.slug)}`} className="underline decoration-emerald-200 underline-offset-4 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600">{item.title}</Link></h3><p className="mt-1 text-sm font-semibold text-emerald-800">{item.plant_name}</p><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{item.description}</p><div className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-600"><p>📍 {item.area}{item.district ? `, ${item.district}` : ""}</p><p className="mt-1">পরিমাণ: {item.quantity} · অবস্থা: {item.condition === "healthy" ? "সুস্থ" : item.condition === "needs_attention" ? "যত্ন প্রয়োজন" : "নিশ্চিত নয়"}</p>{item.wanted_items && <p className="mt-2"><strong>বিনিময়ে চাই:</strong> {item.wanted_items}</p>}</div>{item.moderation_status === "approved" && item.status === "active" && <div className="mt-4 border-t border-slate-100 pt-4">{requestListingId === item.id ? <form onSubmit={(event) => void submitRequest(event, item.id)} className="grid gap-3"><label className="grid gap-1 text-sm font-semibold">আপনার প্রস্তাব<input required minLength={2} maxLength={300} value={offeredItem} onChange={e => setOfferedItem(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 font-normal" placeholder="যেমন: জবা গাছের চারা" /></label><label className="grid gap-1 text-sm font-semibold">বার্তা<textarea required minLength={10} maxLength={1200} rows={3} value={requestMessage} onChange={e => setRequestMessage(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 font-normal" placeholder="আপনার বিনিময়ের প্রস্তাব ও সুবিধাজনক সময় লিখুন" /></label><div className="flex flex-wrap gap-2"><button disabled={sendingRequest} className="min-h-10 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{sendingRequest ? "পাঠানো হচ্ছে…" : "অনুরোধ পাঠান"}</button><button type="button" onClick={() => setRequestListingId(null)} className="min-h-10 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">বাতিল</button></div></form> : <button type="button" onClick={() => { setRequestListingId(item.id); setMessage(""); }} className="min-h-10 rounded-lg border border-emerald-700 px-4 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-600">বিনিময়ের অনুরোধ দিন</button>}</div>}</article>)}</div>}
        <p className="mt-8 text-xs leading-6 text-slate-500">নিরাপত্তা: ব্যক্তিগত ফোন নম্বর বা বাড়ির ঠিকানা পোস্টে লিখবেন না। অপরিচিত কারও সঙ্গে বিনিময়ের সময় সতর্ক থাকুন।</p>
      </section>
    </main>
  );
}
