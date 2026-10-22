import { createSign } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ServiceAccount = { client_email: string; private_key: string; token_uri?: string };
function b64url(value: string) { return Buffer.from(value).toString("base64url"); }
function dateDaysAgo(days: number) { const d = new Date(); d.setUTCDate(d.getUTCDate() - days); return d.toISOString().slice(0, 10); }

async function getAccessToken(account: ServiceAccount, scopes: string[]) {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(JSON.stringify({
    iss: account.client_email, scope: scopes.join(" "), aud: account.token_uri || "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3600,
  }))}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  const assertion = `${unsigned}.${signer.sign(account.private_key, "base64url")}`;
  const response = await fetch(account.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Google OAuth token request failed (${response.status})`);
  const data = await response.json() as { access_token?: string };
  if (!data.access_token) throw new Error("Google OAuth response did not include an access token");
  return data.access_token;
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const serviceJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const propertyId = process.env.GA4_PROPERTY_ID;
  const siteUrl = process.env.GSC_SITE_URL;
  const measurementIdConfigured = Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);
  const verificationConfigured = Boolean(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION);
  const report = {
    generatedAt: new Date().toISOString(),
    period: { startDate: dateDaysAgo(28), endDate: dateDaysAgo(1), description: "Last 28 complete UTC days" },
    setup: {
      ga4MeasurementConfigured: measurementIdConfigured,
      ga4ReportingConfigured: Boolean(propertyId && serviceJson),
      searchConsoleVerificationConfigured: verificationConfigured,
      searchConsoleReportingConfigured: Boolean(siteUrl && serviceJson),
    },
    ga4: null as unknown,
    searchConsole: null as unknown,
    errors: [] as string[],
  };
  if (!serviceJson || (!propertyId && !siteUrl)) {
    return NextResponse.json({ ...report, message: "Set GOOGLE_SERVICE_ACCOUNT_JSON and the GA4_PROPERTY_ID and/or GSC_SITE_URL server-side variables to enable reports." }, { headers: { "Cache-Control": "no-store" } });
  }
  let account: ServiceAccount;
  try {
    account = JSON.parse(serviceJson) as ServiceAccount;
    if (!account.client_email || !account.private_key) throw new Error("Service account JSON is missing client_email/private_key");
  } catch {
    return NextResponse.json({ ...report, errors: ["GOOGLE_SERVICE_ACCOUNT_JSON is invalid."] }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  let token: string;
  try {
    token = await getAccessToken(account, [
      ...(propertyId ? ["https://www.googleapis.com/auth/analytics.readonly"] : []),
      ...(siteUrl ? ["https://www.googleapis.com/auth/webmasters.readonly"] : []),
    ]);
  } catch {
    return NextResponse.json({ ...report, errors: ["Google authentication failed; check service-account credentials and API access."] }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const startDate = dateDaysAgo(28), endDate = dateDaysAgo(1);
  const tasks: Promise<void>[] = [];
  if (propertyId) tasks.push((async () => {
    try {
      const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:runReport`, {
        method: "POST", headers, cache: "no-store",
        body: JSON.stringify({ dateRanges: [{ startDate, endDate }], dimensions: [{ name: "date" }], metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "eventCount" }], limit: 31 }),
      });
      if (!response.ok) throw new Error(String(response.status));
      report.ga4 = await response.json();
    } catch (error) { report.errors.push(`GA4 report failed (${error instanceof Error ? error.message : "unknown error"}).`); }
  })());
  if (siteUrl) tasks.push((async () => {
    try {
      const response = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
        method: "POST", headers, cache: "no-store",
        body: JSON.stringify({ startDate, endDate, dimensions: ["date"], rowLimit: 28, dataState: "final" }),
      });
      if (!response.ok) throw new Error(String(response.status));
      report.searchConsole = await response.json();
    } catch (error) { report.errors.push(`Search Console report failed (${error instanceof Error ? error.message : "unknown error"}).`); }
  })());
  await Promise.all(tasks);
  return NextResponse.json(report, { headers: { "Cache-Control": "no-store" } });
}
