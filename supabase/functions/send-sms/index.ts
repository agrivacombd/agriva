// @ts-nocheck -- This file runs in the Supabase Deno Edge Runtime, not the Next.js Node.js type environment.
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

type SendSmsEvent = {
  user?: { phone?: string };
  sms?: { otp?: string };
};

const ONE9_ENDPOINT = "https://sms.one9.one/api/v3/sms/send";

function normalizeRecipient(phone: string): string | null {
  const digits = phone.replace(/[^0-9]/g, "");
  const recipient = digits.startsWith("00880") ? digits.slice(2)
    : digits.startsWith("880") ? digits
    : digits.startsWith("0") ? "88" + digits
    : digits.startsWith("1") ? "880" + digits
    : "";
  return /^8801[3-9]\d{8}$/.test(recipient) ? recipient : null;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const secret = Deno.env.get("SEND_SMS_HOOK_SECRET")?.replace(/^v1,whsec_/, "");
  const apiKey = Deno.env.get("ONE9_SMS_API_KEY");
  if (!secret || !apiKey) {
    console.error("SMS hook configuration missing");
    return new Response("SMS provider is not configured", { status: 500 });
  }

  let event: SendSmsEvent;
  try {
    const rawBody = await req.text();
    const webhook = new Webhook(secret);
    event = webhook.verify(rawBody, Object.fromEntries(req.headers)) as SendSmsEvent;
  } catch {
    return new Response("Invalid webhook signature", { status: 401 });
  }

  const phone = typeof event.user?.phone === "string" ? normalizeRecipient(event.user.phone) : null;
  const otp = typeof event.sms?.otp === "string" ? event.sms.otp : "";
  if (!phone || !/^\d{6}$/.test(otp)) {
    console.error("SMS hook payload rejected");
    return new Response("Invalid SMS payload", { status: 400 });
  }

  const message = `Your AGRIVA verification code is ${otp}. Do not share this code with anyone.`;
  try {
    const response = await fetch(ONE9_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ recipient: phone, sender_id: "AGRIVA", message, type: "plain" }),
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) {
      console.error("One9 SMS delivery failed", { status: response.status });
      return new Response("SMS delivery failed", { status: 502 });
    }
    return new Response(null, { status: 200 });
  } catch {
    console.error("One9 SMS request failed");
    return new Response("SMS delivery failed", { status: 502 });
  }
});
