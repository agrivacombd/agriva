import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { fingerprintFromRgba, type VisualFingerprint, VISUAL_SIDE } from "@/lib/search/visual-fingerprint";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_PRODUCTS = 150;
const IMAGE_TIMEOUT_MS = 4500;

type PublicProduct = {
  id: string;
  slug: string | null;
  name: string;
  category: string | null;
  price: number | string | null;
  stock: number | null;
  unit: string | null;
  image_url: string | null;
};

function approvedProductImage(input: string, storageUrl: string): boolean {
  try {
    const base = new URL(storageUrl);
    const image = new URL(input);
    return (
      image.protocol === "https:" &&
      image.origin === base.origin &&
      image.username === "" &&
      image.password === "" &&
      image.pathname.startsWith("/storage/v1/object/public/product-images/") &&
      image.search === "" &&
      image.hash === ""
    );
  } catch {
    return false;
  }
}

async function downloadLimitedImage(url: string): Promise<Buffer | null> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS),
    redirect: "error",
    cache: "no-store",
    headers: { Accept: "image/jpeg,image/png,image/webp" },
  });
  if (!response.ok || !response.body) return null;
  const mime = response.headers.get("content-type") || "";
  if (!/^image\/(jpeg|png|webp)(?:\s*;|$)/i.test(mime)) return null;
  const claimedLength = Number(response.headers.get("content-length") || "0");
  if (claimedLength > MAX_IMAGE_BYTES) return null;

  const chunks: Uint8Array[] = [];
  const reader = response.body.getReader();
  let received = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > MAX_IMAGE_BYTES) return null;
      chunks.push(value);
    }
    return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), received);
  } finally {
    await reader.cancel().catch(() => {});
  }
}

const cachedImageFingerprint = unstable_cache(
  async (imageUrl: string, storageUrl: string): Promise<VisualFingerprint | null> => {
    if (!approvedProductImage(imageUrl, storageUrl)) return null;
    try {
      const image = await downloadLimitedImage(imageUrl);
      if (!image) return null;
      const pixels = await sharp(image, { limitInputPixels: 12_000_000 })
        .rotate()
        .resize(VISUAL_SIDE, VISUAL_SIDE, {
          fit: "contain",
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .ensureAlpha()
        .raw()
        .toBuffer();
      return fingerprintFromRgba(pixels);
    } catch (error) {
      console.warn("AGRIVA visual signature unavailable:", error instanceof Error ? error.message : "unknown");
      return null;
    }
  },
  ["agriva-product-visual-fingerprint-v1"],
  { revalidate: 60 * 60 * 6 },
);

async function mapLimited<T, U>(items: T[], concurrency: number, callback: (item: T) => Promise<U>): Promise<U[]> {
  let cursor = 0;
  const result: U[] = new Array(items.length);
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      result[index] = await callback(items[index]);
    }
  }));
  return result;
}

/**
 * Returns fingerprints of PUBLIC product images, never the user's picture.
 * The user-provided photo stays in the browser and is not uploaded or logged.
 * No OpenAI/Gemini/paid visual API is called.
 */
export async function GET() {
  const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!storageUrl || !anonKey) {
    return NextResponse.json({ error: "Visual search is not configured." }, { status: 503 });
  }

  try {
    const supabase = createClient(storageUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.from("products")
      .select("id,slug,name,category,price,stock,unit,image_url")
      .eq("status", "active")
      .eq("marketplace_channel", "marketplace")
      .is("deleted_at", null)
      .not("image_url", "is", null)
      .order("updated_at", { ascending: false })
      .limit(MAX_PRODUCTS);
    if (error) {
      console.error("Visual search catalogue lookup failed:", error.message);
      return NextResponse.json({ error: "Visual catalogue unavailable." }, { status: 503 });
    }

    const listings = (data || []) as PublicProduct[];
    const signatures = await mapLimited(listings, 6, async (product) => {
      if (!product.image_url || !approvedProductImage(product.image_url, storageUrl)) return null;
      const fingerprint = await cachedImageFingerprint(product.image_url, storageUrl);
      return fingerprint ? { ...product, fingerprint } : null;
    });
    const products = signatures.filter((item): item is NonNullable<typeof item> => item !== null);

    return NextResponse.json({
      products,
      indexedCount: products.length,
      // Explicitly disclose the bounded catalogue rather than presenting it as exhaustive.
      limited: listings.length === MAX_PRODUCTS,
      method: "visual-layout-v1",
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("AGRIVA visual index failed:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Visual search is temporarily unavailable." }, { status: 503 });
  }
}
