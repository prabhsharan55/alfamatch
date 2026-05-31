import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { BRAND } from "@/lib/brand";
import { z } from "zod";
import { getPostAuthRedirect, switchRole } from "@/lib/auth-helpers";

const searchSchema = z.object({
  redirect: z.string().optional(),
  addRole: z.enum(["creator", "brand"]).optional(),
});

export const Route = createFileRoute("/auth/login")({
  validateSearch: searchSchema,
  component: LoginPage,
});

function LoginPage() {
  const navigate          = useNavigate();
  const { redirect, addRole } = useSearch({ from: "/auth/login" });
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // If coming from signup with a second role to add, switch to it (creates profile if missing)
    if (addRole) {
      const dest = await switchRole(user.id, addRole);
      navigate({ to: dest });
      return;
    }

    const result = await supabase.from("profiles").select("role").eq("id", user.id).single();
    const profile = result.data as { role: string } | null;
    const role = (profile?.role ?? "creator") as "creator" | "brand" | "admin";
    const dest = redirect ?? await getPostAuthRedirect(user.id, role);
    navigate({ to: dest });
  }

  return (
    <AuthShell>
      <h2 className="text-2xl font-bold mb-1">Welcome back</h2>
      {addRole ? (
        <div className="rounded-lg bg-primary/10 border border-primary/20 px-4 py-3 text-sm text-primary mb-6">
          Sign in to add your <strong>{addRole === "brand" ? "Brand" : "Creator"}</strong> profile to your existing account.
        </div>
      ) : (
        <p className="text-muted-foreground text-sm mb-8">Sign in to your account</p>
      )}

      <button
        onClick={handleGoogle}
        className="w-full flex items-center justify-center gap-3 py-3 border border-border rounded-xl font-semibold text-sm hover:bg-muted transition-all duration-200 mb-5"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[11px] text-muted-foreground uppercase tracking-widest">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5 text-foreground/80">Email</label>
          <input
            type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-3 bg-background/60 border border-border rounded-xl text-sm focus:outline-none focus:border-primary/60 focus:bg-background transition-all duration-200 placeholder:text-muted-foreground/50"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-foreground/80">Password</label>
            <span className="text-xs text-muted-foreground/60">Forgot password? Coming soon</span>
          </div>
          <input
            type="password" required value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            className="w-full px-4 py-3 bg-background/60 border border-border rounded-xl text-sm focus:outline-none focus:border-primary/60 focus:bg-background transition-all duration-200 placeholder:text-muted-foreground/50"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          type="submit" disabled={loading}
          className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all duration-200 disabled:opacity-40 glow-primary"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Don't have an account?{" "}
        <Link to="/auth/signup" className="text-primary hover:text-primary/80 font-medium transition-colors">Sign up free</Link>
      </p>
    </AuthShell>
  );
}

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -5%, oklch(0.60 0.22 25 / 0.20), transparent), oklch(0.13 0 0)' }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,oklch(0.60_0.22_25_/_0.06),transparent_50%)] pointer-events-none" />
      <Link to="/" className="font-black text-2xl tracking-tight text-primary mb-8 relative z-10">{BRAND.name}</Link>
      <div className="w-full max-w-md bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-2xl relative z-10">
        {children}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
