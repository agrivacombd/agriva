import type { SupabaseClient, User } from "@supabase/supabase-js";

type SocialData = Record<string, unknown> | null | undefined;

function textField(data: SocialData, key: string): string {
  return typeof data?.[key] === "string" ? String(data[key]).trim() : "";
}

/** Display name only, never a unique username, role, or verified identity claim. */
export function socialDisplayName(user: User): string | null {
  const identity = user.identities?.find(item => item.provider === "google" || item.provider === "facebook");
  if (!identity) return null;

  const verifiedProviderData = identity.identity_data as SocialData;
  const authMetadata = user.user_metadata as SocialData;
  const name = [
    textField(verifiedProviderData, "full_name"),
    textField(verifiedProviderData, "name"),
    [textField(verifiedProviderData, "given_name"), textField(verifiedProviderData, "family_name")].filter(Boolean).join(" "),
    textField(authMetadata, "full_name"),
    textField(authMetadata, "name"),
  ].find(value => value.length > 0);

  if (!name) return null;
  const sanitized = name.replace(/[\u0000-\u001F\u007F]/g, "").replace(/\s+/g, " ").trim().slice(0, 100);
  return sanitized || null;
}

/**
 * Only populate an empty profile name from the user's authenticated social
 * identity. A name entered/edited by the user always takes priority.
 *
 * This intentionally doesn't create a profile or change roles, because AGRIVA's
 * existing auth.users trigger owns profile creation and role memberships.
 */
export async function fillMissingSocialProfileName(supabase: SupabaseClient, user: User): Promise<void> {
  const name = socialDisplayName(user);
  if (!name) return;

  const { error } = await supabase.from("profiles")
    .update({ full_name: name })
    .eq("id", user.id)
    .or("full_name.is.null,full_name.eq.");

  if (error) throw error;
}
