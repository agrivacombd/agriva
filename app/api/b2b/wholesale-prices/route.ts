import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RequestedItem = { product_id: string; quantity: number };

/**
 * Private B2B pricing contract.
 *
 * This route deliberately delegates all authorization and tier calculations to
 * a narrowly scoped database RPC. Until that RPC is installed and reviewed,
 * requests fail closed. Never replace this with a direct table query or a
 * client-supplied price.
 */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "B2B মূল্য দেখতে লগইন করুন।" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !Array.isArray((body as { items?: unknown }).items)) {
    return NextResponse.json({ error: "পণ্যের তালিকা সঠিক নয়।" }, { status: 400 });
  }

  const rawItems = (body as { items: unknown[] }).items;
  if (rawItems.length < 1 || rawItems.length > 50) {
    return NextResponse.json({ error: "একবারে ১ থেকে ৫০টি পণ্য নির্বাচন করুন।" }, { status: 400 });
  }

  const items: RequestedItem[] = [];
  for (const raw of rawItems) {
    if (!raw || typeof raw !== "object") {
      return NextResponse.json({ error: "পণ্যের তথ্য সঠিক নয়।" }, { status: 400 });
    }
    const item = raw as Record<string, unknown>;
    const productId = typeof item.productId === "string" ? item.productId : "";
    const quantity = Number(item.quantity);
    if (!UUID_PATTERN.test(productId) || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 10000) {
      return NextResponse.json({ error: "পণ্যের আইডি বা পরিমাণ সঠিক নয়।" }, { status: 400 });
    }
    items.push({ product_id: productId, quantity });
  }

  // This RPC is intentionally a hard dependency: it must atomically verify
  // current approved B2B status AND active marketplace.wholesale_prices.view
  // grant, then return only eligible product/tier prices for the given items.
  // It must use auth.uid(), locked search_path, explicit grants, and fail closed.
  const { data, error } = await supabase.rpc("get_authorized_wholesale_prices", {
    p_items: items,
  });

  if (error || !Array.isArray(data)) {
    // Do not leak SQL/function details or fall back to retail/public reads.
    return NextResponse.json(
      { error: "Wholesale মূল্য যাচাই করা যাচ্ছে না। অনুমতি ও ব্যবসায়িক যাচাই নিশ্চিত করে আবার চেষ্টা করুন।" },
      { status: 503 },
      );
  }

  return NextResponse.json(
    { items: data },
    { headers: { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie, Authorization" } },
  );
}
