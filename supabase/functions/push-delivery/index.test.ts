import { createPushDeliveryHandler } from "./index.ts";

type Job = { queue_id: string; notification_id: string; user_id: string; attempt_count: number };
type Subscription = { id: string; endpoint: string; p256dh: string; auth_key: string };

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function harness(subscriptions: Subscription[], send: (endpoint: string, payload: string) => Promise<void>) {
  const job: Job = { queue_id: "queue-1", notification_id: "notification-1", user_id: "user-1", attempt_count: 1 };
  const calls: { completed: Array<Record<string, unknown>>; deleted: string[]; preferenceUpdates: Array<Record<string, unknown>>; payloads: string[] } = {
    completed: [], deleted: [], preferenceUpdates: [], payloads: [],
  };
  let preference = true;

  const supabase = {
    rpc: async (name: string, args: Record<string, unknown>) => {
      if (name === "claim_push_delivery_batch") return { data: [job], error: null };
      if (name === "complete_push_delivery") {
        calls.completed.push(args);
        return { data: null, error: null };
      }
      return { data: null, error: { message: "Unexpected RPC" } };
    },
    from: (table: string) => {
      const filters: Record<string, string> = {};
      let updateValues: Record<string, unknown> | null = null;
      let deleting = false;
      const query: any = {
        select: () => query,
        update: (values: Record<string, unknown>) => { updateValues = values; return query; },
        delete: () => { deleting = true; return query; },
        eq: (key: string, value: string) => { filters[key] = value; return query; },
        maybeSingle: async () => table === "notifications"
          ? { data: { id: job.notification_id, event_type: "matching_harvest", title: "Harvest match", body: "A buyer is interested", href: "https://evil.example/phish" }, error: null }
          : { data: { push_enabled: preference }, error: null },
        then: (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) => {
          let result: unknown;
          if (table === "push_subscriptions" && deleting) {
            calls.deleted.push(filters.id);
            result = { error: null };
          } else if (table === "push_subscriptions") {
            result = { data: subscriptions.filter((item) => item.user_id === undefined || item.user_id === filters.user_id), error: null };
          } else if (table === "notification_preferences" && updateValues) {
            calls.preferenceUpdates.push(updateValues);
            if (updateValues.push_enabled === false) preference = false;
            result = { error: null };
          } else {
            result = { data: [], error: null };
          }
          return Promise.resolve(result).then(resolve, reject);
        },
      };
      return query;
    },
  };

  const webpush = {
    setVapidDetails: () => {},
    sendNotification: async (subscription: any, payload: string) => {
      calls.payloads.push(payload);
      await send(subscription.endpoint, payload);
    },
  };
  const envValues: Record<string, string> = {
    PUSH_DISPATCH_SECRET: "test-dispatch-secret",
    SUPABASE_URL: "https://supabase.invalid",
    SUPABASE_SERVICE_ROLE_KEY: "synthetic-service-role-key",
    VAPID_SUBJECT: "mailto:qa@example.invalid",
    VAPID_PUBLIC_KEY: "synthetic-public-key",
    VAPID_PRIVATE_KEY: "synthetic-private-key",
  };
  const handler = createPushDeliveryHandler({
    createSupabase: () => supabase,
    webpush,
    env: (name) => envValues[name],
  });
  const request = (secret = "test-dispatch-secret") => new Request("https://edge.invalid/push-delivery", {
    method: "POST",
    headers: { "x-push-dispatch-secret": secret },
    body: "{}",
  });
  return { handler, request, calls, getPreference: () => preference };
}

const subscription = (id: string, endpoint: string): Subscription => ({
  id, endpoint, p256dh: "synthetic-p256dh", auth_key: "synthetic-auth",
});

Deno.test("mock provider: successful send removes expired 410 endpoint and safely scopes click URL", async () => {
  const test = harness([
    subscription("active-1", "https://push.example/active"),
    subscription("expired-1", "https://push.example/expired"),
  ], async (endpoint) => {
    if (endpoint.endsWith("/expired")) throw Object.assign(new Error("Gone"), { statusCode: 410 });
  });

  const response = await test.handler(test.request());
  const body = await response.json();
  assert(response.status === 200, "worker should return HTTP 200");
  assert(body.delivered === 1 && body.retried === 0, "successful endpoint should complete the job");
  assert(test.calls.deleted.length === 1 && test.calls.deleted[0] === "expired-1", "410 endpoint must be deleted");
  assert(test.calls.completed[0].p_success === true, "delivery should be finalized successfully");
  const payload = JSON.parse(test.calls.payloads[0]);
  assert(payload.url === "/notifications", "external notification href must fall back to a same-origin path");
});

Deno.test("mock provider: transient provider failure schedules a retry", async () => {
  const test = harness([subscription("active-2", "https://push.example/transient")], async () => {
    throw Object.assign(new Error("Synthetic provider unavailable"), { statusCode: 503 });
  });

  const response = await test.handler(test.request());
  const body = await response.json();
  assert(response.status === 200, "worker should return HTTP 200");
  assert(body.retried === 1 && body.delivered === 0, "transient provider failure must be retried");
  assert(test.calls.completed[0].p_success === false, "completion RPC must schedule retry");
  assert(String(test.calls.completed[0].p_error).includes("Synthetic provider unavailable"), "retry should retain provider error");
  assert(test.calls.deleted.length === 0, "transient endpoint must not be deleted");
});

Deno.test("mock provider: all 404/410 endpoints are removed and push is disabled", async () => {
  const test = harness([
    subscription("expired-404", "https://push.example/404"),
    subscription("expired-410", "https://push.example/410"),
  ], async (endpoint) => {
    throw Object.assign(new Error("Expired"), { statusCode: endpoint.endsWith("/404") ? 404 : 410 });
  });

  const response = await test.handler(test.request());
  const body = await response.json();
  assert(response.status === 200, "worker should return HTTP 200");
  assert(body.retried === 0, "expired endpoints are terminal and should not retry");
  assert(test.calls.deleted.length === 2, "all expired endpoints must be deleted");
  assert(test.getPreference() === false, "push preference must be disabled when no endpoint remains");
  assert(test.calls.completed[0].p_success === true, "job should be terminally completed after cleanup");
});

Deno.test("worker rejects a missing or invalid dispatch secret before creating a client", async () => {
  let clientCreated = false;
  const handler = createPushDeliveryHandler({
    createSupabase: () => { clientCreated = true; throw new Error("must not run"); },
    webpush: { setVapidDetails: () => {}, sendNotification: async () => {} },
    env: (name) => name === "PUSH_DISPATCH_SECRET" ? "expected-secret" : "unused",
  });
  const response = await handler(new Request("https://edge.invalid/push-delivery", {
    method: "POST", headers: { "x-push-dispatch-secret": "wrong-secret" }, body: "{}",
  }));
  assert(response.status === 401, "invalid dispatch secret must be rejected");
  assert(!clientCreated, "Supabase client must not be created for unauthorized requests");
});
