import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { UserRole } from "@/lib/database.types";
import { switchRole as doSwitchRole, getUserProfiles } from "@/lib/auth-helpers";

type AvailableRoles = { hasCreator: boolean; hasBrand: boolean };

type AuthCtx = {
  session: Session | null;
  role: UserRole | null;
  availableRoles: AvailableRoles;
  loading: boolean;
  signOut: () => Promise<void>;
  /** Switch active role. Returns the destination URL (caller handles navigation). */
  switchRole: (to: "creator" | "brand") => Promise<string>;
  /** Re-fetch profiles (call after completing onboarding to update availableRoles). */
  refreshRoles: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx>({
  session: null,
  role: null,
  availableRoles: { hasCreator: false, hasBrand: false },
  loading: true,
  signOut: async () => {},
  switchRole: async () => "/",
  refreshRoles: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession]               = useState<Session | null>(null);
  const [role, setRole]                     = useState<UserRole | null>(null);
  const [availableRoles, setAvailableRoles] = useState<AvailableRoles>({ hasCreator: false, hasBrand: false });
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchAll(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchAll(session.user.id);
      else { setRole(null); setAvailableRoles({ hasCreator: false, hasBrand: false }); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchAll(userId: string) {
    const [profileResult, profiles] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", userId).single(),
      getUserProfiles(userId),
    ]);
    const data = profileResult.data as { role: UserRole } | null;
    setRole(data?.role ?? null);
    setAvailableRoles(profiles);
    setLoading(false);
  }

  const refreshRoles = useCallback(async () => {
    if (!session) return;
    const profiles = await getUserProfiles(session.user.id);
    setAvailableRoles(profiles);
  }, [session]);

  const handleSwitchRole = useCallback(async (to: "creator" | "brand") => {
    if (!session) return "/";
    const dest = await doSwitchRole(session.user.id, to);
    setRole(to);
    return dest;
  }, [session]);

  return (
    <AuthContext.Provider value={{
      session,
      role,
      availableRoles,
      loading,
      signOut: () => supabase.auth.signOut().then(() => {}),
      switchRole: handleSwitchRole,
      refreshRoles,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
