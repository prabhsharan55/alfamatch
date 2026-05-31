import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useAuth } from "@/contexts/auth";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { BRAND } from "@/lib/brand";
import type { SocialPlatform, DeliverableType } from "@/lib/database.types";
import { LocationPicker } from "@/components/location-picker";

export const Route = createFileRoute("/onboarding/creator")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/auth/login" });
    // If they already have a profile, skip to dashboard
    const { data } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (data) throw redirect({ to: "/dashboard/creator" });
  },
  component: CreatorOnboarding,
});

// ── Data ──────────────────────────────────────────────────────────────────────

const ALL_LANGUAGES = [
  "Hindi", "English", "Tamil", "Telugu", "Kannada", "Malayalam",
  "Marathi", "Bengali", "Gujarati", "Punjabi", "Odia", "Urdu",
];

const CATEGORIES = [
  "Fashion", "Beauty", "Fitness", "Food", "Travel", "Tech",
  "Finance", "Lifestyle", "Gaming", "Education", "Comedy", "Music",
  "Parenting", "Spiritual", "Business",
];

const PLATFORMS: { id: SocialPlatform; label: string; icon: string }[] = [
  { id: "instagram", label: "Instagram", icon: "📸" },
  { id: "youtube",   label: "YouTube",   icon: "▶" },
  { id: "tiktok",    label: "TikTok",    icon: "♪" },
  { id: "x",         label: "X (Twitter)", icon: "𝕏" },
];

const DELIVERABLES: { id: DeliverableType; label: string; platform: string }[] = [
  { id: "ig_reel",  label: "Instagram Reel",  platform: "instagram" },
  { id: "ig_post",  label: "Instagram Post",  platform: "instagram" },
  { id: "ig_story", label: "Instagram Story", platform: "instagram" },
  { id: "yt_video", label: "YouTube Video",   platform: "youtube" },
  { id: "yt_short", label: "YouTube Short",   platform: "youtube" },
  { id: "tiktok",   label: "TikTok Video",    platform: "tiktok" },
];

// ── State types ───────────────────────────────────────────────────────────────

type ChannelInput = { platform: SocialPlatform; handle: string; followers: string };
type RateInput    = { deliverable: DeliverableType; price: string };

type Step1 = {
  displayName: string; headline: string; bio: string;
  city: string; state: string;
  languages: string[]; categories: string[];
};

// ── Component ─────────────────────────────────────────────────────────────────

function CreatorOnboarding() {
  const navigate = useNavigate();
  const { refreshRoles } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Step 1
  const [s1, setS1] = useState<Step1>({
    displayName: "", headline: "", bio: "",
    city: "", state: "", languages: [], categories: [],
  });

  // Step 2 – channels
  const [channels, setChannels] = useState<ChannelInput[]>([
    { platform: "instagram", handle: "", followers: "" },
  ]);

  // Step 3 – rates
  const [rates, setRates] = useState<RateInput[]>([
    { deliverable: "ig_reel", price: "" },
  ]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function toggleArr(arr: string[], val: string): string[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }

  function slugify(name: string) {
    return name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  function totalFollowers() {
    return channels.reduce((sum, ch) => sum + (parseInt(ch.followers) || 0), 0);
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleFinish() {
    setError("");
    setSaving(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSaving(false); return; }

    // Ensure profiles row exists (backfill for users who signed up before trigger)
    await supabase
      .from("profiles")
      .upsert({ id: session.user.id, role: "creator" }, { onConflict: "id", ignoreDuplicates: true });

    const slug = slugify(s1.displayName) || session.user.id.slice(0, 8);
    const followers = totalFollowers();
    const filledFields = [
      s1.displayName, s1.headline, s1.bio, s1.city,
      s1.languages.length, s1.categories.length,
      channels.filter((c) => c.handle).length,
      rates.filter((r) => r.price).length,
    ].filter(Boolean).length;
    const completion = Math.round((filledFields / 8) * 100);

    // Insert creator_profile
    const { data: profile, error: profileErr } = await supabase
      .from("creator_profiles")
      .insert({
        user_id: session.user.id,
        slug,
        display_name: s1.displayName,
        headline:     s1.headline || null,
        bio:          s1.bio      || null,
        city:         s1.city     || null,
        state:        s1.state    || null,
        languages:    s1.languages,
        categories:   s1.categories,
        total_followers:     followers,
        avg_engagement_rate: 0,
        tier: followers >= 1_000_000 ? "mega"
            : followers >= 100_000   ? "macro"
            : followers >= 10_000    ? "micro"
            : "nano",
        profile_completion:  completion,
        accepting_inquiries: true,
      })
      .select("id")
      .single();

    if (profileErr) {
      setError(profileErr.message);
      setSaving(false);
      return;
    }

    const creatorId = profile.id;

    // Insert channels
    const validChannels = channels.filter((c) => c.handle.trim());
    if (validChannels.length) {
      await supabase.from("social_channels").insert(
        validChannels.map((c) => ({
          creator_id: creatorId,
          platform:   c.platform,
          handle:     c.handle.trim(),
          followers:  parseInt(c.followers) || 0,
        }))
      );
    }

    // Insert rate cards
    const validRates = rates.filter((r) => r.price.trim());
    if (validRates.length) {
      await supabase.from("rate_cards").insert(
        validRates.map((r) => ({
          creator_id:  creatorId,
          deliverable: r.deliverable,
          price_inr:   parseInt(r.price.replace(/[^0-9]/g, "")) || 0,
        }))
      );
    }

    await refreshRoles();
    navigate({ to: "/dashboard/creator" });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link to="/" className="font-black text-xl tracking-tight text-primary">{BRAND.name}</Link>
        <div className="flex items-center gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <div className={`size-7 rounded-full grid place-items-center text-xs font-bold transition-colors
                ${step === n ? "bg-primary text-primary-foreground" :
                  step > n  ? "bg-primary/30 text-primary" :
                               "bg-muted text-muted-foreground"}`}>
                {step > n ? "✓" : n}
              </div>
              <span className={`text-xs hidden sm:block ${step === n ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {n === 1 ? "Your profile" : n === 2 ? "Channels" : "Rates"}
              </span>
              {n < 3 && <div className="w-8 h-px bg-border hidden sm:block" />}
            </div>
          ))}
        </div>
        <div className="w-24" />
      </header>

      {/* Content */}
      <main className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          {step === 1 && <Step1Form s1={s1} setS1={setS1} toggleArr={toggleArr} onNext={() => setStep(2)} />}
          {step === 2 && <Step2Form channels={channels} setChannels={setChannels} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
          {step === 3 && (
            <Step3Form
              rates={rates} setRates={setRates}
              saving={saving} error={error}
              onBack={() => setStep(2)}
              onFinish={handleFinish}
            />
          )}
        </div>
      </main>
    </div>
  );
}

// ── Step 1: Profile ───────────────────────────────────────────────────────────

function Step1Form({ s1, setS1, toggleArr, onNext }: {
  s1: Step1;
  setS1: React.Dispatch<React.SetStateAction<Step1>>;
  toggleArr: (arr: string[], val: string) => string[];
  onNext: () => void;
}) {
  function next(e: React.SyntheticEvent) {
    e.preventDefault();
    onNext();
  }

  return (
    <form onSubmit={next} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Tell us about yourself</h1>
        <p className="text-muted-foreground text-sm">Brands will see this on your public profile.</p>
      </div>

      <Field label="Full name *">
        <input required value={s1.displayName} onChange={(e) => setS1((p) => ({ ...p, displayName: e.target.value }))}
          placeholder="e.g. Simran Kaur" className={inputCls} />
      </Field>

      <Field label="One-line headline *">
        <input required value={s1.headline} onChange={(e) => setS1((p) => ({ ...p, headline: e.target.value }))}
          placeholder='e.g. "Punjabi fashion & lifestyle | Ludhiana"' className={inputCls} />
      </Field>

      <Field label="Bio">
        <textarea rows={3} value={s1.bio} onChange={(e) => setS1((p) => ({ ...p, bio: e.target.value }))}
          placeholder="What you create, who your audience is, what brands you work with…"
          className={`${inputCls} resize-none`} />
      </Field>

      <LocationPicker
        required
        value={{ state: s1.state, city: s1.city }}
        onChange={(v) => setS1((p) => ({ ...p, state: v.state, city: v.city }))}
      />

      <Field label="Languages you create in *">
        <div className="flex flex-wrap gap-2 mt-1">
          {ALL_LANGUAGES.map((l) => (
            <Chip key={l} active={s1.languages.includes(l)} onClick={() => setS1((p) => ({ ...p, languages: toggleArr(p.languages, l) }))}>
              {l}
            </Chip>
          ))}
        </div>
        {s1.languages.length === 0 && <p className="text-xs text-muted-foreground mt-1">Pick at least one</p>}
      </Field>

      <Field label="Categories *">
        <div className="flex flex-wrap gap-2 mt-1">
          {CATEGORIES.map((c) => (
            <Chip key={c} active={s1.categories.includes(c)} onClick={() => setS1((p) => ({ ...p, categories: toggleArr(p.categories, c) }))}>
              {c}
            </Chip>
          ))}
        </div>
        {s1.categories.length === 0 && <p className="text-xs text-muted-foreground mt-1">Pick at least one</p>}
      </Field>

      <button
        type="submit"
        disabled={!s1.displayName || !s1.headline || !s1.city || !s1.state || !s1.languages.length || !s1.categories.length}
        className="w-full py-3 bg-primary text-primary-foreground font-bold rounded hover:bg-primary/90 transition-colors disabled:opacity-40"
      >
        Continue →
      </button>
    </form>
  );
}

// ── Step 2: Channels ──────────────────────────────────────────────────────────

function Step2Form({ channels, setChannels, onBack, onNext }: {
  channels: ChannelInput[];
  setChannels: React.Dispatch<React.SetStateAction<ChannelInput[]>>;
  onBack: () => void;
  onNext: () => void;
}) {
  function updateChannel(i: number, field: keyof ChannelInput, val: string) {
    setChannels((prev) => prev.map((c, idx) => idx === i ? { ...c, [field]: val } : c));
  }

  function addChannel() {
    const used = new Set(channels.map((c) => c.platform));
    const next = PLATFORMS.find((p) => !used.has(p.id));
    if (next) setChannels((prev) => [...prev, { platform: next.id, handle: "", followers: "" }]);
  }

  function removeChannel(i: number) {
    setChannels((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Your social channels</h1>
        <p className="text-muted-foreground text-sm">Add every platform you're active on. You can add more later.</p>
      </div>

      <div className="space-y-3">
        {channels.map((ch, i) => {
          const plat = PLATFORMS.find((p) => p.id === ch.platform)!;
          return (
            <div key={i} className="flex gap-3 p-4 border border-border rounded-lg items-start">
              <div className="text-2xl mt-1">{plat.icon}</div>
              <div className="flex-1 space-y-2">
                <select
                  value={ch.platform}
                  onChange={(e) => updateChannel(i, "platform", e.target.value)}
                  className={inputCls}
                >
                  {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={ch.handle}
                    onChange={(e) => updateChannel(i, "handle", e.target.value)}
                    placeholder="@handle"
                    className={inputCls}
                  />
                  <input
                    type="number"
                    value={ch.followers}
                    onChange={(e) => updateChannel(i, "followers", e.target.value)}
                    placeholder="Followers"
                    className={inputCls}
                  />
                </div>
              </div>
              {channels.length > 1 && (
                <button onClick={() => removeChannel(i)} className="text-muted-foreground hover:text-red-500 mt-1 text-lg">✕</button>
              )}
            </div>
          );
        })}
      </div>

      {channels.length < PLATFORMS.length && (
        <button onClick={addChannel} className="w-full py-2.5 border border-dashed border-border rounded text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
          + Add another platform
        </button>
      )}

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className="flex-1 py-3 border border-border rounded font-semibold hover:bg-muted transition-colors">← Back</button>
        <button
          onClick={onNext}
          disabled={!channels.some((c) => c.handle.trim())}
          className="flex-2 flex-[2] py-3 bg-primary text-primary-foreground font-bold rounded hover:bg-primary/90 transition-colors disabled:opacity-40"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

// ── Step 3: Rates ─────────────────────────────────────────────────────────────

function Step3Form({ rates, setRates, saving, error, onBack, onFinish }: {
  rates: RateInput[];
  setRates: React.Dispatch<React.SetStateAction<RateInput[]>>;
  saving: boolean;
  error: string;
  onBack: () => void;
  onFinish: () => void;
}) {
  function updateRate(i: number, field: keyof RateInput, val: string) {
    setRates((prev) => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  }

  function addRate() {
    const used = new Set(rates.map((r) => r.deliverable));
    const next = DELIVERABLES.find((d) => !used.has(d.id));
    if (next) setRates((prev) => [...prev, { deliverable: next.id, price: "" }]);
  }

  function removeRate(i: number) {
    setRates((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Your rates</h1>
        <p className="text-muted-foreground text-sm">Set your base price per deliverable in ₹. Brands see this as a starting point.</p>
      </div>

      <div className="space-y-3">
        {rates.map((r, i) => (
          <div key={i} className="flex gap-3 items-center p-4 border border-border rounded-lg">
            <div className="flex-1 space-y-2">
              <select
                value={r.deliverable}
                onChange={(e) => updateRate(i, "deliverable", e.target.value)}
                className={inputCls}
              >
                {DELIVERABLES.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
                <input
                  type="number"
                  value={r.price}
                  onChange={(e) => updateRate(i, "price", e.target.value)}
                  placeholder="e.g. 8000"
                  className={`${inputCls} pl-8`}
                />
              </div>
            </div>
            {rates.length > 1 && (
              <button onClick={() => removeRate(i)} className="text-muted-foreground hover:text-red-500 text-lg">✕</button>
            )}
          </div>
        ))}
      </div>

      {rates.length < DELIVERABLES.length && (
        <button onClick={addRate} className="w-full py-2.5 border border-dashed border-border rounded text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
          + Add another deliverable
        </button>
      )}

      <div className="p-4 bg-muted/40 rounded-lg text-sm text-muted-foreground">
        💡 Nano/micro creators typically charge ₹2,000–₹25,000 per reel. Set what feels right — you can always update it later.
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className="flex-1 py-3 border border-border rounded font-semibold hover:bg-muted transition-colors">← Back</button>
        <button
          onClick={onFinish}
          disabled={saving}
          className="flex-[2] py-3 bg-primary text-primary-foreground font-bold rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? "Setting up your profile…" : "Launch my profile 🚀"}
        </button>
      </div>
    </div>
  );
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

const inputCls = "w-full px-4 py-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:border-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
        ${active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background text-foreground/70 border-border hover:border-primary/60"}`}
    >
      {children}
    </button>
  );
}
