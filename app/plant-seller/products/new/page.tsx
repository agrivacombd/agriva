import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, BadgeCheck, Leaf, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkModuleAccess } from "@/lib/authz/module-access";
import PlantSellerProductForm from "@/components/seller/PlantSellerProductForm";

export const metadata: Metadata = {
  title: "সহজে গাছ ও চারা যোগ করুন | AGRIVA Plant Seller",
  description: "AGRIVA Plant Market-এ ছবি, দাম, পরিচর্যার তথ্য এবং SEO বিবরণসহ গাছ, চারা ও বাগানের পণ্য জমা দিন।",
  robots: { index: false, follow: false },
};

export default async function NewPlantSellerProductPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/plant-seller/products/new");

  const [{ data: profile, error: profileError }, access] = await Promise.all([
    supabase.from("gardener_profiles").select("verification_status").eq("user_id", user.id).maybeSingle(),
    checkModuleAccess("plant_market", "create", { type: "global" }),
  ]);
  const approved = !profileError && profile?.verification_status === "verified" && access.allowed;

  return (
    <main className="min-h-screen bg-[#f5f8f2] pb-16 text-[#183d2e]">
      <div className="border-b border-emerald-950/10 bg-white">
        <nav aria-label="Breadcrumb" className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-4 text-xs font-semibold text-slate-500 sm:px-6 lg:px-8">
          <Link href="/plant-market" className="hover:text-emerald-800">Plant Market</Link>
          <span aria-hidden="true">/</span>
          <Link href="/plant-seller/products" className="hover:text-emerald-800">আমার পণ্য</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="text-emerald-900">নতুন পণ্য</span>
        </nav>
      </div>

      <header className="relative overflow-hidden bg-gradient-to-br from-[#0a3323] via-[#115b3a] to-[#207a4c] text-white">
        <div aria-hidden="true" className="pointer-events-none absolute -right-28 -top-36 h-80 w-80 rounded-full border-[45px] border-white/10" />
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-11 lg:px-8">
          <Link href="/plant-seller/products" className="inline-flex items-center gap-2 text-xs font-bold text-emerald-100 hover:text-white">
            <ArrowLeft size={15} aria-hidden="true" /> আমার পণ্যে ফিরে যান
          </Link>
          <div className="mt-6 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-lime-200/20 bg-white/10 px-3 py-1.5 text-[11px] font-extrabold tracking-wide text-lime-100">
                <Leaf size={14} aria-hidden="true" /> AGRIVA PLANT SELLER
              </p>
              <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl lg:text-[2.7rem]">সহজেই আপনার নতুন পণ্য যোগ করুন</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-50/90 sm:text-base">
                কয়েকটি সহজ ধাপে গাছ বা চারার তথ্য, বাস্তব ছবি, মূল্য এবং SEO বিবরণ দিন। সব তথ্য একবার দেখে তারপর পর্যালোচনার জন্য জমা দিন।
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-bold text-white/90 md:max-w-[285px]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2"><ShieldCheck size={14} /> নিরাপদ জমা</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2"><Sparkles size={14} /> সহজ SEO সহায়তা</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2"><BadgeCheck size={14} /> অ্যাডমিন রিভিউ</span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        {approved ? (
          <PlantSellerProductForm />
        ) : (
          <section className="mx-auto max-w-2xl rounded-3xl border border-amber-200 bg-white p-6 shadow-sm sm:p-9">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <LockKeyhole size={23} aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-2xl font-black">Plant Seller অনুমোদন প্রয়োজন</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              পণ্য যোগ করতে Gardener পরিচয় যাচাই ও Plant Market-এর আলাদা অনুমোদন প্রয়োজন। সাধারণ Marketplace Seller permission এখানে কার্যকর নয়।
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/account/verification?module=plant_market" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-900 px-5 py-3 text-sm font-extrabold text-white hover:bg-emerald-800">
                অনুমোদনের জন্য আবেদন করুন <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link href="/plant-seller/products" className="inline-flex min-h-12 items-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-emerald-900 hover:bg-emerald-50">
                আমার পণ্যে ফিরে যান
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
