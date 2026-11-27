import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error("Local Supabase URL and service-role key are required.");
if (!/127\.0\.0\.1|localhost/.test(url)) throw new Error("Refusing to seed E2E accounts outside the isolated local Supabase instance.");

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const password = "AGRIVA-E2E-Only-2026!";

const personas = [
  { email: "e2e-farmer@example.test", name: "E2E Farmer", role: "farmer" },
  { email: "e2e-buyer@example.test", name: "E2E Buyer", role: "buyer" },
  { email: "e2e-wholesaler@example.test", name: "E2E Wholesaler Applicant", role: "buyer" },
];

for (const persona of personas) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: persona.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: persona.name },
  });
  if (error) throw new Error(`Unable to create synthetic ${persona.role} user: ${error.message}`);

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: data.user.id,
    full_name: persona.name,
    role: persona.role,
  }, { onConflict: "id" });
  if (profileError) throw new Error(`Unable to assign synthetic profile role: ${profileError.message}`);

  const { error: preferencesError } = await supabase.from("notification_preferences").upsert({
    user_id: data.user.id,
  }, { onConflict: "user_id" });
  if (preferencesError) throw new Error(`Unable to create synthetic notification preferences: ${preferencesError.message}`);
}

console.log("Created 3 synthetic E2E accounts in isolated local Supabase only.");
