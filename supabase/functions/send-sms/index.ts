import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Webhook } from "npm:standardwebhooks@1.0.0";

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

function requiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function normalizeBangladeshPhone(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const compact = value.replace(/[\s()-]/g, "");
  const digits = compact.startsWith("+") ? compact.slice(1) : compact;
  if (/^8801[3-9]\d{8}$/.test(digits)) return digits;
  if (/^01[3-9]\d{8}$/.test(digits)) return `88${digits}`;
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const rawBody = await req.text();
    if (rawBody.length > 32_768) return json({ error: "Payload too large" }, 413);

    // Supabase generates a v1,whsec_<base64> secret. The Webhook library
    // expects the base64 portion for its default base64 secret format.
    const configuredSecret = requiredEnv("SEND_SMS_HOOK_SECRET");
    const secret = configuredSecret.replace(/^v1,whsec_/, "");
    if (secret === configuredSecret || !/^[A-Za-z0-9+/]+=*$/.test(secret)) {
      return json({ error: "Invalid webhook secret configuration" }, 500);
    }

    let event: { user?: { phone?: string }; sms?: { otp?: string } };
    try {
      const headers = {
        "webhook-id": req.headers.get("webhook-id") ?? "",
        "webhook-timestamp": req.headers.get("webhook-timestamp") ?? "",
        "webhook-signature": req.headers.get("webhook-signature") ?? "",
      };
      event = new Webhook(secret).verify(rawBody, headers) as typeof event;
    } catch {
      return json({ error: "Invalid webhook signature" }, 401);
    }

    const phone = normalizeBangladeshPhone(event.user?.phone);
    const otp = event.sms?.otp;
    if (!phone || typeof otp !== "string" || !/^\d{4,10}$/.test(otp)) {
      return json({ error: "Invalid SMS event payload" }, 400);
    }

    const apiKey = requiredEnv("ONE9_SMS_API_KEY");
    const senderId = Deno.env.get("ONE9_SENDER_ID")?.trim() || "AGRIVA";
    const message = `Your AGRIVA verification code is ${otp}. It expires soon. Do not share this code with anyone.`;

    const providerResponse = await fetch("https://sms.one9.one/api/v3/sms/send", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        recipient: phone,
        sender_id: senderId,
        message,
        type: "plain",
      }),
      signal: AbortSignal.timeout(12_000),
    });

    if (!providerResponse.ok) {
      // Do not log OTP, phone, API key, or provider response body (may contain PII).
      console.error("One9 SMS provider rejected request", { status: providerResponse.status });
      return json({ error: "SMS provider request failed" }, 502);
    }

    return json({});
  } catch (error) {
    console.error("Send SMS hook failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return json({ error: "SMS delivery unavailable" }, 500);
  }
});
