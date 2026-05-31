import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { BRAND } from "@/lib/brand";
import { LocationPicker } from "@/components/location-picker";
import { useAuth } from "@/contexts/auth";

export const Route = createFileRoute("/onboarding/brand")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/auth/login" });
    // Already has a brand profile → skip to dashboard
    const { data } = await supabase
      .from("brand_profiles")
      .select("id")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (data) throw redirect({ to: "/dashboard/brand" });
  },
  component: BrandOnboarding,
});

const INDUSTRIES = [
  "Fashion & Apparel", "Beauty & Skincare", "Food & Beverages",
  "Fitness & Wellness", "Technology", "Finance & Fintech",
  "Education", "Home & Living", "Travel & Hospitality",
  "Healthcare", "Gaming", "Entertainment", "Real Estate",
  "Automotive", "D2C / E-commerce", "Other",
];

const inputCls = "w-full px-4 py-3 bg-background border border-border rounded text-sm focus:outline-none focus:border-primary";

function BrandOnboarding() {
  const navigate = useNavigate();
  const { refreshRoles } = useAuth();

  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry]       = useState("");
  const [website, setWebsite]         = useState("");
  const [location, setLocation]       = useState({ state: "", city: "" });
  const [error, setError]             = useState("");
  const [saving, setSaving]           = useState(false);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSaving(false); return; }

    // Ensure profiles row exists (backfill for pre-trigger signups)
    await supabase
      .from("profiles")
      .upsert({ id: session.user.id, role: "brand" }, { onConflict: "id", ignoreDuplicates: true });

    const { error: err } = await supabase
      .from("brand_profiles")
      .insert({
        user_id:      session.user.id,
        company_name: companyName.trim(),
        industry:     industry || null,
        website:      website.trim() || null,
        city:         location.city || null,
      });

    if (err) { setError(err.message); setSaving(false); return; }
    await refreshRoles();
    navigate({ to: "/dashboard/brand" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link to="/" className="font-black text-xl tracking-tight text-primary">{BRAND.name}</Link>
        <span className="text-xs text-muted-foreground uppercase tracking-widest">Brand Setup</span>
        <div className="w-24" />
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <span className="text-3xl">🏢</span>
            <h1 className="text-2xl font-bold mt-3 mb-1">Set up your brand</h1>
            <p className="text-muted-foreground text-sm">
              This lets creators know who's reaching out. Takes 30 seconds.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">Brand / Company name *</label>
              <input
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Rang De India"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Industry *</label>
              <select
                required
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className={inputCls}
              >
                <option value="">Select industry</option>
                {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
              </select>
            </div>

            <LocationPicker required value={location} onChange={setLocation} />

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Website <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourbrand.com"
                className={inputCls}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-primary text-primary-foreground font-bold rounded hover:bg-primary/90 transition-colors disabled:opacity-50 mt-2"
            >
              {saving ? "Setting up…" : "Enter Brand Studio →"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
