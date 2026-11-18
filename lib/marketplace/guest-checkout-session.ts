import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

/**
 * Guests receive a short-lived buyer identity without creating an account.
 * Authenticated users keep their existing session and cart. All authorization
 * still happens server-side through getUser(), RLS and checkout RPCs.
 */
export async function ensureCheckoutBuyerSession() {
  const supabase = createSupabaseBrowserClient();
  const { data: session, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!session.session?.user) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw new Error("অতিথি হিসেবে অর্ডার চালু করা যাচ্ছে না। পরে চেষ্টা করুন অথবা লগইন করুন।");
  }
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("ক্রেতার সেশন যাচাই করা যায়নি। আবার চেষ্টা করুন।");
  return { supabase, user };
}
