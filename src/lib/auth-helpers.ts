import { supabase } from "./supabase";
import type { UserRole } from "./database.types";

/** Returns the role for a logged-in user, or null if no profile yet. */
export async function getUserRole(userId: string): Promise<UserRole | null> {
  const result = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  return (result.data as { role: UserRole } | null)?.role ?? null;
}

/** Returns true if this user already has a creator_profile row. */
export async function hasCreatorProfile(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("creator_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

/** Returns true if this user already has a brand_profile row. */
export async function hasBrandProfile(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("brand_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

/**
 * After any successful auth event, figure out where to send the user.
 * - brand (new)        → /onboarding/brand
 * - brand (existing)   → /dashboard/brand
 * - creator (new)      → /onboarding/creator
 * - creator (existing) → /dashboard/creator
 */
export async function getPostAuthRedirect(userId: string, role: UserRole): Promise<string> {
  if (role === "brand") {
    const hasProfile = await hasBrandProfile(userId);
    return hasProfile ? "/dashboard/brand" : "/onboarding/brand";
  }
  const hasProfile = await hasCreatorProfile(userId);
  return hasProfile ? "/dashboard/creator" : "/onboarding/creator";
}

/**
 * Switch the user's active role and return the destination URL.
 * Creates the target profile via onboarding if it doesn't exist yet.
 */
export async function switchRole(userId: string, to: "creator" | "brand"): Promise<string> {
  await supabase.from("profiles").update({ role: to }).eq("id", userId);

  if (to === "brand") {
    const has = await hasBrandProfile(userId);
    return has ? "/dashboard/brand" : "/onboarding/brand";
  }
  const has = await hasCreatorProfile(userId);
  return has ? "/dashboard/creator" : "/onboarding/creator";
}

/** Returns which profiles this user has: both, creator-only, or brand-only. */
export async function getUserProfiles(userId: string): Promise<{ hasCreator: boolean; hasBrand: boolean }> {
  const [c, b] = await Promise.all([
    hasCreatorProfile(userId),
    hasBrandProfile(userId),
  ]);
  return { hasCreator: c, hasBrand: b };
}
