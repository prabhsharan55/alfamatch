import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { BRAND } from "@/lib/brand";
import type { UserRole } from "@/lib/database.types";
import { storeSignupRole } from "./auth.callback";
import { getPostAuthRedirect } from "@/lib/auth-helpers";

export const Route = createFileRoute("/auth/signup")({
  component: SignupPage,
});

type Step = "role" | "credentials";

function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep]         = useState<Step>("role");
  const [role, setRole]         = useState<UserRole | null>(null);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);

  function pickRole(r: UserRole) {
    setRole(r);
    setStep("credentials");
  }

  async function handleGoogleSignup() {
    if (!role) return;
    storeSignupRole(role);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!role) return;
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role } },
    });

    setLoading(false);

    if (error) {
      // User already has an account — direct them to login and add the second profile
      if (error.message.toLowerCase().includes("already registered") ||
          error.message.toLowerCase().includes("user already exists")) {
        setError(`__already_registered__:${role}`);
      } else {
        setError(error.message);
      }
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const dest = await getPostAuthRedirect(session.user.id, role);
      navigate({ to: dest });
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <AuthShell>
        <div className="text-center">
          <div className="text-4xl mb-4">✉</div>
          <h2 className="text-2xl font-bold mb-2">Check your email</h2>
          <p className="text-muted-foreground mb-6">
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
          </p>
          <Link to="/auth/login" className="text-primary hover:underline text-sm">Back to sign in</Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      {step === "role" ? (
        <>
          <h2 className="text-2xl font-bold mb-2 text-center">Join {BRAND.name}</h2>
          <p className="text-muted-foreground text-sm text-center mb-8">Who are you signing up as?</p>
          <div className="grid grid-cols-2 gap-4">
            <RoleCard icon="🎬" title="Creator" desc="I create content and want brand deals"       onClick={() => pickRole("creator")} />
            <RoleCard icon="🏢" title="Brand"   desc="I represent a brand looking for creators" onClick={() => pickRole("brand")}   />
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/auth/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </>
      ) : (
        <>
          <button
            onClick={() => setStep("role")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            ← Back
          </button>

          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">{role === "creator" ? "🎬" : "🏢"}</span>
            <div>
              <h2 className="text-xl font-bold">Create your account</h2>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">
                {role === "creator" ? "Creator" : "Brand"} account
              </p>
            </div>
          </div>

          {/* Google OAuth */}
          <button
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center gap-3 py-3 border border-border rounded-xl font-semibold text-sm hover:bg-muted transition-all duration-200"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <Divider />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-background/60 border border-border rounded-xl text-sm focus:outline-none focus:border-primary/60 transition-all duration-200 placeholder:text-muted-foreground/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <input
                type="password" required minLength={6} value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full px-4 py-3 bg-background/60 border border-border rounded-xl text-sm focus:outline-none focus:border-primary/60 transition-all duration-200 placeholder:text-muted-foreground/50"
              />
            </div>
            {error && (
              error.startsWith("__already_registered__:") ? (
                <div className="rounded bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-sm">
                  <p className="font-semibold text-amber-600 mb-1">You already have an account.</p>
                  <p className="text-muted-foreground mb-2">
                    Sign in and we'll add your{" "}
                    <strong>{error.split(":")[1] === "brand" ? "Brand" : "Creator"}</strong> profile to your existing account.
                  </p>
                  <Link
                    to="/auth/login"
                    search={{ addRole: error.split(":")[1] as "creator" | "brand" }}
                    className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded text-xs font-bold hover:bg-primary/90 transition-colors"
                  >
                    Sign in &amp; add {error.split(":")[1] === "brand" ? "Brand" : "Creator"} profile →
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-red-500">{error}</p>
              )
            )}
            <button
              type="submit" disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all duration-200 disabled:opacity-40 glow-primary"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/auth/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}

function RoleCard({ icon, title, desc, onClick }: { icon: string; title: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-3 p-6 border-2 border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-center"
    >
      <span className="text-4xl">{icon}</span>
      <div>
        <div className="font-bold text-base group-hover:text-primary transition-colors">{title}</div>
        <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</div>
      </div>
    </button>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground uppercase tracking-widest">or</span>
      <div className="flex-1 h-px bg-border" />
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

function AuthShell({ children }: { children: React.ReactNode }) {
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
