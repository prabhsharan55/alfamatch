import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { getCreators } from "@/lib/creators-api";
import type { Creator } from "@/data/creators";
import { BRAND } from "@/lib/brand";
import { useAuth } from "@/contexts/auth";

// ── Loader ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/creator/$creatorId")({
  loader: async ({ params }) => {
    const [profileResult, allCreators] = await Promise.all([
      supabase
        .from("creator_profiles")
        .select(`*, social_channels(*), rate_cards(*)`)
        .eq("slug", params.creatorId)
        .maybeSingle(),
      getCreators(),
    ]);

    if (!profileResult.data) throw notFound();
    return { profile: profileResult.data, allCreators };
  },
  head: ({ loaderData }) => {
    const p = (loaderData as { profile: ProfileRow } | undefined)?.profile;
    return {
      meta: p ? [
        { title: `${p.display_name} — ${BRAND.name}` },
        { name: "description", content: p.headline ?? "" },
        { property: "og:title", content: `${p.display_name} — ${BRAND.name}` },
        { property: "og:description", content: p.headline ?? "" },
        ...(p.avatar_url ? [{ property: "og:image", content: p.avatar_url }] : []),
      ] : [],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center text-foreground">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-primary mb-3">404</p>
        <h1 className="text-3xl font-bold mb-4">Creator not found</h1>
        <Link to="/" className="text-primary hover:underline">← Back to browse</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error, reset }) => (
    <div className="min-h-screen grid place-items-center text-foreground p-6 text-center">
      <div>
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-muted-foreground mb-4">{error.message}</p>
        <button onClick={reset} className="px-4 py-2 bg-primary text-primary-foreground rounded">Try again</button>
      </div>
    </div>
  ),
  component: CreatorDetail,
});

// ── Types ─────────────────────────────────────────────────────────────────────

type ProfileRow = {
  id: string; user_id: string | null; slug: string; display_name: string; headline: string | null;
  bio: string | null; avatar_url: string | null; city: string | null;
  state: string | null; languages: string[] | null; categories: string[] | null;
  total_followers: number; avg_engagement_rate: number;
  tier: string | null; verified: boolean; accepting_inquiries: boolean;
  social_channels: { id: string; platform: string; handle: string; followers: number; verified: boolean }[];
  rate_cards: { id: string; deliverable: string; price_inr: number; notes: string | null }[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const platformIcon: Record<string, string> = {
  instagram: "◎", youtube: "▶", tiktok: "♪", x: "𝕏",
};

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
}

function deliverableLabel(d: string): string {
  const map: Record<string, string> = {
    ig_post: "Instagram Post", ig_reel: "Instagram Reel", ig_story: "Instagram Story",
    yt_video: "YouTube Video", yt_short: "YouTube Short", tiktok: "TikTok Video",
  };
  return map[d] ?? d;
}

function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

// ── Component ─────────────────────────────────────────────────────────────────

function CreatorDetail() {
  const { profile, allCreators } = Route.useLoaderData() as { profile: ProfileRow; allCreators: Creator[] };
  const similar = allCreators.filter((c) => c.id !== profile.slug).slice(0, 3);
  const location = [profile.city, profile.state].filter(Boolean).join(", ");
  const primaryChannel = profile.social_channels[0];
  const { session, role } = useAuth();
  const navigate = useNavigate();
  const [inquiryOpen, setInquiryOpen] = useState(false);

  const isOwnProfile = !!session && session.user.id === profile.user_id;

  function handleInquiryClick() {
    if (!session) {
      navigate({ to: "/auth/login", search: { redirect: `/creator/${profile.slug}` } });
      return;
    }
    if (isOwnProfile || role === "creator") return;
    setInquiryOpen(true);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 lg:px-12 py-4 bg-gradient-to-b from-background via-background/85 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-black text-2xl tracking-tight text-primary">{BRAND.name}</Link>
          <Link to="/" className="hidden md:inline text-sm text-foreground/80 hover:text-foreground">← Browse</Link>
        </div>
        {isOwnProfile ? (
          <span className="px-5 py-2 border border-border rounded text-sm text-muted-foreground">Your Profile</span>
        ) : (
          <button onClick={handleInquiryClick} className="px-5 py-2 bg-primary text-primary-foreground rounded text-sm font-semibold hover:bg-primary/90 transition-colors">
            Send Inquiry
          </button>
        )}
      </nav>

      {/* Hero */}
      <header className="relative -mt-20 h-[88vh] min-h-[620px] w-full overflow-hidden">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.display_name}
            className="absolute inset-0 w-full h-full object-cover object-top scale-105" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-primary/10 to-background grid place-items-center">
            <span className="text-[20vw] font-black text-primary/20 select-none">{initials(profile.display_name)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />

        <div className="relative h-full max-w-7xl mx-auto px-6 lg:px-12 flex flex-col justify-end pb-20">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4 text-xs uppercase tracking-[0.3em] text-foreground/70">
              <span className="px-2 py-0.5 bg-primary text-primary-foreground font-bold">PROFILE</span>
              {profile.categories?.[0] && <span>{profile.categories[0]}</span>}
              {profile.tier && <span className="capitalize">{profile.tier}</span>}
              {profile.verified && <span className="text-primary">● VERIFIED</span>}
            </div>

            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-none mb-3">
              {profile.display_name}
            </h1>

            {profile.headline && (
              <p className="text-xl text-foreground/80 mb-5 italic">"{profile.headline}"</p>
            )}

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-foreground/80 mb-8">
              {primaryChannel && <span><strong className="text-foreground">{primaryChannel.handle}</strong></span>}
              {location && <span>● {location}</span>}
              {profile.avg_engagement_rate > 0 && <span>● {profile.avg_engagement_rate}% engagement</span>}
              {!profile.accepting_inquiries && <span className="text-amber-400">● Not accepting inquiries</span>}
            </div>

            <div className="flex flex-wrap gap-3">
              {!isOwnProfile && (
              <button onClick={handleInquiryClick} className="flex items-center gap-2 px-7 py-3 bg-foreground text-background rounded font-bold hover:bg-foreground/85 transition-colors">
                ✉ Send Inquiry
              </button>
              )}
              <button
                onClick={() => navigator.share?.({ title: profile.display_name, url: window.location.href })}
                className="flex items-center gap-2 px-7 py-3 bg-foreground/20 text-foreground rounded font-bold backdrop-blur hover:bg-foreground/30 transition-colors"
              >
                ⤴ Share Profile
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats bar */}
      <section className="border-y border-border bg-card/40">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <Stat label="Total Reach"     value={profile.total_followers ? formatFollowers(profile.total_followers) : "—"} />
          <Stat label="Avg. Engagement" value={profile.avg_engagement_rate ? `${profile.avg_engagement_rate}%` : "—"} />
          <Stat label="Starting Rate"   value={profile.rate_cards.length ? `₹${Math.min(...profile.rate_cards.map((r) => r.price_inr)).toLocaleString("en-IN")}` : "On request"} accent />
          <Stat label="Channels"        value={`${profile.social_channels.length}`} />
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-16 grid lg:grid-cols-[2fr_1fr] gap-12">
        {/* LEFT */}
        <div className="space-y-16">

          {/* About */}
          <section>
            <SectionTitle>About</SectionTitle>
            {profile.bio ? (
              <p className="text-lg leading-relaxed text-foreground/85 mb-6">{profile.bio}</p>
            ) : (
              <p className="text-muted-foreground italic mb-6">No bio added yet.</p>
            )}
            {(profile.categories?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.categories!.map((t) => (
                  <span key={t} className="px-3 py-1 bg-muted text-foreground/80 text-xs rounded-full">{t}</span>
                ))}
              </div>
            )}
          </section>

          {/* Channels */}
          {profile.social_channels.length > 0 && (
            <section>
              <SectionTitle>Channels</SectionTitle>
              <div className="grid sm:grid-cols-2 gap-3">
                {profile.social_channels.map((ch) => (
                  <div key={ch.id} className="flex items-center gap-4 p-4 bg-card rounded-sm border border-border">
                    <div className="size-12 grid place-items-center bg-primary/15 text-primary text-xl font-bold rounded">
                      {platformIcon[ch.platform] ?? "◆"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold capitalize">{ch.platform}</span>
                        {ch.verified && <span className="text-[10px] text-primary font-mono">● VERIFIED</span>}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{ch.handle}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-black">{formatFollowers(ch.followers)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Rate Cards */}
          {profile.rate_cards.length > 0 && (
            <section>
              <SectionTitle>Rates</SectionTitle>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {profile.rate_cards.map((r) => (
                  <div key={r.id} className="p-5 bg-card border border-border rounded-sm">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                      {deliverableLabel(r.deliverable)}
                    </p>
                    <p className="text-2xl font-black">₹{r.price_inr.toLocaleString("en-IN")}</p>
                    {r.notes && <p className="text-xs text-muted-foreground mt-1">{r.notes}</p>}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">Base rates — final pricing negotiated via inquiry.</p>
            </section>
          )}

          {/* Content — empty state */}
          <section>
            <SectionTitle>Recent Content</SectionTitle>
            <div className="py-12 border border-dashed border-border rounded-sm text-center">
              <p className="text-muted-foreground text-sm">Content portfolio coming soon.</p>
            </div>
          </section>

        </div>

        {/* RIGHT — sticky sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">

          {/* Details */}
          <div className="p-6 bg-card rounded-sm border border-border space-y-4 text-sm">
            {(profile.languages?.length ?? 0) > 0 && (
              <DetailRow label="Languages" value={profile.languages!.join(", ")} />
            )}
            {location && <DetailRow label="Based in" value={location} />}
            {profile.tier && (
              <DetailRow label="Tier" value={profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)} />
            )}
            <DetailRow
              label="Availability"
              value={profile.accepting_inquiries ? "Open to collaborations" : "Not accepting inquiries"}
            />
          </div>

          {/* CTA */}
          {isOwnProfile ? (
            <div className="w-full py-4 border border-border rounded text-center text-sm text-muted-foreground">
              This is your creator profile
            </div>
          ) : (
            <button onClick={handleInquiryClick} className="w-full py-4 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-sm rounded hover:bg-primary/90 transition-colors">
              Send Inquiry
            </button>
          )}

          <p className="text-xs text-center text-muted-foreground">
            Brands only — creators don't pay to be discovered.
          </p>
        </aside>
      </main>

      {/* More Like This */}
      {similar.length > 0 && (
        <section className="px-6 lg:px-12 pb-20">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xl lg:text-2xl font-bold mb-4">
              More {profile.categories?.[0] ?? "Creators"}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {similar.map((c) => <SimilarCard key={c.id} c={c} />)}
            </div>
          </div>
        </section>
      )}

      {/* Inquiry Modal */}
      {inquiryOpen && (
        <InquiryModal
          creatorId={profile.id}
          creatorName={profile.display_name}
          onClose={() => setInquiryOpen(false)}
        />
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
      <div className={`text-2xl font-black tracking-tight ${accent ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-5 pb-3 border-b border-border">
      <h2 className="text-2xl font-bold tracking-tight">{children}</h2>
      {action}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-foreground/90 mt-0.5">{value}</div>
    </div>
  );
}

function SimilarCard({ c }: { c: Creator }) {
  return (
    <Link
      to="/creator/$creatorId"
      params={{ creatorId: c.id }}
      className="group relative aspect-video overflow-hidden rounded-sm bg-muted hover:scale-105 transition-transform"
    >
      {c.img ? (
        <img src={c.img} alt={c.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/30 to-background grid place-items-center">
          <span className="text-4xl font-black text-primary/30">
            {c.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
          </span>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-background via-background/70 to-transparent">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="font-bold">{c.name}</h3>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{c.niche}</p>
          </div>
          <div className="text-right">
            <div className="font-black">{c.followers}</div>
            <div className="text-[10px] text-primary font-mono">{c.engagement}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Inquiry Modal ─────────────────────────────────────────────────────────────

function InquiryModal({ creatorId, creatorName, onClose }: {
  creatorId: string;
  creatorName: string;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [message, setMessage]     = useState("");
  const [offer, setOffer]         = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState("");
  const [done, setDone]           = useState(false);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate({ to: "/auth/login" }); return; }

    // Get brand_profile id
    const { data: brand } = await supabase
      .from("brand_profiles")
      .select("id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!brand) { navigate({ to: "/onboarding/brand" }); return; }

    // Create inquiry
    const { data: inquiry, error: iErr } = await supabase
      .from("inquiries")
      .insert({
        brand_id:   brand.id,
        creator_id: creatorId,
        offer_inr:  offer ? parseInt(offer.replace(/[^0-9]/g, "")) : null,
        status:     "new",
      })
      .select("id")
      .single();

    if (iErr) { setError(iErr.message); setSubmitting(false); return; }

    // Create message thread
    const { data: thread, error: tErr } = await supabase
      .from("message_threads")
      .insert({ inquiry_id: inquiry.id })
      .select("id")
      .single();

    if (tErr) { setError(tErr.message); setSubmitting(false); return; }

    // Send opening message
    await supabase.from("messages").insert({
      thread_id:      thread.id,
      sender_user_id: session.user.id,
      body:           message.trim(),
    });

    setSubmitting(false);
    setDone(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl">
        {done ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">✓</div>
            <h2 className="text-xl font-bold mb-2">Inquiry sent!</h2>
            <p className="text-muted-foreground text-sm mb-6">
              {creatorName} will be notified. You can track replies in your inbox.
            </p>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded font-semibold text-sm hover:bg-muted transition-colors">
                Close
              </button>
              <button
                onClick={() => navigate({ to: "/inbox" })}
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                Go to Inbox
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="font-bold">Send Inquiry</h2>
                <p className="text-xs text-muted-foreground">To {creatorName}</p>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5">Your message *</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Hi ${creatorName.split(" ")[0]}, we'd love to collaborate on…`}
                  className="w-full px-4 py-3 bg-background border border-border rounded text-sm focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Budget offer <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
                  <input
                    type="number"
                    value={offer}
                    onChange={(e) => setOffer(e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full pl-8 pr-4 py-3 bg-background border border-border rounded text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} className="flex-1 py-3 border border-border rounded font-semibold hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !message.trim()}
                  className="flex-[2] py-3 bg-primary text-primary-foreground font-bold rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Sending…" : "Send Inquiry"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// React is used implicitly via JSX
import React from "react";
