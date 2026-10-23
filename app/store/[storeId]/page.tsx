import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MarketplaceCore, { type MarketplaceProduct } from "@/components/marketplace/MarketplaceCore";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type StorePageProps = { params: Promise<{ storeId: string }> };

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function getStoreProducts(storeId: string): Promise<MarketplaceProduct[]> {
  if (!isUuid(storeId)) return [];

  try {
    const supabase = await createSupabaseServerClient();
    // Only public retail fields are selected. Wholesale pricing and private
    // business/profile documents must never enter this public response.
    const { data, error } = await supabase
      .from("products")
      .select("id,name,slug,category,description,price,stock")
      .eq("farmer_id", storeId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(120);

    if (error) {
      console.error("Public store catalogue could not be loaded:", error.message);
      return [];
    }
    return (data ?? []) as MarketplaceProduct[];
  } catch (error) {
    console.error("Public store request failed:", error);
    return [];
  }
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { storeId } = await params;
  if (!isUuid(storeId)) return { title: "স্টোর পাওয়া যায়নি | AGRIVA", robots: { index: false, follow: false } };

  return {
    title: "কৃষি পণ্যের স্টোর | AGRIVA",
    description: "AGRIVA-তে এই বিক্রেতার অনুমোদিত ও সক্রিয় কৃষিপণ্য দেখুন। পণ্যের বিবরণ, খুচরা মূল্য ও মজুত যাচাই করুন।",
    alternates: { canonical: `/store/${storeId}` },
    openGraph: {
      title: "কৃষি পণ্যের স্টোর | AGRIVA",
      description: "অনুমোদিত ও সক্রিয় কৃষিপণ্য এক জায়গায় দেখুন।",
      type: "website",
      locale: "bn_BD",
    },
  };
}

export default async function PublicStorePage({ params }: StorePageProps) {
  const { storeId } = await params;
  if (!isUuid(storeId)) notFound();

  const products = await getStoreProducts(storeId);

  return (
    <main className="min-h-screen bg-[#f5f8f1] text-[#17351f]">
      <section className="bg-gradient-to-br from-[#103f2b] via-[#145b3c] to-[#24734a] text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <Link href="/marketplace" className="inline-flex min-h-10 items-center rounded-lg text-sm font-bold text-emerald-50 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-white">
            ← AGRIVA Marketplace
          </Link>
          <p className="mt-6 text-xs font-extrabold uppercase tracking-[.16em] text-lime-300">AGRIVA STORE</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">বিক্রেতার পণ্যসম্ভার</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/90 sm:text-base">
            এই স্টোরে বিক্রেতার অনুমোদিত ও সক্রিয় পণ্যগুলো দেখুন। এখানে প্রদর্শিত মূল্য খুচরা মূল্য; B2B wholesale মূল্য শুধু অনুমোদিত ও অনুমতিপ্রাপ্ত অ্যাকাউন্টে আলাদাভাবে দেখানো হবে।
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2">শুধু অনুমোদিত পণ্য</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2">মোবাইল-ফ্রেন্ডলি</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2">খুচরা মূল্য প্রদর্শন</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {products.length > 0 ? (
          <MarketplaceCore products={products} showCategories={false} />
        ) : (
          <div className="rounded-2xl border border-emerald-950/10 bg-white px-5 py-12 text-center shadow-sm">
            <div aria-hidden="true" className="text-4xl">🌱</div>
            <h2 className="mt-4 text-xl font-black">এখনো কোনো প্রকাশিত পণ্য নেই</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
              এই স্টোরে বর্তমানে দেখানোর মতো অনুমোদিত ও সক্রিয় পণ্য পাওয়া যায়নি। পরে আবার দেখুন অথবা মার্কেটপ্লেসে অন্য পণ্য খুঁজুন।
            </p>
            <Link href="/marketplace" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-800 px-5 py-3 text-sm font-extrabold text-white hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2">
              মার্কেটপ্লেসে যান
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
