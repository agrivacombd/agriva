import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
type Entry = { id:string; slug:string; display_name:string; crop:string; district:string|null; disease:string; confidence:string; image_path:string|null; published_at:string };
async function findEntry(id:string): Promise<Entry|null> {
  const isUuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (!isUuid && !/^[a-z0-9]+(?:-[a-z0-9]+)*-[0-9a-f]{12}$/.test(id)) return null;
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const db=createClient(url,key,{auth:{persistSession:false}});
  const {data,error}=await db.from("crop_health_feed").select("id,slug,display_name,crop,district,disease,confidence,image_path,published_at").eq(isUuid?"id":"slug",id).maybeSingle();
  return error ? null : data;
}
function imageUrl(entry:Entry) {
  if (!entry.image_path) return undefined;
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return undefined;
  return url.replace(/\/$/,"")+"/storage/v1/object/public/crop-health-feed/"+entry.image_path.split("/").map(encodeURIComponent).join("/");
}
export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata> {
  const {id}=await params, item=await findEntry(id);
  if (!item) return {title:"বিশ্লেষণ পাওয়া যায়নি",robots:{index:false,follow:false}};
  const title=`${item.crop} ফসলের ${item.disease} — AI বিশ্লেষণ | AGRIVA`;
  const description=`${item.district ? item.district+" জেলার " : ""}${item.crop} ফসলের সম্ভাব্য সমস্যা: ${item.disease}। AGRIVA Crop Health Feed-এ ব্যবহারকারীর অনুমোদিত ছবি ও প্রাথমিক AI বিশ্লেষণ দেখুন। নিশ্চিত রোগ নির্ণয় নয়।`;
  const canonical=`${base}/crop-disease/feed/${item.slug}`, img=imageUrl(item);
  return {title,description,alternates:{canonical},robots:{index:true,follow:true,googleBot:{"max-image-preview":"large"}},openGraph:{type:"article",url:canonical,title,description,locale:"bn_BD",publishedTime:item.published_at,images:img?[{url:img,alt:`${item.crop} ফসলের সম্ভাব্য ${item.disease} — AGRIVA`}]:[]},twitter:{card:img?"summary_large_image":"summary",title,description,images:img?[img]:[]}};
}
export default async function PublicCropDiagnosis({params}:{params:Promise<{id:string}>}) {
  const {id}=await params,item=await findEntry(id);
  if (!item) notFound();
  if (id !== item.slug) permanentRedirect(`/crop-disease/feed/${item.slug}`);
  const img=imageUrl(item), canonical=`${base}/crop-disease/feed/${id}`;
  const schema={"@context":"https://schema.org","@type":"Article",headline:`${item.crop} ফসলের ${item.disease} — প্রাথমিক AI বিশ্লেষণ`,description:`AGRIVA Crop Health Feed-এ স্বেচ্ছায় প্রকাশিত সম্ভাব্য রোগ বিশ্লেষণ; নিশ্চিত রোগ নির্ণয় নয়।`,datePublished:item.published_at,inLanguage:"bn-BD",mainEntityOfPage:canonical,publisher:{"@type":"Organization",name:"AGRIVA",url:base},...(img?{image:[img]}:{})};
  return <main className="mx-auto max-w-3xl px-4 py-10">
    <nav className="mb-5 text-sm text-emerald-800"><Link href="/crop-disease">ফসলের রোগ শনাক্তকরণ</Link> / অনুমোদিত বিশ্লেষণ</nav>
    <article className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
      {img && <img src={img} alt={`${item.crop} ফসলের সম্ভাব্য ${item.disease} রোগের প্রকাশিত ছবি`} className="max-h-[480px] w-full bg-slate-50 object-contain" />}
      <div className="p-6 sm:p-8">
        <p className="text-sm font-semibold text-emerald-700">AGRIVA Crop Health Feed · ব্যবহারকারীর অনুমোদিত পোস্ট</p>
        <h1 className="mt-3 text-2xl font-black leading-snug text-slate-900">{item.crop} ফসলের সম্ভাব্য সমস্যা: {item.disease}</h1>
        <p className="mt-3 text-sm text-slate-600">প্রকাশ করেছেন: {item.display_name} · {item.district || "জেলা উল্লেখ করা হয়নি"} · {new Date(item.published_at).toLocaleDateString("bn-BD")}</p>
        <h2 className="mt-6 text-lg font-bold">প্রাথমিক AI বিশ্লেষণ</h2>
        <p className="mt-2 leading-7 text-slate-700">প্রকাশিত ছবিতে {item.crop} ফসলের সম্ভাব্য সমস্যা হিসেবে {item.disease} উল্লেখ করা হয়েছে। শুধু ছবি দেখে নিশ্চিত রোগ নির্ণয় সম্ভব নয়। রোগের লক্ষণ, পরিবেশ ও কৃষি বিশেষজ্ঞের পর্যবেক্ষণ প্রয়োজন হতে পারে।</p>
        <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-950">এটি AGRIVA AI-এর প্রাথমিক ধারণা, কৃষি বিশেষজ্ঞের যাচাইকৃত রোগ নির্ণয় নয়। কীটনাশক প্রয়োগের আগে স্থানীয় কৃষি কর্মকর্তার পরামর্শ নিন।</p>
        <Link href="/crop-disease" className="mt-6 inline-block rounded-xl bg-emerald-800 px-5 py-3 font-bold text-white">আপনার ফসলের ছবি বিশ্লেষণ করুন</Link>
      </div>
    </article>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,"\\u003c")}} />
  </main>;
}
