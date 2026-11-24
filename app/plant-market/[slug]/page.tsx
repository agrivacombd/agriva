import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { canonicalPlantProductSlug, resolvePlantProductSlug } from "@/lib/plant-market/product-slugs";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import PlantMarketAddToCart from "@/components/plant-market/PlantMarketAddToCart";
import PlantProductShare from "@/components/plant-market/PlantProductShare";
import PlantWishlistButton from "@/components/plant-market/PlantWishlistButton";
import PlantMarketRecentlyViewed from "@/components/plant-market/PlantMarketRecentlyViewed";
import PlantMarketReviews from "@/components/plant-market/PlantMarketReviews";
import PlantMarketDeliveryInfo from "@/components/plant-market/PlantMarketDeliveryInfo";
import ProductClickTracker from "@/components/marketplace/ProductClickTracker";
import { productDescriptionToText, sanitizeProductDescription } from "@/lib/marketplace/product-description";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {slug}=await params;const lookupSlug=resolvePlantProductSlug(slug);const supabase=await createSupabaseServerClient();
  const {data}=await supabase.from("plant_market_products").select("name,description,image_url,seo_title,seo_description").eq("slug",lookupSlug).eq("status","active").maybeSingle();
  if(!data)return {title:"Plant Market পণ্য পাওয়া যায়নি | AGRIVA",robots:{index:false,follow:false}};
  const title=(data.seo_title||`${data.name} | AGRIVA Plant Market`).slice(0,70),description=(data.seo_description||productDescriptionToText(sanitizeProductDescription(data.description||""))||`${data.name} — AGRIVA Plant Market-এ গাছ ও বাগান সামগ্রী।`).slice(0,160);
  const canonicalSlug=canonicalPlantProductSlug(lookupSlug);
  return {title,description,alternates:{canonical:`/plant-market/${encodeURIComponent(canonicalSlug)}`},openGraph:{type:"website",title,description,images:data.image_url?[data.image_url]:[]},twitter:{card:data.image_url?"summary_large_image":"summary",title,description,images:data.image_url?[data.image_url]:[]}};
}
export default async function PlantMarketProductPage({params}:Props){
  const {slug}=await params;const lookupSlug=resolvePlantProductSlug(slug);const supabase=await createSupabaseServerClient();
  const {data:product}=await supabase.from("plant_market_products").select("id,name,slug,scientific_name,category,category_slug,plant_size,pot_size,plant_age,sunlight,watering,flowering_season,delivery_area,description,price,stock,unit,image_url,seo_title,seo_description,focus_keyword,seo_keywords,brand,origin,highlights,usage_instructions,image_alt").eq("slug",lookupSlug).eq("status","active").maybeSingle();
  if(!product)notFound();
  const canonicalSlug=canonicalPlantProductSlug(product.slug);
  if (slug !== canonicalSlug) permanentRedirect(`/plant-market/${encodeURIComponent(canonicalSlug)}`);
  const { data: relatedProducts } = await supabase.from("plant_market_products")
    .select("id,name,slug,price,stock,unit,image_url")
    .eq("status","active").eq("category_slug",product.category_slug).neq("id",product.id)
    .order("created_at",{ascending:false}).limit(4);
  const safeDescription = sanitizeProductDescription(product.description || "");
  const plainDescription = productDescriptionToText(safeDescription);
  const base=(process.env.NEXT_PUBLIC_SITE_URL||"https://agriva.com.bd").replace(/\/$/,"");
  const schema={"@context":"https://schema.org","@type":"Product",name:product.name,description:plainDescription||undefined,category:product.category,image:product.image_url?[product.image_url]:undefined,sku:undefined,brand:product.brand?{"@type":"Brand",name:product.brand}:undefined,countryOfOrigin:product.origin||undefined,keywords:[product.focus_keyword,...(Array.isArray(product.seo_keywords)?product.seo_keywords:[])].filter(Boolean).join(", ")||undefined,additionalProperty:Array.isArray(product.highlights)?product.highlights.slice(0,5).map((value:string)=>({"@type":"PropertyValue",name:"Plant feature",value})):undefined,offers:{"@type":"Offer",priceCurrency:"BDT",price:product.price,availability:Number(product.stock)>0?"https://schema.org/InStock":"https://schema.org/OutOfStock",url:`${base}/plant-market/${encodeURIComponent(canonicalSlug)}`}};
  const unitLabels:Record<string,string>={piece:"পিস",pcs:"পিস",kg:"কেজি",g:"গ্রাম",pack:"প্যাকেট",bag:"বস্তা",liter:"লিটার"};
  const displayUnit=unitLabels[String(product.unit||"piece").toLowerCase()]||product.unit||"পিস";
  const specs=[["গাছের আকার",product.plant_size],["টবের সাইজ",product.pot_size],["গাছের বয়স",product.plant_age],["সূর্যালোক",product.sunlight],["পানি",product.watering],["ফুল ফোটার মৌসুম",product.flowering_season],["ডেলিভারি এলাকা",product.delivery_area]].filter((item)=>item[1]);
  return (
    <main className="min-h-screen bg-[#f6f8f3] px-3 py-5 text-[#17351f] sm:px-6 sm:py-8">
      <ProductClickTracker market="plant-market" productId={product.id}/>
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,"\\u003c")}}/>
      <div className="mx-auto max-w-7xl">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-800 sm:text-sm">
          <Link href="/">AGRIVA</Link><span className="text-slate-400">/</span><Link href="/plant-market">Plant Market</Link><span className="text-slate-400">/</span><Link href="/plant-market/wishlist">Wishlist ♥</Link><span className="text-slate-400">/</span><span className="text-slate-500">{product.name}</span>
        </nav>

        <article className="mt-4 overflow-hidden rounded-[28px] border border-emerald-950/10 bg-white shadow-sm">
          <div className="grid lg:grid-cols-[1.05fr_.95fr]">
            <div className="relative flex min-h-[320px] items-center justify-center bg-gradient-to-br from-[#edf5e8] via-[#f7faf4] to-[#e1efdc] p-4 sm:min-h-[520px] sm:p-8">
              <div className="absolute left-4 top-4 rounded-full border border-white/70 bg-white/85 px-3 py-1.5 text-xs font-bold text-emerald-900 shadow-sm">🌿 Plant Market</div>
              {product.image_url ? <img src={product.image_url} alt={product.image_alt||product.name} className="max-h-[520px] w-full object-contain drop-shadow-sm"/> : <span className="text-8xl">🪴</span>}
            </div>
            <div className="p-5 sm:p-8 lg:p-10">
              <p className="text-sm font-bold text-emerald-700">{product.category}</p>
              <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight sm:text-4xl">{product.name}</h1>
              {product.scientific_name&&<p className="mt-2 text-sm italic text-slate-500">{product.scientific_name}</p>}
              <div className="mt-3"><PlantWishlistButton product={{id:product.id,name:product.name,slug:canonicalSlug,price:Number(product.price),image:product.image_url}}/></div>
              <div className="mt-5 flex flex-wrap items-baseline gap-2">
                <p className="text-4xl font-black tracking-tight text-emerald-950">৳{Number(product.price).toLocaleString("bn-BD")}</p>
                <span className="text-sm font-semibold text-slate-500">/ {displayUnit}</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className={Number(product.stock)>0?"h-2.5 w-2.5 rounded-full bg-green-500":"h-2.5 w-2.5 rounded-full bg-slate-400"}/>
                <p className="text-sm font-semibold text-slate-600">{Number(product.stock)>0? `স্টকে আছে · ${Number(product.stock).toLocaleString("bn-BD")} ${displayUnit}`:"সাময়িকভাবে স্টক শেষ"}</p>
              </div>
              {Array.isArray(product.highlights)&&product.highlights.length>0&&<ul className="mt-5 space-y-2">{product.highlights.slice(0,4).map((item:string)=><li key={item} className="flex gap-2 text-sm leading-6 text-slate-700"><span className="mt-0.5 text-emerald-700">✓</span><span>{item}</span></li>)}</ul>}
              <div className="mt-6 grid grid-cols-2 gap-2.5">
                {specs.slice(0,4).map(([label,value],i)=><div key={label} className="rounded-2xl border border-emerald-100 bg-[#f7faf5] p-3"><div className="text-xs font-bold text-emerald-800">{["📏","🪴","🌱","☀️"][i]||"🌿"} {label}</div><div className="mt-1.5 text-sm font-semibold text-slate-700">{value}</div></div>)}
              </div>
              <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                <h2 className="font-extrabold text-emerald-950">কেনার আগে নিশ্চিন্ত থাকুন</h2>
                <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                  <p className="flex gap-2"><span>🛒</span>Checkout-এ অর্ডার ও মোট মূল্য যাচাই</p>
                  <p className="flex gap-2"><span>📦</span>অর্ডারের আগে স্টক পুনরায় যাচাই</p>
                  {product.delivery_area&&<p className="flex gap-2 sm:col-span-2"><span>🚚</span>ডেলিভারি: {product.delivery_area}</p>}
                </div>
              </div>
              <PlantMarketDeliveryInfo deliveryArea={product.delivery_area}/>
              <div id="purchase-area" className="mt-5 scroll-mt-24"><PlantMarketAddToCart productId={product.id} stock={Number(product.stock)} disabled={Number(product.stock)<1}/></div>
              <div className="mt-3"><PlantProductShare name={product.name}/></div>
              <p className="mt-3 text-xs leading-5 text-slate-500">Buy Now করলে Checkout-এ যাবেন। কার্টে আগে যোগ করা পণ্য থাকলে Order Summary-তে সেগুলোও দেখা যাবে।</p>
            </div>
          </div>
        </article>

        <section className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border border-emerald-950/10 bg-white p-5 sm:p-7">
            <h2 className="text-xl font-black text-emerald-950">🌱 এই গাছটি কোথায় ভালো মানাবে?</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">{product.usage_instructions||"আপনার বাগান, বারান্দা বা ঘরের উপযোগী জায়গা বেছে নিন। গাছের নির্দিষ্ট আলো ও পানি দেওয়ার নির্দেশনা অনুসরণ করলে পরিচর্যা সহজ হবে।"}</p>
            {product.origin&&<p className="mt-3 text-sm text-slate-500">উৎপত্তিস্থল: {product.origin}</p>}
          </div>
          <div className="rounded-3xl border border-emerald-950/10 bg-white p-5 sm:p-7">
            <h2 className="text-xl font-black text-emerald-950">🧑‍🌾 দ্রুত পরিচর্যা গাইড</h2>
            <dl className="mt-3 space-y-3">
              {[[ "সূর্যালোক",product.sunlight,"☀️"],["পানি",product.watering,"💧"],["ফুল/ফল আসার সময়",product.flowering_season,"🌸"]].filter((x)=>x[1]).map(([label,value,emoji])=><div key={label} className="flex gap-3 rounded-2xl bg-emerald-50/70 p-3"><span>{emoji}</span><div><dt className="text-sm font-bold text-emerald-900">{label}</dt><dd className="mt-1 text-sm leading-6 text-slate-700">{value}</dd></div></div>)}
            </dl>
          </div>
        </section>

        {safeDescription&&<section id="plant-product-details" aria-label="পণ্যের বিস্তারিত বিবরণ" className="scroll-mt-24 mt-6 rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-sm md:p-8">
          <h2 className="mb-4 text-2xl font-black text-emerald-950">পণ্যের বিস্তারিত বিবরণ</h2>
          <div className="break-words text-base leading-8 text-slate-700 [&_h2]:my-3 [&_h2]:text-lg [&_h2]:font-extrabold [&_h3]:my-2 [&_h3]:font-bold [&_p]:my-3 [&_p]:leading-8 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-300 [&_blockquote]:pl-3 [&_a]:font-semibold [&_a]:text-emerald-800 [&_a]:underline" dangerouslySetInnerHTML={{__html:safeDescription}}/>
        </section>}

        
        <section aria-label="সাধারণ প্রশ্ন" className="mt-6 rounded-3xl border border-emerald-950/10 bg-white p-5 sm:p-7">
          <h2 className="text-xl font-black text-emerald-950">❓ কেনার আগে সাধারণ প্রশ্ন</h2>
          <div className="mt-4 divide-y divide-emerald-950/10">
            <details className="py-3"><summary className="cursor-pointer font-bold">এই পণ্যটি কি এখন অর্ডার করা যাবে?</summary><p className="mt-2 text-sm leading-6 text-slate-600">{Number(product.stock)>0 ? <>হ্যাঁ, বর্তমানে {Number(product.stock).toLocaleString("bn-BD")} {displayUnit} স্টকে আছে। অর্ডার দেওয়ার সময় স্টক আবার যাচাই করা হবে।</> : "এই মুহূর্তে স্টক নেই। স্টক ফিরে এলে পণ্য পেজে আপডেট হবে।"}</p></details>
            <details className="py-3"><summary className="cursor-pointer font-bold">ডেলিভারি কত দিনে হবে?</summary><p className="mt-2 text-sm leading-6 text-slate-600">ডেলিভারি সময় আপনার ঠিকানা ও অর্ডার নিশ্চিত হওয়ার উপর নির্ভর করে। checkout-এ ঠিকানা দেওয়ার পর প্রযোজ্য তথ্য যাচাই করুন।{product.delivery_area ? " ডেলিভারি এলাকা: " + product.delivery_area + "." : ""}</p></details>
            <details className="py-3"><summary className="cursor-pointer font-bold">গাছটির যত্ন কীভাবে নেব?</summary><p className="mt-2 text-sm leading-6 text-slate-600">{[product.sunlight && "আলো: " + product.sunlight,product.watering && "পানি: " + product.watering,product.usage_instructions].filter(Boolean).join("। ") || "পণ্যের পরিচর্যা নির্দেশনা অনুসরণ করুন; আলো, পানি ও মাটি গাছের ধরন অনুযায়ী ঠিক রাখুন।"}</p></details>
            <details className="py-3"><summary className="cursor-pointer font-bold">পণ্য ক্ষতিগ্রস্ত অবস্থায় এলে কী করব?</summary><p className="mt-2 text-sm leading-6 text-slate-600">প্যাকেট খোলার সময় ছবি বা ভিডিও রাখুন এবং দ্রুত AGRIVA support-এ order number সহ যোগাযোগ করুন; replacement/return eligibility policy অনুযায়ী যাচাই করা হবে।</p></details>
          </div>
        </section>

        <PlantMarketReviews productId={product.id} />

        {relatedProducts && relatedProducts.length>0 && <section aria-label="একই ধরনের আরও গাছ" className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold text-emerald-700">আরও পছন্দ</p><h2 className="mt-1 text-2xl font-black">একই ধরনের আরও গাছ ও চারা</h2></div><Link href="/plant-market" className="text-sm font-bold text-emerald-800 underline underline-offset-4">সব গাছ দেখুন →</Link></div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{relatedProducts.map(item=><Link key={item.id} href={"/plant-market/"+encodeURIComponent(canonicalPlantProductSlug(item.slug))} className="overflow-hidden rounded-2xl border border-emerald-950/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex aspect-square items-center justify-center bg-emerald-50">{item.image_url?<img src={item.image_url} alt={item.name} loading="lazy" className="h-full w-full object-contain"/>:<span className="text-5xl">🪴</span>}</div><div className="p-3"><h3 className="line-clamp-2 text-sm font-extrabold">{item.name}</h3><p className="mt-2 font-black text-emerald-900">৳{Number(item.price).toLocaleString("bn-BD")} <span className="text-xs font-semibold text-slate-500">/ {unitLabels[String(item.unit||"piece").toLowerCase()]||item.unit||"পিস"}</span></p><p className="mt-1 text-xs text-slate-500">{Number(item.stock)>0?"স্টকে আছে":"স্টক শেষ"}</p></div></Link>)}</div>
        </section>}
      <PlantMarketRecentlyViewed product={{id:product.id,name:product.name,slug:canonicalSlug,price:Number(product.price),image:product.image_url}} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-950/10 bg-white/95 p-3 shadow-[0_-8px_24px_rgba(0,0,0,.08)] backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-bold text-slate-500">দাম</p><p className="truncate text-lg font-black text-emerald-950">৳{Number(product.price).toLocaleString("bn-BD")}</p></div><a href="#purchase-area" className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-emerald-900 px-4 text-sm font-extrabold text-white">{Number(product.stock)>0?"কিনুন / কার্টে যোগ করুন":"স্টক শেষ"}</a></div>
      </div>
      <div className="h-20 sm:hidden" aria-hidden="true"/>
    </main>
  );
}
