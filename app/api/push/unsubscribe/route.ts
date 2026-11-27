import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAllowedPushEndpoint } from "@/lib/push/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  let payload: { endpoint?: unknown };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (payload.endpoint !== undefined && !isAllowedPushEndpoint(payload.endpoint)) {
    return Response.json({ error: "Invalid browser push endpoint." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return Response.json({ error: "Authentication required." }, { status: 401 });

  let deletion = supabase.from("push_subscriptions").delete().eq("user_id", user.id);
  if (typeof payload.endpoint === "string") deletion = deletion.eq("endpoint", payload.endpoint);
  const { error: deleteError } = await deletion;
  if (deleteError) return Response.json({ error: "Could not remove this device." }, { status: 500 });

  const { count, error: countError } = await supabase.from("push_subscriptions")
    .select("id", { count: "exact", head: true }).eq("user_id", user.id);
  if (countError) return Response.json({ error: "Could not verify remaining devices." }, { status: 500 });

  const { error: preferenceError } = await supabase.from("notification_preferences").upsert({
    user_id: user.id,
    push_enabled: (count ?? 0) > 0,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (preferenceError) return Response.json({ error: "Could not update push preferences." }, { status: 500 });

  return Response.json({ success: true, pushEnabled: (count ?? 0) > 0 }, {
    headers: { "Cache-Control": "no-store" },
  });
}
