import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const revalidate = 900;

type FeedProduct = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  seo_content?: string | null;
  price: number | string | null;
  stock: number | null;
  image_url: string | null;
  image_urls?: string[] | null;
  image_variants?: Array<{ image_url?: string; card_url?: string; thumbnail_url?: string }> | null;
  product_attributes?: Record<string, unknown> | null;
};

function xml(value: unknown) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function plainText(value: unknown, max = 5000) {
  return typeof value === "string" ? value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function publicHttpsUrl(value: unknown) {
  if (typeof value !== "string") return false;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; }
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return new NextResponse("Merchant feed configuration unavailable", { status: 503 });
  }

  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
  const supabase = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.from("products")
    .select("id,slug,name,description,seo_content,price,stock,image_url,image_urls,image_variants,product_attributes")
    .eq("status", "active")
    .not("slug", "is", null)
    .order("updated_at", { ascending: false })
    .limit(10000);

  if (error) {
    console.error("Merchant Center feed query failed", { code: error.code || "unknown" });
    return new NextResponse("Merchant feed temporarily unavailable", { status: 503 });
  }

  const products = (data ?? []) as FeedProduct[];
  let skipped = 0;
  const items = products.flatMap((product) => {
    const attributes = product.product_attributes && typeof product.product_attributes === "object" && !Array.isArray(product.product_attributes)
      ? product.product_attributes : {};
    const condition = typeof attributes.condition === "string" ? attributes.condition.toLowerCase() : "";
    const price = Number(product.price);
    const stock = Number(product.stock);
    const images = Array.from(new Set([
      ...(Array.isArray(product.image_variants) ? product.image_variants.map((item) => item.image_url).filter((value): value is string => typeof value === "string") : []),
      ...(Array.isArray(product.image_urls) ? product.image_urls : []),
      ...(product.image_url ? [product.image_url] : []),
    ])).filter(publicHttpsUrl).slice(0, 11);
    const title = plainText(product.name, 150);
    const description = plainText(product.seo_content || product.description, 5000);
    const validCondition = ["new", "used", "refurbished"].includes(condition);
    if (!product.slug || !title || !description || !Number.isFinite(price) || price <= 0 ||
        !Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock) || !validCondition || !images.length) {
      skipped += 1;
      return [];
    }

    const link = base + "/marketplace/" + encodeURIComponent(product.slug);
    const availability = stock > 0 ? "in_stock" : "out_of_stock";
    const brand = plainText(attributes.brand, 160);
    const additionalImages = images.slice(1).map((image) => `<g:additional_image_link>${xml(image)}</g:additional_image_link>`).join("");
    return [`<item>
      <g:id>${xml(product.id)}</g:id>
      <g:title>${xml(title)}</g:title>
      <g:description>${xml(description)}</g:description>
      <g:link>${xml(link)}</g:link>
      <g:image_link>${xml(images[0])}</g:image_link>
      ${additionalImages}
      <g:availability>${availability}</g:availability>
      <g:price>${price.toFixed(2)} BDT</g:price>
      <g:condition>${condition}</g:condition>
      ${brand ? `<g:brand>${xml(brand)}</g:brand>` : ""}
    </item>`];
  });

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>AGRIVA Marketplace Products</title>
    <link>${xml(base + "/marketplace")}</link>
    <description>Active AGRIVA marketplace products with required feed fields available.</description>
    ${items.join("\n")}
  </channel>
</rss>`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
      "X-AGRIVA-Feed-Products": String(items.length),
      "X-AGRIVA-Feed-Skipped": String(skipped),
    },
  });
}
