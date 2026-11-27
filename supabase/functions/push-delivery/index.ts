import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import webpush from "npm:web-push@3.6.7";

type DeliveryJob = { queue_id: string; notification_id: string; user_id: string; attempt_count: number };
type NotificationRow = { id: string; event_type: string; title: string; body: string; href: string };
type PushSubscriptionRow = { id: string; endpoint: string; p256dh: string; auth_key: string };
type SupabaseLike = {
  rpc: (name: string, args: Record<string, unknown>) => Promise<{ data?: any; error?: any }>;
  from: (table: string) => any;
};
type WebPushLike = {
  setVapidDetails: (subject: string, publicKey: string, privateKey: string) => void;
  sendNotification: (subscription: unknown, payload: string, options: unknown) => Promise<unknown>;
};
type WorkerDependencies = {
  createSupabase: (url: string, key: string) => SupabaseLike;
  webpush: WebPushLike;
  env: (name: string) => string | undefined;
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

function constantTimeEqual(left: string, right: string): boolean {
  if (!left || !right || left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}

export function createPushDeliveryHandler(deps: WorkerDependencies) {
  return async (request: Request): Promise<Response> => {
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const dispatchSecret = deps.env("PUSH_DISPATCH_SECRET") ?? "";
    const suppliedSecret = request.headers.get("x-push-dispatch-secret") ?? "";
    if (!constantTimeEqual(dispatchSecret, suppliedSecret)) return json({ error: "Unauthorized" }, 401);

    let supabase: SupabaseLike;
    try {
      const required = (name: string) => {
        const value = deps.env(name)?.trim();
        if (!value) throw new Error(`Missing required environment variable: ${name}`);
        return value;
      };
      supabase = deps.createSupabase(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"));
      deps.webpush.setVapidDetails(
        required("VAPID_SUBJECT"),
        required("VAPID_PUBLIC_KEY"),
        required("VAPID_PRIVATE_KEY"),
      );
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Push worker configuration error" }, 503);
    }

    const { data: jobs, error: claimError } = await supabase.rpc("claim_push_delivery_batch", { p_batch_size: 20 });
    if (claimError) return json({ error: "Could not claim push jobs" }, 500);

    let delivered = 0;
    let retried = 0;
    let skipped = 0;

    for (const job of (jobs ?? []) as DeliveryJob[]) {
      try {
        const [notificationResult, preferenceResult, subscriptionResult] = await Promise.all([
          supabase.from("notifications").select("id,event_type,title,body,href")
            .eq("id", job.notification_id).eq("user_id", job.user_id).maybeSingle(),
          supabase.from("notification_preferences").select("push_enabled")
            .eq("user_id", job.user_id).maybeSingle(),
          supabase.from("push_subscriptions").select("id,endpoint,p256dh,auth_key")
            .eq("user_id", job.user_id),
        ]);
        if (notificationResult.error || preferenceResult.error || subscriptionResult.error) {
          throw new Error("Could not load push recipient data");
        }

        const notification = notificationResult.data as NotificationRow | null;
        const subscriptions = (subscriptionResult.data ?? []) as PushSubscriptionRow[];
        if (!notification || !preferenceResult.data?.push_enabled || subscriptions.length === 0) {
          if (notification && preferenceResult.data?.push_enabled && subscriptions.length === 0) {
            const { error } = await supabase.from("notification_preferences")
              .update({ push_enabled: false, updated_at: new Date().toISOString() }).eq("user_id", job.user_id);
            if (error) throw new Error("Could not disable push without active devices");
          }
          const { error } = await supabase.rpc("complete_push_delivery", {
            p_queue_id: job.queue_id, p_success: true, p_error: null,
          });
          if (error) throw new Error("Could not complete skipped push job");
          skipped += 1;
          continue;
        }

        const payload = JSON.stringify({
          title: notification.title,
          body: notification.body,
          url: notification.href.startsWith("/") ? notification.href : "/notifications",
          tag: `agriva-${notification.event_type}-${notification.id}`,
          icon: "/branding/agriva-app-icon-192.png",
          badge: "/branding/agriva-app-icon-192.png",
        });

        let successfulSends = 0;
        const transientErrors: string[] = [];
        for (const subscription of subscriptions) {
          try {
            await deps.webpush.sendNotification({
              endpoint: subscription.endpoint,
              keys: { p256dh: subscription.p256dh, auth: subscription.auth_key },
            }, payload, { TTL: 3600, urgency: "normal" });
            successfulSends += 1;
          } catch (error) {
            const statusCode = typeof error === "object" && error !== null && "statusCode" in error
              ? Number((error as { statusCode?: unknown }).statusCode) : 0;
            if (statusCode === 404 || statusCode === 410) {
              const { error: deleteError } = await supabase.from("push_subscriptions").delete()
                .eq("id", subscription.id).eq("user_id", job.user_id);
              if (deleteError) transientErrors.push("Could not remove expired push endpoint");
            } else {
              transientErrors.push(error instanceof Error ? error.message : "Push provider error");
            }
          }
        }

        const succeeded = successfulSends > 0 || transientErrors.length === 0;
        if (successfulSends === 0 && transientErrors.length === 0) {
          const { error } = await supabase.from("notification_preferences")
            .update({ push_enabled: false, updated_at: new Date().toISOString() }).eq("user_id", job.user_id);
          if (error) throw new Error("Could not disable push after all endpoints expired");
        }
        const { error: completionError } = await supabase.rpc("complete_push_delivery", {
          p_queue_id: job.queue_id,
          p_success: succeeded,
          p_error: transientErrors.slice(0, 3).join("; ").slice(0, 1000) || null,
        });
        if (completionError) throw new Error("Could not persist push delivery result");
        if (succeeded) delivered += 1;
        else retried += 1;
      } catch (error) {
        const { error: completionError } = await supabase.rpc("complete_push_delivery", {
          p_queue_id: job.queue_id,
          p_success: false,
          p_error: error instanceof Error ? error.message : "Unknown push worker error",
        });
        if (!completionError) retried += 1;
      }
    }

    return json({ claimed: (jobs ?? []).length, delivered, retried, skipped });
  };
}

const handler = createPushDeliveryHandler({
  createSupabase: (url, key) => createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  }) as unknown as SupabaseLike,
  webpush: webpush as unknown as WebPushLike,
  env: (name) => Deno.env.get(name),
});

if (import.meta.main) Deno.serve(handler);
