import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(_request: Request, context: { params: Promise<{ indexnowKey: string }> }) {
  const { indexnowKey } = await context.params;
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
