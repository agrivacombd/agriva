import { safeAuthNextPath } from "@/lib/auth/safe-next";

/**
 * Ask the server to resolve the post-login destination using the authenticated
 * Supabase session and the canonical profiles.role value.
 */
export async function getPostLoginRedirect(next?: string | null): Promise<string> {
  const safeNext = safeAuthNextPath(next);
  const response = await fetch(`/api/auth/post-login?next=${encodeURIComponent(safeNext)}`, {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("Unable to resolve the authenticated account destination");
  }

  const payload = await response.json() as { redirectTo?: unknown };
  if (typeof payload.redirectTo !== "string" || !payload.redirectTo.startsWith("/")) {
    throw new Error("Invalid post-login destination");
  }

  return safeAuthNextPath(payload.redirectTo);
}
