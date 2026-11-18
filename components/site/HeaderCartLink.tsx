"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { resolveMarketplaceCartUser } from "@/lib/marketplace/cart-auth";

export const CART_UPDATED_EVENT = "agriva:cart-updated";

export default function HeaderCartLink({ english }: { english: boolean }) {
  const pathname = usePathname();
  const [count, setCount] = useState<number | null>(null);
  const reloadVersion = useRef(0);

  const plantMarket = pathname.startsWith("/plant-market");
  const reload = useCallback(async () => {
    const version = ++reloadVersion.current;
    const updateCount = (value: number | null) => {
      // Old network responses must not override newer add/remove or logout events.
      if (version === reloadVersion.current) setCount(value);
    };
    try {
      if (plantMarket) {
        const response = await fetch("/api/plant-market/cart", { cache: "no-store" });
        if (response.status === 401) { updateCount(0); return; }
        if (!response.ok) throw new Error("Plant Market cart unavailable");
        const payload = await response.json();
        updateCount((Array.isArray(payload.items) ? payload.items : []).reduce((sum: number, item: { quantity?: number }) => sum + Math.max(0, Number(item.quantity) || 0), 0));
        return;
      }
      const { supabase, user } = await resolveMarketplaceCartUser();
      if (!user) { updateCount(0); return; }
      const { data: cart, error: cartError } = await supabase.from("carts")
        .select("id").eq("user_id", user.id).eq("status", "active").maybeSingle();
      if (cartError) throw cartError;
      if (!cart) { updateCount(0); return; }
      const { data: rows, error: rowsError } = await supabase.from("cart_items")
        .select("quantity").eq("cart_id", cart.id);
      if (rowsError) throw rowsError;
      updateCount((rows || []).reduce((sum, row) => sum + Math.max(0, Number(row.quantity) || 0), 0));
    } catch {
      // Do not show stale numbers when the cart cannot be verified.
      updateCount(null);
    }
  }, [plantMarket]);

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
    <Link href={plantMarket ? "/plant-market/cart" : "/cart"} aria-label={english ? `Shopping cart, ${count ?? 0} items` : `কার্ট দেখুন, ${count ?? 0}টি পণ্য`} title={english ? "View shopping cart" : "কার্ট দেখুন"}
      className="relative inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-2.5 py-2 text-xs font-extrabold text-emerald-900 transition hover:border-emerald-600 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 sm:px-3 sm:text-sm">
      <ShoppingCart size={19} aria-hidden="true" />
      <span className="hidden min-[420px]:inline">{english ? "Cart" : "কার্ট"}</span>
      {count !== null && count > 0 && (
        <span aria-live="polite" className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-800 px-1 text-[10px] font-extrabold tabular-nums text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
