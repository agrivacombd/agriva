import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd"),
  title: {
    default: "AGRIVA — কৃষি ও কৃষকের ডিজিটাল প্ল্যাটফর্ম",
    template: "%s | AGRIVA",
  },
  description:
    "বাংলাদেশের কৃষক, কৃষি উদ্যোক্তা ও রিসেলারদের জন্য AGRIVA—কৃষি পণ্য, স্মার্ট সার্চ, কৃষি তথ্য ও ডিজিটাল টুলস এক জায়গায়।",
  applicationName: "AGRIVA",
  category: "agriculture",
  creator: "AGRIVA",
  publisher: "AGRIVA",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: {
    type: "website",
    siteName: "AGRIVA",
    locale: "bn_BD",
    title: "AGRIVA — কৃষি ও কৃষকের ডিজিটাল প্ল্যাটফর্ম",
    description: "কৃষি পণ্য, স্মার্ট সার্চ ও কৃষি সহায়তা—এক জায়গায়।",
  },
  twitter: {
    card: "summary_large_image",
    title: "AGRIVA — কৃষি ও কৃষকের ডিজিটাল প্ল্যাটফর্ম",
    description: "বাংলাদেশের কৃষক ও কৃষি উদ্যোক্তাদের জন্য ডিজিটাল প্ল্যাটফর্ম।",
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createSupabaseServerClient();
  const { data: googleSettings } = await supabase.from("site_public_integrations").select("ga4_measurement_id,google_site_verification,bing_site_verification,merchant_center_verification,yandex_verification,pinterest_verification,facebook_domain_verification,tiktok_verification,google_tag_manager_id,google_ads_conversion_id").eq("id", 1).maybeSingle();
  const gaMeasurementId = googleSettings?.ga4_measurement_id || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const googleVerification = googleSettings?.google_site_verification || process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
  const bingVerification = googleSettings?.bing_site_verification;
  const merchantVerification = googleSettings?.merchant_center_verification;
  const yandexVerification = googleSettings?.yandex_verification;
  const pinterestVerification = googleSettings?.pinterest_verification;
  const facebookVerification = googleSettings?.facebook_domain_verification;
  const tiktokVerification = googleSettings?.tiktok_verification;
  const gtmId = googleSettings?.google_tag_manager_id;
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://agriva.com.bd").replace(/\/$/, "");
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${base}/#organization`,
    name: "AGRIVA",
    url: base,
    description: "বাংলাদেশের কৃষক, কৃষি উদ্যোক্তা ও রিসেলারদের জন্য কৃষি পণ্য ও ডিজিটাল কৃষি প্ল্যাটফর্ম।",
    areaServed: { "@type": "Country", name: "Bangladesh" },
  };
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${base}/#website`,
    url: base,
    name: "AGRIVA",
    inLanguage: ["bn-BD", "en"],
    publisher: { "@id": `${base}/#organization` },
  };
  return (
    <html lang="bn">
      <head>
        {googleVerification && <meta name="google-site-verification" content={googleVerification} />}
        {merchantVerification && <meta name="google-site-verification" content={merchantVerification} />}
        {bingVerification && <meta name="msvalidate.01" content={bingVerification} />}
        {yandexVerification && <meta name="yandex-verification" content={yandexVerification} />}
        {pinterestVerification && <meta name="p:domain_verify" content={pinterestVerification} />}
        {facebookVerification && <meta name="facebook-domain-verification" content={facebookVerification} />}
        {tiktokVerification && <meta name="tiktok-developers-site-verification" content={tiktokVerification} />}
      </head>
      <body>
        {gtmId && /^GTM-[A-Z0-9]+$/.test(gtmId) && <Script id="agriva-gtm" strategy="afterInteractive">{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}</Script>}
        {gaMeasurementId && /^G-[A-Z0-9]+$/.test(gaMeasurementId) && <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`} strategy="afterInteractive" />
          <Script id="agriva-ga4" strategy="afterInteractive">{`window.dataLayer = window.dataLayer || []; function gtag(){window.dataLayer.push(arguments);} gtag("js", new Date()); gtag("config", "${gaMeasurementId}", { anonymize_ip: true });`}</Script>
        </>}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema).replace(/</g, "\\u003c") }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema).replace(/</g, "\\u003c") }} />
        {children}
      </body>
    </html>
  );
}
