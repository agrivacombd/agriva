import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    analytics: {
      provider: "Google Analytics 4",
      measurementIdConfigured: Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID),
      propertyReportingApiConfigured: Boolean(process.env.GA4_PROPERTY_ID && process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
      note: "This endpoint reports configuration only; it does not fabricate traffic metrics.",
    },
    searchConsole: {
      verificationConfigured: Boolean(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION),
      apiReportingConfigured: Boolean(process.env.GSC_SITE_URL && process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
      note: "Search Console API requires a service account with access to the verified property.",
    },
    nextSteps: [
      "Set NEXT_PUBLIC_GA_MEASUREMENT_ID to enable GA4 page measurement.",
      "Verify agriva.com.bd in Google Search Console and set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION if using HTML verification meta.",
      "For API reports, set GA4_PROPERTY_ID, GSC_SITE_URL and GOOGLE_SERVICE_ACCOUNT_JSON in server-only environment variables.",
    ],
  }, { headers: { "Cache-Control": "no-store" } });
}
