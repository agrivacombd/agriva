"use server";
import { redirect } from "next/navigation";
import { authorizePermission } from "@/lib/auth/server-authorization";

export async function applyToJob(slug: string, formData: FormData) {
  const safeSlug = slug.trim();
  const applyPath = "/jobs/" + encodeURIComponent(safeSlug) + "/apply";
  const authorization = await authorizePermission("jobs.apply_own");
  if (!authorization.ok) {
    if (authorization.status === 401) redirect("/login?next=" + encodeURIComponent(applyPath));
    redirect(applyPath + "?error=permission");
  }
  const { supabase: db, user } = authorization;

  const { data: job, error: jobError } = await db
    .from("job_posts")
    .select("id, application_deadline")
    .eq("slug", safeSlug)
    .eq("status", "published")
    .maybeSingle();

  if (
    jobError ||
    !job ||
    (job.application_deadline && new Date(job.application_deadline).getTime() <= Date.now())
  ) {
    redirect(applyPath + "?error=submit");
  }

  const note = String(formData.get("cover_note") || "").trim().slice(0, 3000);
  const experience = String(formData.get("experience_summary") || "").trim().slice(0, 3000);
  const { error } = await db.from("job_applications").insert({
    job_id: job.id,
    candidate_id: user.id,
    cover_note: note || null,
    experience_summary: experience || null,
  });

  if (error) redirect(applyPath + "?error=submit");
  redirect(applyPath + "?submitted=1");
}
