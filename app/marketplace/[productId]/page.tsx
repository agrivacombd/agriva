import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import CheckoutButton from "@/components/marketplace/CheckoutButton";

type ProductPageProps = { params: Promise<{ productId: string }> };

async function getPublicProduct(productId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("products")
    .select("id,name,price,stock,commission_percent,farmer_id,description")
    .eq("id", productId)
    .eq("status", "active")
    .eq("moderation_status", "approved")
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { productId } = await params;
  const product = await getPublicProduct(productId);
  if (!product) {
    return {
      title: "পণ্য পাওয়া যায়নি",
      robots: { index: false, follow: false },
    };
  }

  const title = `${product.name} — কৃষি পণ্য`;
  const description = typeof product.description === "string" && product.description.trim()
    ? product.description.trim().slice(0, 155)
    : `AGRIVA Marketplace-এ ${product.name} পণ্যের মূল্য, মজুত ও বিক্রেতার তথ্য দেখুন।`;

  return {
    title,
    description,
    alternates: { canonical: `/marketplace/${product.id}` },
    openGraph: { title, description, type: "website" },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { productId } = await params;
  const product = await getPublicProduct(productId);
  if (!product) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: typeof product.description === "string" ? product.description : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "BDT",
      price: Number(product.price),
      availability: Number(product.stock) > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd"}/marketplace/${product.id}`,
    },
  };

  return (
    <main className="min-h-screen bg-[#f5f8f1] px-4 py-8 text-[#17351f] sm:px-6 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="mx-auto max-w-5xl">
        <nav aria-label="Breadcrumb" className="mb-5 text-sm text-slate-500">
          <a href="/" className="hover:text-emerald-800">হোম</a>
          <span className="mx-2" aria-hidden="true">/</span>
          <a href="/marketplace" className="hover:text-emerald-800">মার্কেটপ্লেস</a>
          <span className="mx-2" aria-hidden="true">/</span>
          <span className="font-semibold text-slate-700">{product.name}</span>
        </nav>
        <div className="grid overflow-hidden rounded-3xl border border-emerald-950/10 bg-white shadow-sm md:grid-cols-[.85fr_1.15fr]">
          <div className="flex min-h-56 items-center justify-center bg-gradient-to-br from-emerald-50 to-lime-100 p-8 md:min-h-[420px]">
            <div className="text-center">
              <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-white text-5xl shadow-sm" aria-hidden="true">🌾</span>
              <p className="mt-4 text-xs font-extrabold uppercase tracking-[.16em] text-emerald-800">AGRIVA Marketplace</p>
              <p className="mt-1 text-sm text-slate-500">পণ্যের ছবি না থাকলে placeholder দেখানো হচ্ছে</p>
            </div>
          </div>
          <div className="p-5 sm:p-8 md:p-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-600" /> অনুমোদিত পণ্য
            </span>
            <h1 className="mt-4 break-words text-2xl font-black leading-tight tracking-tight sm:text-4xl">{product.name}</h1>
            {typeof product.description === "string" && product.description.trim() && (
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600 sm:text-base">{product.description}</p>
            )}
            <p className="mt-6 text-3xl font-black text-emerald-900">৳{Number(product.price).toLocaleString("bn-BD")}</p>
            <p className="mt-2 text-sm text-slate-500">প্রাপ্য মজুত: {Number(product.stock).toLocaleString("bn-BD")}</p>
            <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 sm:p-5">
              <p className="font-extrabold">রিসেলার কমিশন</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">যোগ্য রেফারেল অর্ডারের জন্য নির্ধারিত কমিশন {Number(product.commission_percent ?? 0).toLocaleString("bn-BD")}%। অর্ডার ও payout যাচাই সাপেক্ষে প্রযোজ্য।</p>
            </div>
            <div className="mt-6">
              <CheckoutButton productId={product.id} disabled={Number(product.stock) < 1} />
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">মূল্য ও মজুত পরিবর্তিত হতে পারে। অর্ডার নিশ্চিত করার আগে checkout-এ তথ্য যাচাই করুন।</p>
          </div>
        </div>
      </div>
    </main>
  );
}
