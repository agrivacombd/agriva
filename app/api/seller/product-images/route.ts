import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_IMAGES = 4;
const MAX_ORIGINAL_BYTES = 5 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_IMAGES * MAX_ORIGINAL_BYTES + 1024 * 1024;
const MIME_BY_FORMAT: Record<string, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};
const EXTENSION_BY_FORMAT: Record<string, string> = { jpeg: "jpg", png: "png", webp: "webp" };

class UploadError extends Error {
  constructor(message: string, readonly status: number = 400) {
    super(message);
    this.name = "UploadError";
  }
}

type UploadedVariant = {
  original_url: null;
  original_path: string;
  image_url: string;
  card_url: string;
  thumbnail_url: string;
  width: number;
  height: number;
  alt: string;
  filename: string;
  storage_paths: Array<{ bucket: string; path: string }>;
  warnings: string[];
};

function cleanText(value: FormDataEntryValue | null, max: number) {
  return typeof value === "string" ? value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function filenamePart(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 70) || "agriva-product";
}

export async function POST(request: NextRequest) {
  const rawContentLength = request.headers.get("content-length");
  const contentLength = rawContentLength === null ? null : Number(rawContentLength);
  if (rawContentLength !== null && (!Number.isSafeInteger(contentLength) || (contentLength ?? 0) < 1)) {
    return NextResponse.json({ error: "Upload request-এর Content-Length সঠিক নয়।" }, { status: 400 });
  }
  if (contentLength !== null && contentLength > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: "প্রতি ছবি সর্বোচ্চ ৫ MB এবং একবারে সর্বোচ্চ ৪টি ছবি আপলোড করা যাবে।" }, { status: 413 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "ছবি আপলোড করতে লগইন করুন।" }, { status: 401 });

  const { data: membership, error: membershipError } = await supabase
    .from("user_role_memberships").select("role").eq("user_id", user.id)
    .in("role", ["seller", "organization"]).limit(1).maybeSingle();
  if (membershipError || !membership) {
    return NextResponse.json({ error: "শুধু অনুমোদিত seller বা organization ছবি আপলোড করতে পারবেন।" }, { status: 403 });
  }

  let formData: FormData;
  try {
    // Enforce the request cap while streaming too; Content-Length may be absent or untrustworthy.
    const reader = request.body?.getReader();
    if (!reader) return NextResponse.json({ error: "ছবির upload request খালি।" }, { status: 400 });
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_REQUEST_BYTES) {
        await reader.cancel().catch(() => undefined);
        return NextResponse.json({ error: "Upload request-এর মোট আকার সীমা ছাড়িয়েছে। সর্বোচ্চ ৪টি ছবি, প্রতিটি ৫ MB।" }, { status: 413 });
      }
      chunks.push(value);
    }
    const bodyBytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bodyBytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const contentType = request.headers.get("content-type");
    if (!contentType?.toLowerCase().startsWith("multipart/form-data;")) {
      return NextResponse.json({ error: "ছবির upload request-এর format সঠিক নয়।" }, { status: 400 });
    }
    formData = await new Request(request.url, {
      method: "POST",
      headers: { "content-type": contentType },
      body: bodyBytes,
    }).formData();
  } catch {
    return NextResponse.json({ error: "ছবির upload request পড়া যায়নি।" }, { status: 400 });
  }

  const productName = cleanText(formData.get("product_name"), 160);
  const variant = cleanText(formData.get("variant"), 100);
  const packSize = cleanText(formData.get("pack_size"), 80);
  const files = formData.getAll("images").filter((value): value is File => typeof value !== "string" && typeof value.arrayBuffer === "function");
  if (productName.length < 3 || !files.length || files.length > MAX_IMAGES) {
    return NextResponse.json({ error: "পণ্যের নাম এবং ১ থেকে ৪টি ছবি দিন।" }, { status: 400 });
  }
  if (files.some((file) => file.size < 1 || file.size > MAX_ORIGINAL_BYTES)) {
    return NextResponse.json({ error: "প্রতিটি মূল ছবির আকার ৫ MB বা তার কম হতে হবে।" }, { status: 413 });
  }
  if (files.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type))) {
    return NextResponse.json({ error: "শুধু JPEG, PNG অথবা WebP ছবি গ্রহণ করা হয়।" }, { status: 415 });
  }

  const storagePaths: Array<{ bucket: string; path: string }> = [];
  const results: UploadedVariant[] = [];
  const productBase = [productName, variant, packSize].filter(Boolean).join(" ");
  try {
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const buffer = Buffer.from(await file.arrayBuffer());
      let metadata: import("sharp").Metadata;
      let stats: import("sharp").Stats;
      try {
        const decoder = sharp(buffer, { failOn: "error", limitInputPixels: 40_000_000 });
        [metadata, stats] = await Promise.all([decoder.metadata(), decoder.stats()]);
      } catch {
        throw new UploadError(`ছবি ${index + 1} খোলা যাচ্ছে না। ফাইলটি corrupt বা সমর্থিত image নয়।`, 415);
      }

      const format = metadata.format || "";
      const actualMime = MIME_BY_FORMAT[format];
      if (!actualMime || actualMime !== file.type || !metadata.width || !metadata.height ||
          metadata.width < 100 || metadata.height < 100 || metadata.width * metadata.height > 40_000_000) {
        throw new UploadError(`ছবি ${index + 1}-এর আসল format বা dimensions সঠিক নয়। JPEG, PNG বা WebP-এর অন্তত ১০০×১০০ পিক্সেলের ছবি দিন।`, 415);
      }

      const warnings: string[] = [];
      if (metadata.width < 1200 || metadata.height < 1200) {
        warnings.push(`ছবি ${index + 1}: প্রস্তাবিত ১২০০×১২০০-এর চেয়ে ছোট; পণ্যের বিবরণ পরিষ্কার দেখা যাচ্ছে কি না যাচাই করুন।`);
      }
      if (typeof stats.sharpness === "number" && stats.sharpness < 0.08) {
        warnings.push(`ছবি ${index + 1}: ছবিটি ঝাপসা হতে পারে; সম্ভব হলে আরও পরিষ্কার ছবি দিন।`);
      }

      const suffix = crypto.randomUUID();
      const stem = `${filenamePart(productBase)}-${suffix}`;
      const originalPath = `${user.id}/${stem}-original.${EXTENSION_BY_FORMAT[format]}`;
      const sourceUpload = await supabase.storage.from("product-image-originals").upload(originalPath, buffer, {
        contentType: actualMime, cacheControl: "3600", upsert: false,
      });
      if (sourceUpload.error) throw new UploadError("মূল ছবিটি private storage-এ রাখা যায়নি। Storage migration ও permission যাচাই করুন।", 503);
      storagePaths.push({ bucket: "product-image-originals", path: originalPath });

      const sizes = [
        { width: 1200, name: "main" },
        { width: 640, name: "card" },
        { width: 320, name: "thumb" },
      ] as const;
      const urls: Record<string, string> = {};
      let width = 0;
      let height = 0;
      for (const size of sizes) {
        const output = await sharp(buffer, { failOn: "error", limitInputPixels: 40_000_000 })
          .rotate()
          .resize({ width: size.width, height: size.width, fit: "inside", withoutEnlargement: true })
          .webp({ quality: size.width === 1200 ? 84 : 80, effort: 4 })
          .toBuffer({ resolveWithObject: true });
        if (size.name === "main") { width = output.info.width; height = output.info.height; }
        const path = `${user.id}/${stem}-${size.name}.webp`;
        const uploaded = await supabase.storage.from("product-images").upload(path, output.data, {
          contentType: "image/webp", cacheControl: "31536000", upsert: false,
        });
        if (uploaded.error) throw new UploadError("Optimized image upload ব্যর্থ হয়েছে। Storage permission ও configuration যাচাই করুন।", 503);
        storagePaths.push({ bucket: "product-images", path });
        urls[size.name] = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
      }

      results.push({
        original_url: null,
        original_path: originalPath,
        image_url: urls.main,
        card_url: urls.card,
        thumbnail_url: urls.thumb,
        width,
        height,
        alt: `${productBase} — পণ্যের ছবি ${index + 1}`.slice(0, 250),
        filename: `${stem}-main.webp`,
        storage_paths: storagePaths.filter((entry) => entry.path.startsWith(`${user.id}/${stem}-`)),
        warnings,
      });
    }

    return NextResponse.json({ images: results, warnings: results.flatMap((result) => result.warnings) }, { status: 201 });
  } catch (error) {
    for (const bucket of ["product-images", "product-image-originals"]) {
      const paths = storagePaths.filter((entry) => entry.bucket === bucket).map((entry) => entry.path);
      if (paths.length) {
        const { error: cleanupError } = await supabase.storage.from(bucket).remove(paths);
        if (cleanupError) console.error("Image processing cleanup failed", { bucket, count: paths.length, code: cleanupError.name });
      }
    }
    const message = error instanceof Error ? error.message : "ছবি process করা যায়নি।";
    const status = error instanceof UploadError ? error.status : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
