import Link from "next/link";
type Props={market:"marketplace"|"plant-market"};
export default function SellerApplicationForm({market}:Props){
  const plant=market==="plant-market";
  const module=plant?"plant_market":"marketplace";
  return <section className="rounded-2xl border border-emerald-950/10 bg-white p-6 shadow-sm">
    <h2 className="text-xl font-black">{plant?"Plant Seller পরিচয় যাচাই":"Marketplace Business Seller পরিচয় যাচাই"}</h2>
    <p className="mt-3 text-sm leading-7 text-slate-600">{plant?"Plant Market-এর জন্য Gardener পরিচয়, বাগানের অভিজ্ঞতা ও প্রমাণপত্র জমা দিন।":"Marketplace-এর জন্য ব্যবসা/প্রতিষ্ঠানের তথ্য, নিবন্ধন ও প্রমাণপত্র জমা দিন।"} একই AGRIVA account থেকে অন্য মার্কেটের জন্যও আলাদা আবেদন করা যাবে। অনুমোদন প্রতিটি মার্কেটের জন্য স্বতন্ত্র এবং অনুমোদনের আগে পণ্য যোগ করা যাবে না।</p>
    <Link href={`/account/verification?module=${module}`} className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-900 px-5 py-3 text-sm font-extrabold text-white hover:bg-emerald-800">{plant?"Plant Market আবেদন করুন":"Marketplace Seller আবেদন করুন"}</Link>
  </section>;
}