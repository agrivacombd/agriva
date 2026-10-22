import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

type FeedProduct = {
  id: string; slug: string | null; name: string; description: string | null;
  price: number | string | null; stock: number | null; status: string | null;
  moderation_status: string | null; image_url: string | null; brand: string | null;
  sku: string | null; category: string | null; updated_at: string | null;
};

function xml(value: unknown): string {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export async function GET() {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return new NextResponse("Product feed is not configured", { status: 503 });
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.from("products")
    .select("id,slug,name,description,price,stock,status,moderation_status,image_url,brand,sku,category,updated_at")
    .eq("status", "active").eq("moderation_status", "approved").gt("stock", 0)
    .not("slug", "is", null).not("image_url", "is", null).limit(5000);
  if (error) return new NextResponse("Product feed temporarily unavailable", { status: 503 });
  const products = (data ?? []) as FeedProduct[];
  const items = products.filter(p => p.slug && p.image_url && /^https:\/\//i.test(p.image_url) && Number(p.price) >= 0)
    .map(p => {
      const link = `${base}/marketplace/${encodeURIComponent(p.slug as string)}`;
      const price = Number(p.price).toFixed(2);
      return `<item><g:id>${xml(p.sku || p.id)}</g:id><g:title>${xml(p.name)}</g:title><g:description>${xml((p.description || p.name).slice(0, 5000))}</g:description><g:link>${xml(link)}</g:link><g:image_link>${xml(p.image_url)}</g:image_link><g:availability>in_stock</g:availability><g:condition>new</g:condition><g:price>${price} BDT</g:price>${p.brand ? `<g:brand>${xml(p.brand)}</g:brand>` : ""}${p.category ? `<g:product_type>${xml(p.category)}</g:product_type>` : ""}</item>`;
    }).join("");
  const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>AGRIVA products</title><link>${xml(base)}</link><description>Approved, in-stock AGRIVA marketplace products</description>${items}</channel></rss>`;
  return new NextResponse(body, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400", "X-Content-Type-Options": "nosniff" } });
}
