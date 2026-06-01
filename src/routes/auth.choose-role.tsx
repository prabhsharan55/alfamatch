import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { BRAND } from "@/lib/brand";
import { useAuth } from "@/contexts/auth";

export const Route = createFileRoute("/auth/choose-role")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/auth/login" });
  },
  component: ChooseRolePage,
});

function ChooseRolePage() {
  const { switchRole } = useAuth();
  const navigate = useNavigate();

  async function enter(role: "creator" | "brand") {
    const dest = await switchRole(role);
    navigate({ to: dest });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -5%, oklch(0.60 0.22 25 / 0.20), transparent), oklch(0.13 0 0)' }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,oklch(0.60_0.22_25_/_0.06),transparent_50%)] pointer-events-none" />
      <Link to="/" className="font-black text-2xl tracking-tight text-primary mb-10 relative z-10">
        {BRAND.name}
      </Link>

      <div className="w-full max-w-md bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-2xl relative z-10">
        <h2 className="text-2xl font-bold mb-1 text-center">Which account?</h2>
        <p className="text-muted-foreground text-sm text-center mb-8">
          You have both a Creator and a Brand profile. Pick one to continue.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => enter("creator")}
            className="group flex flex-col items-center gap-3 p-6 border-2 border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-center"
          >
            <span className="text-4xl">🎬</span>
            <div>
              <div className="font-bold text-base group-hover:text-primary transition-colors">Creator</div>
              <div className="text-xs text-muted-foreground mt-1 leading-relaxed">Go to creator dashboard</div>
            </div>
          </button>

          <button
            onClick={() => enter("brand")}
            className="group flex flex-col items-center gap-3 p-6 border-2 border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-center"
          >
            <span className="text-4xl">🏢</span>
            <div>
              <div className="font-bold text-base group-hover:text-primary transition-colors">Brand</div>
              <div className="text-xs text-muted-foreground mt-1 leading-relaxed">Go to brand dashboard</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
