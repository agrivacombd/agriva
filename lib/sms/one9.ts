const ONE9_ENDPOINT = "https://sms.one9.one/api/v3/sms/send";

function normalizeRecipient(input: string): string | null {
  const digits = input.trim().replace(/[^0-9]/g, "");
  const recipient = digits.startsWith("00880") ? digits.slice(2)
    : digits.startsWith("880") ? digits
    : digits.startsWith("0") ? "88" + digits
    : digits.startsWith("1") ? "880" + digits
    : "";
  return /^8801[3-9]\d{8}$/.test(recipient) ? recipient : null;
}

export async function sendAgrivaSms(phone: string, message: string): Promise<boolean> {
  const apiKey = process.env.ONE9_SMS_API_KEY;
  const recipient = normalizeRecipient(phone);
  if (!apiKey || !recipient || !message.trim()) {
    if (!apiKey) console.warn("[sms] ONE9_SMS_API_KEY is not configured");
    return false;
  }

  try {
    const response = await fetch(ONE9_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient,
        sender_id: "AGRIVA",
        message: message.trim().slice(0, 900),
        type: "plain",
      }),
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("[sms] One9 delivery failed", { status: response.status });
      return false;
    }
    return true;
  } catch {
    console.error("[sms] One9 request failed");
    return false;
  }
}

export function orderConfirmationMessage(orderId: string, total: number): string {
  return `AGRIVA: Order #${orderId.slice(0, 8)} confirmed. COD total BDT ${Math.round(total)}. Track: agriva.com.bd/orders`;
}

export function orderStatusMessage(orderId: string, status: string): string {
  const labels: Record<string, string> = {
    processing: "is being processed",
    shipped: "has been shipped",
    delivered: "has been delivered",
    completed: "is completed",
    cancelled: "has been cancelled",
  };
  const label = labels[status];
  return label ? `AGRIVA: Order #${orderId.slice(0, 8)} ${label}. Track: agriva.com.bd/orders` : "";
}
