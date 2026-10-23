"use server";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export async function applyToJob(formData:FormData){
 const db=await createSupabaseServerClient();const {data:{user}}=await db.auth.getUser();if(!user)redirect("/login?next="+encodeURIComponent("/jobs/"+String(formData.get("slug")||"")+"/apply"));
 const jobId=String(formData.get("job_id")||"");const slug=String(formData.get("slug")||"");const note=String(formData.get("cover_note")||"").trim().slice(0,3000);const experience=String(formData.get("experience_summary")||"").trim().slice(0,3000);
 const {error}=await db.from("job_applications").insert({job_id:jobId,candidate_id:user.id,cover_note:note||null,experience_summary:experience||null});
 if(error)redirect("/jobs/"+encodeURIComponent(slug)+"/apply?error=submit");redirect("/jobs/"+encodeURIComponent(slug)+"/apply?submitted=1");
}