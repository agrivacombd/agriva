import type {MetadataRoute} from "next";
export default function robots():MetadataRoute.Robots{const base=process.env.NEXT_PUBLIC_SITE_URL||"https://agriva.com.bd";return {rules:{userAgent:"*",allow:["/","/blog","/marketplace","/tools"],disallow:["/admin/","/dashboard/","/api/","/auth/","/orders"]},sitemap:`${base}/sitemap.xml`}}
