import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Bulk & Custom Order | AGRIVA",
  description: "পাইকারি ধান, চাল, বীজ ও কৃষিপণ্যের জন্য নিজের প্রয়োজন অনুযায়ী কোটেশন চান।",
  alternates: { canonical: "/custom-order" },
};
const field = "w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600";
type Saved = { buyer_type: string; visibility: string; product_name: string; specification: string; quantity: number; unit: string; district: string; upazila: string };
async function submitRequest(formData: FormData) {
  "use server";
  const db = await createSupabaseServerClient();
  const {data:{user}} = await db.auth.getUser();
  if (!user) redirect("/login?next=%2Fcustom-order");
  const product_name = String(formData.get("product_name") ?? "").trim();
  const specification = String(formData.get("specification") ?? "").trim();
  const district = String(formData.get("district") ?? "").trim();
  const upazila = String(formData.get("upazila") ?? "").trim();
  const buyer_type = String(formData.get("buyer_type") ?? "");
  const visibility = String(formData.get("visibility") ?? "");
  const quantity = Number(formData.get("quantity"));
  const unit = String(formData.get("unit") ?? "");
  if(product_name.length<2 || product_name.length>120 || specification.length>2000 || district.length<2 || district.length>80 || upazila.length>80 ||
    !Number.isFinite(quantity) || quantity<=0 || quantity>10000000 ||
    !["business","individual"].includes(buyer_type) || !["public","private"].includes(visibility) ||
    !["kg","ton","maund","bag","packet"].includes(unit)) redirect("/custom-order?error=invalid");
  // Never copy quote IDs, selected supplier, moderation state or money from previous orders.
  const {error} = await db.from("bulk_requests").insert({
    buyer_id:user.id, buyer_type, visibility, product_name, specification, district,
    upazila, quantity, unit, status:"pending_review"
  });
  if(error) redirect("/custom-order?error=save");
  redirect("/account/custom-orders?created=1");
}
export default async function CustomOrder({searchParams}:{searchParams:Promise<{repeat?:string;error?:string}>}) {
  const p=await searchParams;
  const db=await createSupabaseServerClient();
  const {data:{user}}=await db.auth.getUser();
  let saved: Saved | null=null;
  // Ownership check is BOTH explicit here and enforced by Supabase RLS.
  if(user && p.repeat && /^[0-9a-f-]{36}$/i.test(p.repeat)){
    const {data}=await db.from("bulk_requests")
      .select("buyer_type,visibility,product_name,specification,quantity,unit,district,upazila")
      .eq("id",p.repeat).eq("buyer_id",user.id).maybeSingle();
    saved=data as Saved | null;
  }
  return <main className="min-h-screen bg-[#f7f9f5] pb-16 text-[#17351f]">
    <header className="bg-[#123f2b] text-white"><div className="mx-auto max-w-4xl px-4 py-12">
      <p className="text-sm font-semibold text-lime-300">AGRIVA • B2B & B2C</p>
      <h1 className="mt-3 text-3xl font-black sm:text-4xl">Bulk ও Custom Order</h1>
      <p className="mt-3 max-w-2xl text-emerald-50">আপনার প্রয়োজন জানান, পাইকারদের যাচাইকৃত অফার তুলনা করে সিদ্ধান্ত নিন।</p>
    </div></header>
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{saved?"আগের অর্ডার পরিবর্তন করে নতুন অনুরোধ":"নতুন পাইকারি অর্ডারের অনুরোধ"}</h2>
        <Link href="/account/custom-orders" className="rounded-xl border border-emerald-700 px-4 py-2 text-sm font-semibold">আমার অর্ডারের তালিকা</Link>
      </div>
      {saved && <p role="status" className="mb-4 rounded-xl bg-emerald-100 p-3 text-sm text-emerald-950">পুরোনো তথ্য ফর্মে বসানো হয়েছে। ইচ্ছেমতো পরিবর্তন করুন—নতুন Request তৈরি হবে, পুরোনোটি বদলাবে না।</p>}
      {p.repeat&&!saved&&<p role="alert" className="mb-4 rounded-xl bg-amber-50 p-3 text-sm">আগের অনুরোধ পাওয়া যায়নি বা দেখার অনুমতি নেই। নতুন ফর্ম পূরণ করুন।</p>}
      {p.error&&<p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">অনুরোধ জমা দেওয়া যায়নি। তথ্য যাচাই করুন; প্রয়োজনে অ্যাডমিনের সঙ্গে যোগাযোগ করুন।</p>}
      <form action={submitRequest} className="space-y-5 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-8">
        <label className="block text-sm font-semibold">আপনি কী ধরনের ক্রেতা?
          <select name="buyer_type" defaultValue={saved?.buyer_type??"business"} className={field}><option value="business">ব্যবসা / B2B</option><option value="individual">ব্যক্তিগত / B2C</option></select>
        </label>
        <label className="block text-sm font-semibold">পণ্যের নাম
          <input required minLength={2} maxLength={120} name="product_name" defaultValue={saved?.product_name??""} placeholder="যেমন: কালো ধান" className={field}/>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold">পরিমাণ<input required type="number" min="0.001" max="10000000" step="0.001" name="quantity" defaultValue={saved?.quantity??""} className={field}/></label>
          <label className="block text-sm font-semibold">একক<select name="unit" defaultValue={saved?.unit??"kg"} className={field}>
            <option value="kg">কেজি</option><option value="ton">টন</option><option value="maund">মণ</option><option value="bag">বস্তা</option><option value="packet">প্যাকেট</option></select></label>
        </div>
        <label className="block text-sm font-semibold">জাত, মান ও বিশেষ শর্ত (ঐচ্ছিক)
          <textarea name="specification" maxLength={2000} rows={3} defaultValue={saved?.specification??""} placeholder="পণ্যের বিবরণ লিখুন; ব্যক্তিগত ফোন নম্বর নয়" className={field}/>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold">ডেলিভারির জেলা<input required name="district" maxLength={80} defaultValue={saved?.district??""} className={field}/></label>
          <label className="block text-sm font-semibold">উপজেলা (ঐচ্ছিক)<input name="upazila" maxLength={80} defaultValue={saved?.upazila??""} className={field}/></label>
        </div>
        <fieldset className="space-y-2"><legend className="text-sm font-semibold">অনুরোধের গোপনীয়তা</legend>
          <label className="flex items-start gap-3 rounded-xl border p-3 text-sm"><input className="mt-1" type="radio" name="visibility" value="public" defaultChecked={!saved||saved.visibility==="public"}/><span><strong>Public</strong> — অ্যাডমিন অনুমোদনের পরে পণ্যের চাহিদা সবাই দেখতে পারবেন; যোগাযোগের তথ্য প্রকাশ করা হবে না।</span></label>
          <label className="flex items-start gap-3 rounded-xl border p-3 text-sm"><input className="mt-1" type="radio" name="visibility" value="private" defaultChecked={saved?.visibility==="private"}/><span><strong>Private</strong> — শুধু আপনার অ্যাকাউন্ট, অ্যাডমিন ও আমন্ত্রিত পাইকাররা দেখতে পারবেন।</span></label>
        </fieldset>
        <p className="text-xs text-slate-600">অনুরোধ জমা দিলেই পেমেন্ট বা চূড়ান্ত অর্ডার হবে না। কোটেশন যাচাই ও গ্রহণের পর আলাদা নিশ্চিতকরণ প্রয়োজন।</p>
        <button type="submit" className="w-full rounded-xl bg-emerald-800 px-5 py-3 font-bold text-white hover:bg-emerald-900">নতুন কোটেশন অনুরোধ জমা দিন</button>
      </form>
    </div>
  </main>;
}
