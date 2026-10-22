import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request, _context: { params: Promise<Record<string, never>> }) {
  // Next.js does not expose a dynamic param for the literal ".txt" suffix
  // in this route segment, so read the key from the requested filename.
  const filename = new URL(request.url).pathname.split("/").pop() ?? "";
  const indexnowKey = filename.endsWith(".txt") ? filename.slice(0, -4) : "";
  if (!indexnowKey || indexnowKey.includes("/") || indexnowKey.includes(".")) {
    return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("site_public_integrations").select("indexnow_key").eq("id", 1).maybeSingle();
  if (!data?.indexnow_key || data.indexnow_key !== indexnowKey) {
    return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  return new Response(data.indexnow_key, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=300" },
  });
}
