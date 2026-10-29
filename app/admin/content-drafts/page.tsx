import { redirect } from "next/navigation";
import { authorizePermission } from "@/lib/auth/server-authorization";
import ContentDraftsClient from "./ContentDraftsClient";

export const metadata = {
  title: "SEO Content Drafts | AGRIVA Admin",
  robots: { index: false, follow: false },
};

export default async function ContentDraftsPage() {
  const auth = await authorizePermission("content.draft");
  if (!auth.ok) {
    if (auth.status === 401) redirect("/login?next=%2Fadmin%2Fcontent-drafts");
    redirect("/dashboard");
  }

  return <ContentDraftsClient />;
}
