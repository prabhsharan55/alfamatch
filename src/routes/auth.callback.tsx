import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { BRAND } from "@/lib/brand";
import type { UserRole } from "@/lib/database.types";
import { getPostAuthRedirect, getUserProfiles } from "@/lib/auth-helpers";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

// Key used to pass the chosen role across the OAuth redirect
const ROLE_KEY = "alfamatch_signup_role";

export function storeSignupRole(role: UserRole) {
  localStorage.setItem(ROLE_KEY, role);
}

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    async function finish() {
      // PKCE: exchange the ?code= param Supabase/Google puts in the URL
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate({ to: "/auth/login" }); return; }

      const pendingRole = localStorage.getItem(ROLE_KEY) as UserRole | null;
      localStorage.removeItem(ROLE_KEY);

      if (pendingRole) {
        // User explicitly chose a role (new signup or adding a second profile).
        // Always honour it — switch the active role and route to onboarding or dashboard.
        await supabase.from("profiles").update({ role: pendingRole }).eq("id", session.user.id);
        const dest = await getPostAuthRedirect(session.user.id, pendingRole);
        navigate({ to: dest });
        return;
      }

      // Plain login (no role chosen).
      const [profileResult, { hasCreator, hasBrand }] = await Promise.all([
        supabase.from("profiles").select("role").eq("id", session.user.id).single(),
        getUserProfiles(session.user.id),
      ]);

      // Dual-role user — let them pick which dashboard to enter.
      if (hasCreator && hasBrand) {
        navigate({ to: "/auth/choose-role" });
        return;
      }

      const profile = profileResult.data as { role: UserRole } | null;
      const role = profile?.role ?? "creator";
      const dest = await getPostAuthRedirect(session.user.id, role);
      navigate({ to: dest });
    }

    finish();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
      <div className="font-black text-2xl tracking-tight text-primary">{BRAND.name}</div>
      <p className="text-muted-foreground text-sm animate-pulse">Signing you in…</p>
    </div>
  );
}
