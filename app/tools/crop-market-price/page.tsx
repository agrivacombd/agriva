import type { Metadata } from "next";
import CropMarketPrice from "@/components/tools/CropMarketPrice";

export const metadata: Metadata = {
  title: "Crop Market Price Bangladesh | ফসলের বাজার দর | AGRIVA",
  description: "Check indicative crop market prices and compare recent price observations with AGRIVA's farmer market price tool.",
  alternates: { canonical: "/tools/crop-market-price" },
  keywords: ["crop market price Bangladesh", "agriculture market price", "farmer market price", "ফসলের বাজার দর", "কৃষি বাজার দাম", "ধানের দাম"],
};

export default function CropMarketPricePage() {
  return <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]"><section className="mx-auto max-w-6xl px-6 py-14"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA Farmer Intelligence</p><h1 className="mt-3 text-4xl font-black md:text-5xl">Crop Market Price Bangladesh</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-[#647468]">Compare indicative crop prices by market and date. Use the information as a planning reference and verify the latest local buying price before making a sale.</p><CropMarketPrice /><article className="prose prose-green mt-14 max-w-none"><h2>Why market price information matters</h2><p>Farmers often need current market information when planning harvest, storage, transport and sales. AGRIVA can bring price observations together with farm records and marketplace listings.</p><h2>How to use this tool</h2><p>Select a crop and market, then enter a verified price observation. The tool keeps a simple recent-price history in the browser prototype. A future Supabase-backed version can aggregate verified market data and show trends.</p><h2>Important note</h2><p>Prices vary by market, quality, variety, quantity, date and buyer. An indicative price is not a guaranteed transaction price. Verify the actual offer with the buyer or market before selling.</p><h2>Frequently asked questions</h2><h3>Does AGRIVA guarantee a market price?</h3><p>No. Market prices change and actual transaction prices depend on quality, location and negotiation.</p><h3>Can this connect with the farmer marketplace?</h3><p>Yes. Verified price data can later be shown alongside farmer listings and reseller opportunities, with clear separation between reference prices and actual offers.</p></article></section></main>;
}
