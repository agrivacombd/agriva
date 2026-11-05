import { requireAdminPage } from "@/lib/admin/authz";
import SeoPagesClient from "./seo-pages-client";
export const metadata = { title: "SEO Landing Pages | AGRIVA Admin", robots: { index: false, follow: false } };
export default async function SeoPagesPage() {
  await requireAdminPage("content.read");
  return <SeoPagesClient />;
}
