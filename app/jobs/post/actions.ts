"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const value = (f: FormData, k: string, max = 500) => String(f.get(k) ?? "").trim().slice(0, max);
const slugify = (s: string) => s.normalize("NFKC").trim().toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 90);
export async function submitJobPost(formData: FormData) {
  const db = await createSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login?next=%2Fjobs%2Fpost");
  const title=value(formData,"title",160), description=value(formData,"description",12000);
  const type=value(formData,"job_type",20), category=value(formData,"category_slug",40);
  const district=value(formData,"district",80), upazila=value(formData,"upazila",80);
  const starts=value(formData,"starts_at",40), compensation=value(formData,"compensation_type",20);
  const method=value(formData,"contact_method",20), phone=value(formData,"contact_phone",30);
  const minRaw=value(formData,"salary_min",20), maxRaw=value(formData,"salary_max",20);
  const salaryMin=minRaw?Number(minRaw):null, salaryMax=maxRaw?Number(maxRaw):null;
  const workersRaw=value(formData,"workers_needed",8), workers=workersRaw?Number(workersRaw):null;
  const latRaw=value(formData,"latitude",30), lonRaw=value(formData,"longitude",30);
  const lat=latRaw?Number(latRaw):null, lon=lonRaw?Number(lonRaw):null;
  if(title.length<8||description.length<40||!["one-time","part-time","full-time"].includes(type)||!district||!upazila||
    !["farm-labor","farm-management","machinery","livestock","agronomy","sales","processing","other"].includes(category)||
    !["daily","hourly","monthly","per-task","negotiable"].includes(compensation)||(type==="one-time"&&!starts)||
    (salaryMin!==null&&(!Number.isFinite(salaryMin)||salaryMin<0))||(salaryMax!==null&&(!Number.isFinite(salaryMax)||salaryMax<0))||
    (salaryMin!==null&&salaryMax!==null&&salaryMax<salaryMin)||(workers!==null&&(!Number.isInteger(workers)||workers<1||workers>10000))||
    ((lat===null)!==(lon===null))||(lat!==null&&(!Number.isFinite(lat)||lat < -90||lat>90))||(lon!==null&&(!Number.isFinite(lon)||lon < -180||lon>180))||
    !["platform","phone","both"].includes(method)||(method!=="platform"&&phone.length<6)) redirect("/jobs/post?error=invalid");
  const slug=slugify(title)+"-"+crypto.randomUUID().slice(0,8);
  const deadline=value(formData,"application_deadline",40);
  const {data,error}=await db.from("job_posts").insert({
    employer_id:user.id,title,slug,description,job_type:type,category_slug:category,district,upazila,
    union_name:value(formData,"union_name",100)||null,address_hint:value(formData,"address_hint",250)||null,
    latitude:lat,longitude:lon,location_is_approximate:true,starts_at:starts?new Date(starts).toISOString():null,
    schedule_text:value(formData,"schedule_text",300)||null,compensation_type:compensation,salary_min:salaryMin,salary_max:salaryMax,
    workers_needed:workers,application_deadline:deadline?new Date(deadline).toISOString():null,
    experience_level:value(formData,"experience_level",20)||"any",education_requirement:value(formData,"education_requirement",250)||null,
    contact_method:method,contact_phone:phone||null,status:"pending"
  }).select("id").single();
  if(error||!data) redirect("/jobs/post?error=save");
  redirect("/jobs/post?submitted=1");
}
