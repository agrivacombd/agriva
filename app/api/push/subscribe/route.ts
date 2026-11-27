import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAllowedPushEndpoint, isValidPushKey } from "@/lib/push/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  if (!publicKey || !isValidPushKey(publicKey, 60, 200)) {
    return Response.json({ error: "Browser push is not configured yet." }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
  return Response.json({ publicKey }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()) {
    return Response.json({ error: "Browser push is not enabled in this environment." }, { status: 503 });
  }

  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  let payload: { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const endpoint = payload.endpoint;
  const p256dh = payload.keys?.p256dh;
  const authKey = payload.keys?.auth;
  if (!isAllowedPushEndpoint(endpoint)
      || !isValidPushKey(p256dh, 40, 200)
      || !isValidPushKey(authKey, 16, 100)) {
    return Response.json({ error: "Invalid browser push subscription." }, { status: 400 });
  }

  const sessionClient = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await sessionClient.auth.getUser();
  if (authError || !user) return Response.json({ error: "Authentication required." }, { status: 401 });

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || !supabaseUrl) {
    return Response.json({ error: "Push subscription storage is not configured." }, { status: 503 });
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: subscriptionError } = await supabase.from("push_subscriptions").upsert({
    user_id: user.id,
    endpoint,
    p256dh,
    auth_key: authKey,
    user_agent: request.headers.get("user-agent")?.slice(0, 512) ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,endpoint" });

  if (subscriptionError) {
    return Response.json({ error: "Could not save this device subscription." }, { status: 500 });
  }

  const { error: preferenceError } = await sessionClient.from("notification_preferences").upsert({
    user_id: user.id,
    push_enabled: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  if (preferenceError) {
    await supabase.from("push_subscriptions").delete().eq("user_id", user.id).eq("endpoint", endpoint);
    return Response.json({ error: "Could not enable push preferences." }, { status: 500 });
  }

  return Response.json({ success: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
