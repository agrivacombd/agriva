"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export const CART_UPDATED_EVENT = "agriva:cart-updated";

export default function HeaderCartLink({ english }: { english: boolean }) {
  const pathname = usePathname();
  const [count, setCount] = useState<number | null>(null);

  const reload = useCallback(async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { setCount(0); return; }
      const { data: cart, error: cartError } = await supabase.from("carts")
        .select("id").eq("user_id", user.id).eq("status", "active").maybeSingle();
      if (cartError) throw cartError;
      if (!cart) { setCount(0); return; }
      const { data: rows, error: rowsError } = await supabase.from("cart_items")
        .select("quantity").eq("cart_id", cart.id);
      if (rowsError) throw rowsError;
      setCount((rows || []).reduce((sum, row) => sum + Math.max(0, Number(row.quantity) || 0), 0));
    } catch {
      // Do not show stale numbers when the cart cannot be verified.
      setCount(null);
    }
  }, []);

  useEffect(() => { void reload(); }, [pathname, reload]);
  useEffect(() => {
    const onRefresh = () => { void reload(); };
    const onVisible = () => { if (!document.hidden) void reload(); };
    window.addEventListener(CART_UPDATED_EVENT, onRefresh);
    window.addEventListener("focus", onRefresh);
    document.addEventListener("visibilitychange", onVisible);
    const supabase = createSupabaseBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      // auth callbacks can occur during token refresh; defer queries to the next turn.
      setTimeout(onRefresh, 0);
    });
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, onRefresh);
      window.removeEventListener("focus", onRefresh);
      document.removeEventListener("visibilitychange", onVisible);
      subscription.unsubscribe();
    };
  }, [reload]);

  return (
    <Link href="/cart" aria-label={english ? "Shopping cart" : "শপিং কার্ট"}
      className="relative inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-2.5 py-2 text-sm font-bold text-emerald-900 transition hover:border-emerald-600 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 sm:px-3">
      <ShoppingCart size={19} aria-hidden="true" />
      <span className="hidden lg:inline">{english ? "Cart" : "কার্ট"}</span>
      {count !== null && count > 0 && (
        <span aria-live="polite" className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-800 px-1 text-[10px] font-extrabold tabular-nums text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
