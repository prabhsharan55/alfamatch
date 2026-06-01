import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { BRAND } from "@/lib/brand";
import type { Session } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/database.types";
import { getPostAuthRedirect, getUserProfiles } from "@/lib/auth-helpers";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

const ROLE_KEY = "alfamatch_signup_role";

export function storeSignupRole(role: UserRole) {
  localStorage.setItem(ROLE_KEY, role);
}

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let done = false;

    async function handleSession(session: Session) {
      if (done) return;
      done = true;

      const pendingRole = localStorage.getItem(ROLE_KEY) as UserRole | null;
      localStorage.removeItem(ROLE_KEY);

      if (pendingRole) {
        await supabase.from("profiles").update({ role: pendingRole }).eq("id", session.user.id);
        const dest = await getPostAuthRedirect(session.user.id, pendingRole);
        navigate({ to: dest });
        return;
      }

      const [profileResult, { hasCreator, hasBrand }] = await Promise.all([
        supabase.from("profiles").select("role").eq("id", session.user.id).single(),
        getUserProfiles(session.user.id),
      ]);

      if (hasCreator && hasBrand) {
        navigate({ to: "/auth/choose-role" });
        return;
      }

      const profile = profileResult.data as { role: UserRole } | null;
      const role = profile?.role ?? "creator";
      const dest = await getPostAuthRedirect(session.user.id, role);
      navigate({ to: dest });
    }

    // Supabase auto-processes the ?code= URL param via detectSessionInUrl.
    // Listen for the SIGNED_IN event it fires, rather than racing it with a manual exchange.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) handleSession(session);
    });

    // Also check immediately — session may already be set if user was previously logged in
    // or if Supabase processed the code synchronously before this effect ran.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) handleSession(session);
    });

    // Fallback: if nothing resolves in 10s, go to login
    const timeout = setTimeout(() => {
      if (!done) { done = true; navigate({ to: "/auth/login" }); }
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
      <div className="font-black text-2xl tracking-tight text-primary">{BRAND.name}</div>
      <p className="text-muted-foreground text-sm animate-pulse">Signing you in…</p>
    </div>
  );
}
