import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type BuyerSession = Awaited<ReturnType<typeof getVerifiedBuyer>>;

// Prevent parallel Add-to-Cart, header and checkout requests from creating
// different anonymous identities (and orphaning the first cart).
let pendingBuyer: Promise<BuyerSession> | null = null;

async function getVerifiedBuyer() {
  const supabase = createSupabaseBrowserClient();
  // getSession is used only to decide if a guest identity is needed.
  // getUser verifies the identity with the Auth server before any cart RPC.
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

/**
 * A guest has a real Supabase anonymous Auth identity, not the public anon role.
 * Authorization remains server-side through getUser(), RLS and checkout RPCs.
 * A rejected attempt is not cached; another request can retry safely.
 */
export function ensureCheckoutBuyerSession() {
  if (!pendingBuyer) {
    pendingBuyer = getVerifiedBuyer().finally(() => {
      pendingBuyer = null;
    });
  }
  return pendingBuyer;
}
