import { createFileRoute, Link, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import {
  LayoutDashboard, User, Share2, IndianRupee,
  Mail, TrendingUp, Megaphone, Wallet,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { BRAND } from "@/lib/brand";
import { useAuth } from "@/contexts/auth";
import { LocationPicker } from "@/components/location-picker";
import { switchRole, getUserProfiles } from "@/lib/auth-helpers";
import {
  DashboardShell, DashboardHeader, StatCard, Panel, type NavItem,
} from "@/components/dashboard-shell";

// ── Route ─────────────────────────────────────────────────────────────────────

const searchSchema = z.object({ tab: z.string().optional() });

export const Route = createFileRoute("/dashboard/creator")({
  validateSearch: searchSchema,
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/auth/login", search: { redirect: "/dashboard/creator" } });
  },
  loader: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { profile: null, hasBrand: false };

    const [profileResult, profiles] = await Promise.all([
      supabase
        .from("creator_profiles")
        .select(`*, social_channels(*), rate_cards(*)`)
        .eq("user_id", session.user.id)
        .maybeSingle(),
      getUserProfiles(session.user.id),
    ]);

    return { profile: profileResult.data, hasBrand: profiles.hasBrand };
  },
  head: () => ({
    meta: [
      { title: `Creator Studio — ${BRAND.name}` },
      { name: "description", content: "Manage your profile, content, and brand inquiries." },
    ],
  }),
  component: CreatorDashboard,
});

// ── Types ─────────────────────────────────────────────────────────────────────

type Profile = {
  id: string; slug: string; display_name: string; headline: string | null;
  bio: string | null; avatar_url: string | null; city: string | null; state: string | null;
  languages: string[] | null; categories: string[] | null;
  total_followers: number; avg_engagement_rate: number; profile_completion: number;
  tier: string | null; verified: boolean; accepting_inquiries: boolean;
  social_channels: { id: string; platform: string; handle: string; followers: number }[];
  rate_cards: { id: string; deliverable: string; price_inr: number; notes: string | null }[];
};

const ALL_LANGUAGES = ["Hindi","English","Tamil","Telugu","Kannada","Malayalam","Marathi","Bengali","Gujarati","Punjabi","Odia","Urdu"];
const CATEGORIES    = ["Fashion","Beauty","Fitness","Food","Travel","Tech","Finance","Lifestyle","Gaming","Education","Comedy","Music","Parenting","Spiritual","Business"];
const PLATFORMS     = ["instagram","youtube","tiktok","x"] as const;
const DELIVERABLES  = [
  { id: "ig_post",  label: "Instagram Post"  },
  { id: "ig_reel",  label: "Instagram Reel"  },
  { id: "ig_story", label: "Instagram Story" },
  { id: "yt_video", label: "YouTube Video"   },
  { id: "yt_short", label: "YouTube Short"   },
  { id: "tiktok",   label: "TikTok Video"    },
];

// ── Nav ───────────────────────────────────────────────────────────────────────

const nav: NavItem[] = [
  { to: "/dashboard/creator",                    label: "Overview",  icon: LayoutDashboard, section: "Workspace" },
  { to: "/dashboard/creator", tab: "profile",    label: "Profile",   icon: User,            section: "Workspace" },
  { to: "/dashboard/creator", tab: "channels",   label: "Channels",  icon: Share2,          section: "Workspace" },
  { to: "/dashboard/creator", tab: "rates",      label: "Rates",     icon: IndianRupee,     section: "Workspace" },
  { to: "/inbox",                                label: "Inbox",     icon: Mail,            section: "Manage"    },
  { to: "/dashboard/creator", tab: "analytics",  label: "Analytics", icon: TrendingUp,      section: "Insights"  },
  { to: "/dashboard/creator", tab: "campaigns",  label: "Campaigns", icon: Megaphone,       section: "Insights"  },
  { to: "/dashboard/creator", tab: "earnings",   label: "Earnings",  icon: Wallet,          section: "Insights"  },
];

// ── Root component ────────────────────────────────────────────────────────────

function CreatorDashboard() {
  const { profile, hasBrand } = Route.useLoaderData() as { profile: Profile | null; hasBrand: boolean };
  const { tab = "" } = Route.useSearch();
  const { session, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!session) { navigate({ to: "/auth/login" }); return; }
    if (!profile) router.invalidate(); // SSR rendered with no session — re-run loader now that client has session
  }, [loading, session, profile, navigate, router]);

  if (loading || !profile) return null;

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/" });
  }

  async function handleSwitchToBrand() {
    if (!session) return;
    const dest = await switchRole(session.user.id, "brand");
    navigate({ to: dest });
  }

  const firstName = profile?.display_name?.split(" ")[0] ?? "there";

  function formatN(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
    return `${n}`;
  }

  return (
    <DashboardShell
      role="Creator"
      name={profile?.display_name ?? "Creator"}
      avatar={profile?.avatar_url ?? ""}
      nav={nav}
      onSignOut={handleSignOut}
      onSwitchRole={hasBrand ? handleSwitchToBrand : undefined}
    >
      {tab === "profile"   && <ProfileTab   profile={profile} />}
      {tab === "channels"  && <ChannelsTab  profile={profile} />}
      {tab === "rates"     && <RatesTab     profile={profile} />}
      {tab === "analytics" && <StubTab title="Analytics" message="Audience analytics coming soon — connect your social channels to unlock insights." />}
      {tab === "campaigns" && <StubTab title="Campaigns" message="Campaign management coming soon. Brands will invite you here once you're shortlisted." />}
      {tab === "earnings"  && <StubTab title="Earnings"  message="Payment tracking coming soon. Earnings from completed campaigns will appear here." />}
      {!tab && <OverviewTab profile={profile} firstName={firstName} formatN={formatN} />}
    </DashboardShell>
  );
}

// ── Overview tab ──────────────────────────────────────────────────────────────

function OverviewTab({ profile, firstName, formatN }: {
  profile: Profile | null;
  firstName: string;
  formatN: (n: number) => string;
}) {
  const completion = profile?.profile_completion ?? 0;
  const channels   = profile?.social_channels ?? [];

  return (
    <>
      <DashboardHeader
        title={`Welcome back, ${firstName}`}
        subtitle={`Profile ${completion}% complete · Share your link to get discovered`}
        actions={
          <>
            {profile && (
              <Link to="/creator/$creatorId" params={{ creatorId: profile.slug }}
                className="px-4 py-2 text-sm border border-border rounded hover:bg-muted transition-colors">
                View Public Profile ↗
              </Link>
            )}
          </>
        }
      />
      <div className="p-6 lg:p-10 space-y-8">
        {/* Profile completion nudge */}
        {completion < 100 && (
          <div className="p-5 bg-card border border-border rounded-sm flex items-center gap-5">
            <div className="relative size-16 shrink-0">
              <svg viewBox="0 0 36 36" className="size-16 -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" className="text-muted" strokeWidth="3" />
                <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" className="text-primary" strokeWidth="3"
                  strokeDasharray={`${completion * 0.94} 100`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 grid place-items-center font-semibold text-sm">{completion}%</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold mb-1">Boost your match rate</h3>
              <p className="text-sm text-muted-foreground">Complete your profile to get discovered by brands.</p>
            </div>
            <Link to="/dashboard/creator" search={{ tab: "profile" } as never}
              className="px-4 py-2 text-sm bg-foreground text-background rounded font-semibold hover:bg-foreground/85">
              Edit Profile
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Reach"  value={profile?.total_followers ? formatN(profile.total_followers) : "—"} />
          <StatCard label="Inquiries"    value="0" />
          <StatCard label="Campaigns"    value="0" />
          <StatCard label="Earnings"     value="₹0" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Panel title="Brand Inquiries">
            <div className="py-10 text-center">
              <div className="text-3xl mb-2">✉</div>
              <p className="font-semibold mb-1">No inquiries yet</p>
              <p className="text-sm text-muted-foreground">Share your profile link to get discovered.</p>
              {profile && (
                <button
                  onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/creator/${profile.slug}`); }}
                  className="mt-4 px-4 py-2 text-xs bg-muted rounded hover:bg-muted/80 transition-colors font-mono"
                >
                  Copy profile link
                </button>
              )}
            </div>
          </Panel>

          <Panel title="Connected Channels"
            action={
              <Link to="/dashboard/creator" search={{ tab: "channels" } as never}
                className="text-xs text-primary hover:underline">Manage →</Link>
            }
          >
            {channels.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-muted-foreground">No channels yet.</p>
                <Link to="/dashboard/creator" search={{ tab: "channels" } as never}
                  className="mt-3 inline-block text-xs text-primary hover:underline">Add channels →</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {channels.map((ch) => (
                  <div key={ch.id} className="flex items-center gap-3 p-3 border border-border rounded">
                    <div className="size-9 rounded bg-muted text-foreground/50 grid place-items-center font-medium text-xs uppercase shrink-0">
                      {ch.platform.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold capitalize text-sm">{ch.platform}</p>
                      <p className="text-xs text-muted-foreground truncate">{ch.handle}</p>
                    </div>
                    <span className="text-xs font-mono font-bold">
                      {ch.followers >= 1000 ? `${(ch.followers / 1000).toFixed(0)}K` : ch.followers}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}

// ── Profile edit tab ──────────────────────────────────────────────────────────

function ProfileTab({ profile }: { profile: Profile | null }) {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [headline,    setHeadline]    = useState(profile?.headline ?? "");
  const [bio,         setBio]         = useState(profile?.bio ?? "");
  const [avatarUrl,   setAvatarUrl]   = useState(profile?.avatar_url ?? "");
  const [location,    setLocation]    = useState({ state: profile?.state ?? "", city: profile?.city ?? "" });
  const [languages,   setLanguages]   = useState<string[]>(profile?.languages ?? []);
  const [categories,  setCategories]  = useState<string[]>(profile?.categories ?? []);
  const [accepting,   setAccepting]   = useState(profile?.accepting_inquiries ?? true);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [error,       setError]       = useState("");
  const [optimizing,  setOptimizing]  = useState(false);

  function toggle(arr: string[], val: string): string[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }

  async function optimizeWithAI() {
    setOptimizing(true);
    setError("");
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("optimize-profile", {
        body: {
          displayName,
          currentHeadline: headline,
          currentBio: bio,
          categories,
          city: location.city,
        },
      });
      if (fnErr) throw fnErr;
      if (data?.error) throw new Error(data.error);
      if (data?.headline) setHeadline(data.headline);
      if (data?.bio) setBio(data.bio);
    } catch (e) {
      setError((e as Error).message ?? "AI optimization failed. Try again.");
    } finally {
      setOptimizing(false);
    }
  }

  async function handleSave(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!profile) return;
    setError(""); setSaving(true); setSaved(false);

    // compute completion
    const filled = [displayName, headline, bio, location.city, languages.length, categories.length, avatarUrl].filter(Boolean).length;
    const completion = Math.round((filled / 7) * 100);

    const { error: err } = await supabase
      .from("creator_profiles")
      .update({
        display_name:        displayName.trim(),
        headline:            headline.trim() || null,
        bio:                 bio.trim()      || null,
        avatar_url:          avatarUrl.trim() || null,
        city:                location.city   || null,
        state:               location.state  || null,
        languages,
        categories,
        accepting_inquiries: accepting,
        profile_completion:  completion,
      })
      .eq("id", profile.id);

    setSaving(false);
    if (err) { setError(err.message); return; }
    setSaved(true);
    // refresh page data
    setTimeout(() => navigate({ to: "/dashboard/creator", search: { tab: "profile" } as never }), 800);
  }

  return (
    <>
      <DashboardHeader title="Edit Profile" subtitle="Changes are visible on your public profile immediately." />
      <div className="p-6 lg:p-10 max-w-2xl">
        <form onSubmit={handleSave} className="space-y-6">

          <Field label="Full name *">
            <input required value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Simran Kaur" className={inputCls} />
          </Field>

          <Field label="Headline *">
            <div className="flex items-center gap-2 mb-1.5">
              <input required value={headline} onChange={(e) => setHeadline(e.target.value)}
                placeholder='e.g. "Punjabi fashion & lifestyle | Ludhiana"' className={inputCls} />
            </div>
          </Field>

          <Field label="Bio">
            <textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)}
              placeholder="What you create, who your audience is, what brands you love working with…"
              className={`${inputCls} resize-none`} />
            <button
              type="button"
              onClick={optimizeWithAI}
              disabled={optimizing || !displayName}
              className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary/10 text-primary border border-primary/30 rounded-full hover:bg-primary/20 transition-all disabled:opacity-50"
            >
              {optimizing ? (
                <>
                  <span className="inline-block w-3 h-3 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                  Optimizing…
                </>
              ) : (
                <>✦ Optimize headline &amp; bio with AI</>
              )}
            </button>
          </Field>

          <Field label="Avatar URL">
            <input type="url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/your-photo.jpg" className={inputCls} />
            {avatarUrl && (
              <img src={avatarUrl} alt="Preview" className="mt-2 size-16 rounded-full object-cover border border-border" />
            )}
          </Field>

          <div>
            <label className="block text-sm font-medium mb-1.5">Location</label>
            <LocationPicker value={location} onChange={setLocation} />
          </div>

          <Field label="Languages you create in">
            <div className="flex flex-wrap gap-2 mt-1">
              {ALL_LANGUAGES.map((l) => (
                <Chip key={l} active={languages.includes(l)} onClick={() => setLanguages(toggle(languages, l))}>{l}</Chip>
              ))}
            </div>
          </Field>

          <Field label="Categories">
            <div className="flex flex-wrap gap-2 mt-1">
              {CATEGORIES.map((c) => (
                <Chip key={c} active={categories.includes(c)} onClick={() => setCategories(toggle(categories, c))}>{c}</Chip>
              ))}
            </div>
          </Field>

          <Field label="Availability">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setAccepting((v) => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors ${accepting ? "bg-primary" : "bg-muted"}`}
              >
                <div className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${accepting ? "translate-x-5" : ""}`} />
              </div>
              <span className="text-sm">{accepting ? "Accepting inquiries" : "Not accepting inquiries"}</span>
            </label>
          </Field>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit" disabled={saving}
            className={`px-6 py-3 rounded font-bold text-sm transition-colors disabled:opacity-50
              ${saved ? "bg-emerald-600 text-white" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
          >
            {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Changes"}
          </button>
        </form>
      </div>
    </>
  );
}

// ── Channels tab ──────────────────────────────────────────────────────────────

function ChannelsTab({ profile }: { profile: Profile | null }) {
  const [channels, setChannels] = useState(profile?.social_channels ?? []);
  const [adding,   setAdding]   = useState(false);
  const [newPlatform, setNewPlatform] = useState<typeof PLATFORMS[number]>("instagram");
  const [newHandle,   setNewHandle]   = useState("");
  const [newFollowers, setNewFollowers] = useState("");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  async function addChannel(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true); setError("");

    const { data, error: err } = await supabase
      .from("social_channels")
      .insert({ creator_id: profile.id, platform: newPlatform, handle: newHandle.trim(), followers: parseInt(newFollowers) || 0 })
      .select("id, platform, handle, followers")
      .single();

    setSaving(false);
    if (err) { setError(err.message); return; }
    setChannels((prev) => [...prev, data]);
    setAdding(false); setNewHandle(""); setNewFollowers("");
  }

  async function deleteChannel(id: string) {
    await supabase.from("social_channels").delete().eq("id", id);
    setChannels((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <>
      <DashboardHeader title="Social Channels" subtitle="Manage the platforms you create on." />
      <div className="p-6 lg:p-10 max-w-xl space-y-4">
        {channels.map((ch) => (
          <div key={ch.id} className="flex items-center gap-4 p-4 border border-border rounded-sm bg-card">
            <div className="size-10 rounded bg-muted text-foreground/50 grid place-items-center font-medium text-xs uppercase shrink-0">
              {ch.platform.slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold capitalize">{ch.platform}</p>
              <p className="text-sm text-muted-foreground">{ch.handle} · {ch.followers.toLocaleString("en-IN")} followers</p>
            </div>
            <button onClick={() => deleteChannel(ch.id)} className="text-muted-foreground hover:text-red-500 transition-colors text-lg px-2">✕</button>
          </div>
        ))}

        {channels.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground py-4">No channels added yet.</p>
        )}

        {adding ? (
          <form onSubmit={addChannel} className="p-4 border border-dashed border-primary/50 rounded-sm space-y-3 bg-card">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Platform</label>
                <select value={newPlatform} onChange={(e) => setNewPlatform(e.target.value as typeof PLATFORMS[number])} className={inputCls}>
                  {PLATFORMS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Followers</label>
                <input type="number" value={newFollowers} onChange={(e) => setNewFollowers(e.target.value)} placeholder="e.g. 28000" className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Handle</label>
              <input required value={newHandle} onChange={(e) => setNewHandle(e.target.value)} placeholder="@yourhandle" className={inputCls} />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded font-semibold disabled:opacity-50">
                {saving ? "Adding…" : "Add Channel"}
              </button>
              <button type="button" onClick={() => setAdding(false)} className="px-4 py-2 border border-border text-sm rounded hover:bg-muted transition-colors">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button onClick={() => setAdding(true)} className="w-full py-3 border border-dashed border-border rounded text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
            + Add channel
          </button>
        )}
      </div>
    </>
  );
}

// ── Rates tab ─────────────────────────────────────────────────────────────────

function RatesTab({ profile }: { profile: Profile | null }) {
  const [rates, setRates] = useState(profile?.rate_cards ?? []);
  const [adding, setAdding]   = useState(false);
  const [newDel,   setNewDel]   = useState("ig_reel");
  const [newPrice, setNewPrice] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  async function addRate(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true); setError("");

    const { data, error: err } = await supabase
      .from("rate_cards")
      .insert({ creator_id: profile.id, deliverable: newDel as never, price_inr: parseInt(newPrice) || 0, notes: newNotes || null })
      .select("id, deliverable, price_inr, notes")
      .single();

    setSaving(false);
    if (err) { setError(err.message); return; }
    setRates((prev) => [...prev, data as never]);
    setAdding(false); setNewPrice(""); setNewNotes("");
  }

  async function deleteRate(id: string) {
    await supabase.from("rate_cards").delete().eq("id", id);
    setRates((prev) => prev.filter((r) => r.id !== id));
  }

  function label(d: string) {
    return DELIVERABLES.find((x) => x.id === d)?.label ?? d;
  }

  return (
    <>
      <DashboardHeader title="Rate Cards" subtitle="Set your base prices per deliverable in ₹." />
      <div className="p-6 lg:p-10 max-w-xl space-y-4">
        {rates.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-4 p-4 border border-border rounded-sm bg-card">
            <div>
              <p className="font-semibold text-sm">{label(r.deliverable)}</p>
              {r.notes && <p className="text-xs text-muted-foreground">{r.notes}</p>}
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-base">₹{r.price_inr.toLocaleString("en-IN")}</span>
              <button onClick={() => deleteRate(r.id)} className="text-muted-foreground hover:text-red-500 transition-colors text-lg px-1">✕</button>
            </div>
          </div>
        ))}

        {rates.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground py-4">No rates set yet.</p>
        )}

        {adding ? (
          <form onSubmit={addRate} className="p-4 border border-dashed border-primary/50 rounded-sm space-y-3 bg-card">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Deliverable</label>
                <select value={newDel} onChange={(e) => setNewDel(e.target.value)} className={inputCls}>
                  {DELIVERABLES.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Price (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                  <input required type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="e.g. 8000" className={`${inputCls} pl-7`} />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Notes (optional)</label>
              <input value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="e.g. includes 1 revision" className={inputCls} />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded font-semibold disabled:opacity-50">
                {saving ? "Adding…" : "Add Rate"}
              </button>
              <button type="button" onClick={() => setAdding(false)} className="px-4 py-2 border border-border text-sm rounded hover:bg-muted transition-colors">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button onClick={() => setAdding(true)} className="w-full py-3 border border-dashed border-border rounded text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
            + Add rate
          </button>
        )}

        <p className="text-xs text-muted-foreground">Base rates — final pricing is always negotiated via inquiry.</p>
      </div>
    </>
  );
}

// ── Coming soon stub ──────────────────────────────────────────────────────────

function StubTab({ title, message }: { title: string; message: string }) {
  return (
    <>
      <DashboardHeader title={title} />
      <div className="flex-1 grid place-items-center p-12 text-center">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">Coming soon</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">{message}</p>
        </div>
      </div>
    </>
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
    <button type="button" onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
        ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground/70 border-border hover:border-primary/60"}`}>
      {children}
    </button>
  );
}

import React from "react";
