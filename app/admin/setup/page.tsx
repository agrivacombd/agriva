import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function bootstrapFirstAdmin() {
  "use server";
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/setup");

  const ownerEmail = process.env.AGRIVA_OWNER_EMAIL?.trim().toLowerCase();
  if (!ownerEmail || !user.email || user.email.trim().toLowerCase() !== ownerEmail) {
    redirect("/admin/setup?notice=not_owner");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) redirect("/admin/setup?notice=configuration");

  const privileged = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await privileged.rpc("bootstrap_first_admin", { p_user_id: user.id });
  if (error) {
    const message = /already exists/i.test(error.message) ? "exists" : /profile not found/i.test(error.message) ? "profile" : "failed";
    redirect(`/admin/setup?notice=${message}`);
  }
  revalidatePath("/admin");
  redirect("/admin");
}

export default async function AdminSetupPage({ searchParams }: { searchParams?: Promise<{ notice?: string }> }) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/setup");

  const ownerEmail = process.env.AGRIVA_OWNER_EMAIL?.trim().toLowerCase();
  const isOwner = Boolean(ownerEmail && user.email?.trim().toLowerCase() === ownerEmail);
  const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const notice = params?.notice;
  const messages: Record<string, string> = {
    not_owner: "এই account-টি owner email allowlist-এর সঙ্গে মেলেনি।",
    configuration: "Vercel-এ AGRIVA_OWNER_EMAIL ও SUPABASE_SERVICE_ROLE_KEY server-only environment variables সেট করতে হবে।",
    exists: "Admin account আগে থেকেই আছে; নিরাপত্তার জন্য bootstrap বন্ধ রাখা হয়েছে।",
    profile: "Profile পাওয়া যায়নি। আগে signup সম্পন্ন করে আবার চেষ্টা করুন।",
    failed: "Bootstrap ব্যর্থ হয়েছে। Migration 028 ও server configuration যাচাই করুন।",
  };

  return <main className="flex min-h-screen items-center justify-center bg-[#f4f7f1] px-4 py-10 text-[#17351f]">
    <section className="w-full max-w-xl rounded-3xl border border-[#dfe8dc] bg-white p-7 shadow-sm sm:p-9">
      <Link href="/" className="text-sm font-black text-[#267044]">AGRIVA</Link>
      <p className="mt-5 text-xs font-extrabold uppercase tracking-[.18em] text-[#a47b20]">Secure owner setup</p>
      <h1 className="mt-2 text-3xl font-black">প্রথম Admin চালু করুন</h1>
      <p className="mt-3 text-sm leading-6 text-[#637266]">এই ধাপটি শুধু server configuration-এ নির্ধারিত owner email-এর signed-in account-এর জন্য। Database-এ একজন Admin থাকলে আর কাউকে এই পদ্ধতিতে promote করা যাবে না।</p>
      <div className="mt-5 rounded-xl bg-[#f7faf5] p-4 text-sm">
        <p><span className="font-bold">Signed in:</span> {user.email ?? "Email unavailable"}</p>
        <p className="mt-1"><span className="font-bold">Owner email match:</span> {isOwner ? "Yes" : "No"}</p>
      </div>
      {notice && <p role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{messages[notice] ?? "Setup status unavailable."}</p>}
      {(!ownerEmail || !hasServiceKey) && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{messages.configuration}</p>}
      <form action={bootstrapFirstAdmin} className="mt-6">
        <button disabled={!isOwner || !hasServiceKey} className="w-full rounded-xl bg-[#17452c] px-4 py-3 font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50">Bootstrap first admin</button>
      </form>
      <p className="mt-4 text-xs leading-5 text-[#7b887d]">Bootstrap শুধুমাত্র একবার কাজ করে। Service role key কখনো browser-এ পাঠানো হয় না। Admin ইতিমধ্যে থাকলে এই পদ্ধতি আর কাজ করবে না।</p>
    </section>
  </main>;
}
