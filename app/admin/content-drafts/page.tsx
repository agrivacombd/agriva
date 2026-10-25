import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ContentDraftsClient from "./ContentDraftsClient";

export const metadata = {
  title: "SEO Content Drafts | AGRIVA Admin",
  robots: { index: false, follow: false },
};

export default async function ContentDraftsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=%2Fadmin%2Fcontent-drafts");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || profile?.role !== "admin") redirect("/dashboard");

  return <ContentDraftsClient />;
}
