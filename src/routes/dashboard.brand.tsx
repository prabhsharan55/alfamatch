import { createFileRoute, Link, redirect, useNavigate, useRouter, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import {
  LayoutDashboard, Search, Bookmark, Megaphone,
  Mail, FileText, BarChart2, CreditCard,
} from "lucide-react";
import { getCreators } from "@/lib/creators-api";
import type { Creator } from "@/data/creators";
import { BRAND } from "@/lib/brand";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth";
import { switchRole, getUserProfiles } from "@/lib/auth-helpers";
import {
  DashboardShell,
  DashboardHeader,
  StatCard,
  Panel,
  type NavItem,
} from "@/components/dashboard-shell";

const searchSchema = z.object({ tab: z.string().optional() });

export const Route = createFileRoute("/dashboard/brand")({
  validateSearch: searchSchema,
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/auth/login", search: { redirect: "/dashboard/brand" } });
    // No brand profile yet → send to onboarding
    const { data } = await supabase
      .from("brand_profiles")
      .select("id")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (!data) throw redirect({ to: "/onboarding/brand" });
  },
  loader: async () => {
    const { data: { session } } = await supabase.auth.getSession();

    const [creators, brandResult, profiles] = await Promise.all([
      getCreators(),
      session ? supabase.from("brand_profiles").select("*").eq("user_id", session!.user.id).maybeSingle() : Promise.resolve({ data: null }),
      session ? getUserProfiles(session!.user.id) : Promise.resolve({ hasCreator: false, hasBrand: false }),
    ]);

    const brandId = brandResult.data?.id ?? null;

    // Real stats — only run if we have a brand profile
    const [campaignsResult, inquiriesResult, shortlistsResult, activityResult] = brandId
      ? await Promise.all([
          supabase
            .from("campaigns")
            .select("id, name, status, budget_inr, brief, created_at, inquiries(id, status)")
            .eq("brand_id", brandId)
            .order("created_at", { ascending: false }),
          supabase
            .from("inquiries")
            .select("id, status, offer_inr, creator_id")
            .eq("brand_id", brandId),
          supabase
            .from("shortlists")
            .select("id, name, created_at, shortlist_items(count)")
            .eq("brand_id", brandId)
            .order("created_at", { ascending: false }),
          supabase
            .from("inquiries")
            .select("id, status, created_at, creator_profiles(display_name)")
            .eq("brand_id", brandId)
            .order("created_at", { ascending: false })
            .limit(6),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];

    type CampaignRow    = { id: string; name: string; status: string; budget_inr: number | null; created_at: string };
    type InquiryRow     = { id: string; status: string; offer_inr: number | null; creator_id: string };
    type ShortlistRow   = { id: string; name: string; created_at: string; shortlist_items: { count: number }[] };
    type ActivityRow    = { id: string; status: string; created_at: string; creator_profiles: { display_name: string } | null };

    const allCampaigns  = (campaignsResult.data  ?? []) as CampaignRow[];
    const allInquiries  = (inquiriesResult.data  ?? []) as InquiryRow[];
    const allShortlists = (shortlistsResult.data ?? []) as ShortlistRow[];
    const recentActivity = (activityResult.data  ?? []) as ActivityRow[];

    const activeCampaigns = allCampaigns.filter((c) => c.status === "live" || c.status === "negotiating").length;
    const inquiriesSent   = allInquiries.length;
    const creatorsBooked  = allInquiries.filter((i) => i.status === "accepted" || i.status === "completed").length;
    const totalSpendInr   = allInquiries
      .filter((i) => i.status === "accepted" || i.status === "completed")
      .reduce((sum, i) => sum + (i.offer_inr ?? 0), 0);

    return {
      creators,
      brand: brandResult.data,
      hasCreator: profiles.hasCreator,
      stats: { activeCampaigns, inquiriesSent, creatorsBooked, totalSpendInr },
      campaigns: allCampaigns,
      shortlists: allShortlists,
      recentActivity,
    };
  },
  head: () => ({
    meta: [
      { title: `Brand Studio — ${BRAND.name}` },
      { name: "description", content: "Search creators, manage campaigns, and track ROI." },
    ],
  }),
  component: BrandDashboard,
});

const nav: NavItem[] = [
  { to: "/dashboard/brand",                    label: "Overview",   icon: LayoutDashboard, section: "Workspace" },
  { to: "/browse",                             label: "Discover",   icon: Search,          section: "Workspace" },
  { to: "/dashboard/brand", tab: "shortlists", label: "Shortlists", icon: Bookmark,        section: "Workspace" },
  { to: "/dashboard/brand", tab: "campaigns",  label: "Campaigns",  icon: Megaphone,       section: "Workspace" },
  { to: "/inbox",                              label: "Inbox",      icon: Mail,            section: "Manage"    },
  { to: "/dashboard/brand", tab: "contracts",  label: "Contracts",  icon: FileText,        section: "Manage"    },
  { to: "/dashboard/brand", tab: "reports",    label: "Reports",    icon: BarChart2,       section: "Insights"  },
  { to: "/dashboard/brand", tab: "billing",    label: "Billing",    icon: CreditCard,      section: "Insights"  },
];

type CampaignRow  = { id: string; name: string; status: string; budget_inr: number | null; brief: string | null; created_at: string; inquiries: { id: string; status: string }[] };
type ShortlistRow = { id: string; name: string; created_at: string; shortlist_items: { count: number }[] };
type ActivityRow  = { id: string; status: string; created_at: string; creator_profiles: { display_name: string } | null };

function activityMeta(status: string, name: string): { dot: string; text: React.ReactNode } {
  switch (status) {
    case "new":         return { dot: "bg-primary",              text: <>Inquiry sent to <b>{name}</b></> };
    case "replied":     return { dot: "bg-blue-500",             text: <><b>{name}</b> replied</> };
    case "negotiating": return { dot: "bg-amber-500",            text: <>Negotiating with <b>{name}</b></> };
    case "accepted":    return { dot: "bg-emerald-500",          text: <><b>{name}</b> accepted</> };
    case "declined":    return { dot: "bg-red-500",              text: <><b>{name}</b> declined</> };
    case "completed":   return { dot: "bg-muted-foreground",     text: <>Completed with <b>{name}</b></> };
    default:            return { dot: "bg-muted-foreground",     text: <>Update from <b>{name}</b></> };
  }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  <  1) return "Just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  <  7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const SHORTLIST_COLORS = [
  "bg-foreground/8",
  "bg-foreground/6",
  "bg-foreground/10",
  "bg-foreground/7",
  "bg-foreground/9",
  "bg-foreground/8",
];

function BrandDashboard() {
  const { creators, brand, hasCreator, stats, campaigns, shortlists, recentActivity } = Route.useLoaderData() as {
    creators: Creator[];
    brand: { id: string; company_name: string; city: string | null } | null;
    hasCreator: boolean;
    stats: { activeCampaigns: number; inquiriesSent: number; creatorsBooked: number; totalSpendInr: number };
    campaigns: CampaignRow[];
    shortlists: ShortlistRow[];
    recentActivity: ActivityRow[];
  };
  const brandName = brand?.company_name ?? "Your Brand";
  const { session, signOut } = useAuth();
  const navigate  = useNavigate();
  const router    = useRouter();
  const { tab }   = useSearch({ from: "/dashboard/brand" });


  const [campaignOpen,  setCampaignOpen]  = useState(false);
  const [shortlistOpen, setShortlistOpen] = useState(false);
  const [inviteCreator, setInviteCreator] = useState<Creator | null>(null);
  const [saveCreator,   setSaveCreator]   = useState<Creator | null>(null);
  const [matchQuery,    setMatchQuery]    = useState("");
  const [aiMatches,     setAiMatches]     = useState<{ creator: Creator; score: number; reason: string }[] | null>(null);
  const [aiMatching,    setAiMatching]    = useState(false);
  const [aiMatchError,  setAiMatchError]  = useState("");
  const [reportCampaign, setReportCampaign] = useState<CampaignRow | null>(null);

  async function runAiMatch() {
    if (!matchQuery.trim()) return;
    setAiMatching(true);
    setAiMatchError("");
    setAiMatches(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("match-creators", {
        body: {
          query: matchQuery,
          creators: creators.map((c: Creator) => ({
            id: c.id,
            name: c.name,
            niche: c.niche,
            tier: "",
            followers: c.followers,
            engagement: c.engagement,
            city: "",
            categories: [],
          })),
        },
      });
      if (fnErr) throw fnErr;
      if (data?.error) throw new Error(data.error);
      setAiMatches(data.matches ?? []);
    } catch (e) {
      setAiMatchError((e as Error).message ?? "Matching failed. Try again.");
    } finally {
      setAiMatching(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/" });
  }

  async function handleSwitchToCreator() {
    if (!session) return;
    const dest = await switchRole(session.user.id, "creator");
    navigate({ to: dest });
  }

  return (
    <DashboardShell
      role="Brand"
      name={brandName}
      avatar=""
      nav={nav}
      onSignOut={handleSignOut}
      onSwitchRole={hasCreator ? handleSwitchToCreator : undefined}
    >
      {/* ── Overview ─────────────────────────────────────────────────────── */}
      {!tab && <>
        <DashboardHeader
          title={`Welcome, ${brandName}`}
          subtitle="Find creators that match your campaign"
          actions={
            <button onClick={() => setCampaignOpen(true)}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded font-semibold hover:bg-primary/90 transition-colors">
              + New Campaign
            </button>
          }
        />
        <div className="p-6 lg:p-10 space-y-8">
          {/* Smart Match */}
          <div className="p-6 bg-card border border-border rounded-sm">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold tracking-tight">Smart Match</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-primary/15 text-primary rounded-full uppercase tracking-widest">AI</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Describe what you need — AI finds the best creators for you.</p>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                value={matchQuery}
                onChange={(e) => { setMatchQuery(e.target.value); setAiMatches(null); }}
                onKeyDown={(e) => e.key === "Enter" && runAiMatch()}
                placeholder='e.g. "female fitness creator in Delhi under ₹20K budget"'
                className="flex-1 px-4 py-3 bg-background border border-border rounded text-sm focus:outline-none focus:border-primary/60 transition-all"
              />
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={runAiMatch}
                  disabled={aiMatching || !matchQuery.trim()}
                  className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {aiMatching ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Matching…
                    </>
                  ) : "✦ AI Match"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate({ to: "/browse", search: { q: matchQuery } })}
                  className="px-5 py-3 border border-border rounded font-semibold text-sm hover:bg-muted transition-colors"
                >
                  Browse all →
                </button>
              </div>
            </div>

            {/* Quick category chips */}
            {!aiMatches && (
              <div className="flex flex-wrap gap-2 mt-4">
                {["Fashion", "Beauty", "Fitness", "Food", "Tech", "Travel", "Finance"].map((t) => (
                  <button key={t} type="button"
                    onClick={() => { setMatchQuery(t); setAiMatches(null); }}
                    className="text-xs px-3 py-1 bg-muted text-foreground/80 rounded-full hover:bg-primary/15 hover:text-primary transition-colors">
                    {t}
                  </button>
                ))}
              </div>
            )}

            {/* AI match error */}
            {aiMatchError && <p className="mt-3 text-sm text-red-500">{aiMatchError}</p>}

            {/* AI match results */}
            {aiMatches && (
              <div className="mt-5 space-y-3">
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
                  {aiMatches.length} AI-matched creator{aiMatches.length !== 1 ? "s" : ""} for "{matchQuery}"
                </p>
                {aiMatches.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No strong matches found. Try a different description.</p>
                ) : (
                  <ul className="space-y-2">
                    {aiMatches.map(({ creator: c, score, reason }) => (
                      <li key={c.id} className="flex items-center gap-4 p-3 rounded border border-border hover:border-primary/40 transition-colors bg-background/50">
                        {c.img
                          ? <img src={c.img} alt={c.name} className="size-12 rounded object-cover shrink-0" />
                          : <div className="size-12 rounded bg-muted grid place-items-center text-foreground/50 font-medium shrink-0">
                              {c.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                            </div>
                        }
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Link to="/creator/$creatorId" params={{ creatorId: c.id }} className="font-bold text-sm hover:text-primary">{c.name}</Link>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-primary/15 text-primary rounded font-bold">{score}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{c.niche} · {c.followers}</p>
                          <p className="text-xs text-foreground/70 mt-0.5 line-clamp-1">✦ {reason}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => setSaveCreator(c)} className="size-8 grid place-items-center border border-border rounded hover:bg-muted text-xs" aria-label="Save">♡</button>
                          <button onClick={() => setInviteCreator(c)} className="px-3 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded hover:bg-primary/90">Invite</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Active Campaigns" value={String(stats.activeCampaigns)} />
            <StatCard label="Inquiries Sent"   value={String(stats.inquiriesSent)} />
            <StatCard label="Creators Booked"  value={String(stats.creatorsBooked)} />
            <StatCard label="Total Spend"
              value={stats.totalSpendInr > 0 ? `₹${(stats.totalSpendInr / 100000).toFixed(1)}L` : "₹0"} />
          </div>
          {/* Top Matches + Activity */}
          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
            <Panel title="Top Matches"
              action={<Link to="/browse" className="text-xs uppercase tracking-widest text-primary">See all →</Link>}>
              <ul className="space-y-3">
                {creators.map((c: Creator, i: number) => (
                  <li key={c.id} className="flex items-center gap-4 p-3 rounded border border-border hover:border-primary/60 transition-colors">
                    {c.img
                      ? <img src={c.img} alt={c.name} className="size-14 rounded object-cover shrink-0" />
                      : <div className="size-14 rounded bg-primary/20 grid place-items-center text-primary font-semibold text-base shrink-0">
                          {c.name.split(" ").map((w:string)=>w[0]).slice(0,2).join("")}
                        </div>
                    }
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link to="/creator/$creatorId" params={{ creatorId: c.id }} className="font-bold hover:text-primary">{c.name}</Link>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-primary/15 text-primary rounded uppercase">{97 - i * 4}% match</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{c.niche} · {c.followers} · {c.engagement} eng</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => setSaveCreator(c)} className="size-9 grid place-items-center border border-border rounded hover:bg-muted text-sm" aria-label="Save">♡</button>
                      <button onClick={() => setInviteCreator(c)} className="px-3 py-2 text-xs font-bold bg-primary text-primary-foreground rounded hover:bg-primary/90">Invite</button>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="Recent Activity">
              {recentActivity.length === 0
                ? <p className="text-sm text-muted-foreground py-4 text-center">No activity yet.</p>
                : <ul className="space-y-4 text-sm">
                    {recentActivity.map((a) => {
                      const name = a.creator_profiles?.display_name ?? "A creator";
                      const { dot, text } = activityMeta(a.status, name);
                      return (
                        <li key={a.id} className="flex gap-3 items-start">
                          <span className={`size-2 rounded-full mt-1.5 shrink-0 ${dot}`} />
                          <div className="flex-1">
                            <p className="text-sm text-foreground/80">{text}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{relativeTime(a.created_at)}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
              }
            </Panel>
          </div>
        </div>
      </>}

      {/* ── Campaigns tab ────────────────────────────────────────────────── */}
      {tab === "campaigns" && <>
        <DashboardHeader title="Campaigns" subtitle="Manage your influencer campaigns"
          actions={<button onClick={() => setCampaignOpen(true)}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded font-semibold hover:bg-primary/90 transition-colors">
            + New Campaign
          </button>}
        />
        <div className="p-6 lg:p-10">
          <Panel title={`${campaigns.length} Campaign${campaigns.length !== 1 ? "s" : ""}`}>
            {campaigns.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-muted-foreground text-sm mb-4">No campaigns yet.</p>
                <button onClick={() => setCampaignOpen(true)}
                  className="px-5 py-2.5 bg-primary text-primary-foreground rounded font-semibold text-sm hover:bg-primary/90 transition-colors">
                  + Create your first campaign
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto -m-5">
                <table className="w-full text-sm">
                  <thead className="text-left text-[10px] font-mono uppercase tracking-widest text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-5 py-3 font-medium">Campaign</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium text-right">Budget</th>
                      <th className="px-5 py-3 font-medium text-right">Created</th>
                      <th className="px-5 py-3 font-medium text-right">Report</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {campaigns.map((c) => (
                      <tr key={c.id} className="hover:bg-muted/40">
                        <td className="px-5 py-4 font-semibold">{c.name}</td>
                        <td className="px-5 py-4">
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase ${
                            c.status === "live"        ? "bg-emerald-500/20 text-emerald-300" :
                            c.status === "negotiating" ? "bg-amber-500/20 text-amber-300" :
                            c.status === "completed"   ? "bg-blue-500/20 text-blue-300" :
                                                         "bg-muted text-muted-foreground"
                          }`}>{c.status}</span>
                        </td>
                        <td className="px-5 py-4 text-right font-mono">
                          {c.budget_inr ? `₹${c.budget_inr.toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td className="px-5 py-4 text-right text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => setReportCampaign(c)}
                            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                          >
                            ✦ Report
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      </>}

      {/* ── Shortlists tab ───────────────────────────────────────────────── */}
      {tab === "shortlists" && <>
        <DashboardHeader title="Shortlists" subtitle="Curate creator lists for your campaigns"
          actions={<button onClick={() => setShortlistOpen(true)}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded font-semibold hover:bg-primary/90 transition-colors">
            + Create Shortlist
          </button>}
        />
        <div className="p-6 lg:p-10">
          {shortlists.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-muted-foreground text-sm mb-4">No shortlists yet.</p>
              <button onClick={() => setShortlistOpen(true)}
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded font-semibold text-sm hover:bg-primary/90 transition-colors">
                + Create your first shortlist
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {shortlists.map((s, i) => {
                void i;
                const count = s.shortlist_items?.[0]?.count ?? 0;
                return (
                  <div key={s.id}
                    className="bg-card border border-border rounded-md p-5 flex flex-col justify-between hover:border-primary/30 transition-colors cursor-default">
                    <p className="text-xs text-muted-foreground mb-3">{count} creator{count !== 1 ? "s" : ""}</p>
                    <p className="text-base font-semibold leading-tight">{s.name}</p>
                  </div>
                );
              })}
              {/* Add new card */}
              <button onClick={() => setShortlistOpen(true)}
                className="aspect-[4/3] rounded-sm border-2 border-dashed border-border hover:border-primary hover:text-primary flex items-center justify-center text-muted-foreground transition-colors text-sm font-medium">
                + New shortlist
              </button>
            </div>
          )}
        </div>
      </>}

      {/* ── Coming soon tabs ─────────────────────────────────────────────── */}
      {(tab === "contracts" || tab === "reports" || tab === "billing") && <>
        <DashboardHeader
          title={tab.charAt(0).toUpperCase() + tab.slice(1)}
          subtitle="This feature is on its way"
        />
        <div className="p-6 lg:p-10 flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
          <span className="text-6xl">
            {tab === "contracts" ? "▤" : tab === "reports" ? "△" : "$"}
          </span>
          <h2 className="text-2xl font-bold">{tab.charAt(0).toUpperCase() + tab.slice(1)} — Coming soon</h2>
          <p className="text-muted-foreground max-w-sm">
            {tab === "contracts" && "Manage contracts, deliverables and agreements with creators — all in one place."}
            {tab === "reports"   && "Campaign performance reports, reach analytics and ROI tracking."}
            {tab === "billing"   && "Invoices, payment history and billing management."}
          </p>
        </div>
      </>}

      {campaignOpen && (
        <NewCampaignModal
          brandId={brand?.id ?? ""}
          brandName={brandName}
          onClose={() => setCampaignOpen(false)}
          onCreated={() => { setCampaignOpen(false); router.invalidate(); }}
        />
      )}

      {shortlistOpen && (
        <CreateShortlistModal
          brandId={brand?.id ?? ""}
          onClose={() => setShortlistOpen(false)}
          onCreated={() => { setShortlistOpen(false); router.invalidate(); }}
        />
      )}

      {inviteCreator && (
        <BrandInquiryModal
          brandId={brand?.id ?? ""}
          creatorId={inviteCreator.dbId ?? ""}
          creatorName={inviteCreator.name}
          brandName={brandName}
          creatorNiche={inviteCreator.niche}
          onClose={() => setInviteCreator(null)}
        />
      )}

      {saveCreator && (
        <SaveToShortlistModal
          creatorId={saveCreator.dbId ?? ""}
          creatorName={saveCreator.name}
          brandId={brand?.id ?? ""}
          shortlists={shortlists}
          onClose={() => setSaveCreator(null)}
          onSaved={() => { setSaveCreator(null); router.invalidate(); }}
        />
      )}

      {reportCampaign && (
        <CampaignReportModal
          campaign={reportCampaign}
          brandName={brandName}
          onClose={() => setReportCampaign(null)}
        />
      )}
    </DashboardShell>
  );
}

// ── Campaign Report Modal ─────────────────────────────────────────────────────

function CampaignReportModal({ campaign, brandName, onClose }: {
  campaign: CampaignRow;
  brandName?: string;
  onClose: () => void;
}) {
  const [summary,    setSummary]    = useState("");
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");

  const inquiriesSent   = campaign.inquiries?.length ?? 0;
  const creatorsBooked  = campaign.inquiries?.filter((i) => i.status === "accepted" || i.status === "completed").length ?? 0;

  useEffect(() => {
    async function generate() {
      try {
        const { data, error: fnErr } = await supabase.functions.invoke("summarize-campaign", {
          body: {
            brandName,
            campaignName:    campaign.name,
            status:          campaign.status,
            budgetInr:       campaign.budget_inr,
            brief:           campaign.brief,
            inquiriesSent,
            creatorsBooked,
            createdAt:       campaign.created_at,
          },
        });
        if (fnErr) throw fnErr;
        if (data?.error) throw new Error(data.error);
        setSummary(data.summary ?? "");
      } catch (e) {
        setError((e as Error).message ?? "Report generation failed.");
      } finally {
        setLoading(false);
      }
    }
    generate();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="font-bold">Campaign Report</h2>
            <p className="text-xs text-muted-foreground">{campaign.name}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">✕</button>
        </div>

        <div className="overflow-y-auto p-6 flex-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
              <span className="inline-block w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm">Generating report…</p>
            </div>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground text-sm leading-relaxed whitespace-pre-wrap">
              {summary}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border shrink-0 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 border border-border rounded font-semibold text-sm hover:bg-muted transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── New Campaign Modal ────────────────────────────────────────────────────────

const CAMPAIGN_STATUSES = ["draft", "live", "negotiating", "completed"] as const;

function NewCampaignModal({ brandId, brandName, onClose, onCreated }: {
  brandId: string;
  brandName?: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name,     setName]     = useState("");
  const [brief,    setBrief]    = useState("");
  const [budget,   setBudget]   = useState("");
  const [status,   setStatus]   = useState<typeof CAMPAIGN_STATUSES[number]>("draft");
  const [saving,   setSaving]   = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [error,    setError]    = useState("");

  async function draftBrief() {
    if (!name.trim()) { setError("Enter a campaign name first."); return; }
    setDrafting(true);
    setError("");
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("generate-brief", {
        body: { campaignName: name.trim(), budget, brandName },
      });
      if (fnErr) throw fnErr;
      if (data?.error) throw new Error(data.error);
      setBrief(data.brief ?? "");
    } catch (e) {
      setError((e as Error).message ?? "Brief generation failed. Try again.");
    } finally {
      setDrafting(false);
    }
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const { error: err } = await supabase.from("campaigns").insert({
      brand_id:   brandId,
      name:       name.trim(),
      brief:      brief.trim() || null,
      budget_inr: budget ? parseInt(budget.replace(/[^0-9]/g, "")) : null,
      status,
    });

    setSaving(false);
    if (err) { setError(err.message); return; }
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-bold">New Campaign</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Campaign name *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer Skincare Drop"
              className="w-full px-4 py-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium">
                Brief <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <button
                type="button"
                onClick={draftBrief}
                disabled={drafting || !name.trim()}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-primary/10 text-primary border border-primary/30 rounded-full hover:bg-primary/20 transition-all disabled:opacity-50"
              >
                {drafting ? (
                  <>
                    <span className="inline-block w-3 h-3 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                    Drafting…
                  </>
                ) : (
                  <>✦ Draft brief with AI</>
                )}
              </button>
            </div>
            <textarea
              rows={brief ? 10 : 3}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Describe the campaign goals, deliverables, target audience… or let AI draft it above."
              className="w-full px-4 py-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:border-primary resize-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Budget (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="e.g. 100000"
                  className="w-full pl-7 pr-3 py-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof CAMPAIGN_STATUSES[number])}
                className="w-full px-3 py-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:border-primary"
              >
                {CAMPAIGN_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-border rounded font-semibold text-sm hover:bg-muted transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-[2] py-2.5 bg-primary text-primary-foreground font-bold rounded text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Creating…" : "Create Campaign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Brand Inquiry Modal ───────────────────────────────────────────────────────

function BrandInquiryModal({ brandId, creatorId, creatorName, brandName, creatorNiche, onClose }: {
  brandId: string;
  creatorId: string;
  creatorName: string;
  brandName?: string;
  creatorNiche?: string;
  onClose: () => void;
}) {
  const [message,         setMessage]         = useState("");
  const [offer,           setOffer]           = useState("");
  const [campaignContext, setCampaignContext] = useState("");
  const [submitting,      setSubmitting]      = useState(false);
  const [drafting,        setDrafting]        = useState(false);
  const [error,           setError]           = useState("");
  const [done,            setDone]            = useState(false);

  async function draftWithAI() {
    setDrafting(true);
    setError("");
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("generate-inquiry", {
        body: { brandName, creatorName, creatorNiche, campaignContext },
      });
      if (fnErr) throw fnErr;
      if (data?.error) throw new Error(data.error);
      setMessage(data.message ?? "");
    } catch (e) {
      setError((e as Error).message ?? "AI draft failed. Try again.");
    } finally {
      setDrafting(false);
    }
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const { data: { session } } = await supabase.auth.getSession();

    // Prevent self-inquiry (brand messaging their own creator profile)
    if (session) {
      const { data: ownCreator } = await supabase
        .from("creator_profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("id", creatorId)
        .maybeSingle();
      if (ownCreator) {
        setError("You can't send an inquiry to your own creator profile.");
        setSubmitting(false);
        return;
      }
    }

    const { data: inquiry, error: iErr } = await supabase
      .from("inquiries")
      .insert({
        brand_id:   brandId,
        creator_id: creatorId,
        offer_inr:  offer ? parseInt(offer.replace(/[^0-9]/g, "")) : null,
        status:     "new",
      })
      .select("id")
      .single();

    if (iErr) { setError(iErr.message); setSubmitting(false); return; }

    const { data: thread, error: tErr } = await supabase
      .from("message_threads")
      .insert({ inquiry_id: inquiry.id })
      .select("id")
      .single();

    if (tErr) { setError(tErr.message); setSubmitting(false); return; }

    await supabase.from("messages").insert({
      thread_id:      thread.id,
      sender_user_id: session?.user.id ?? null,
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
              {creatorName} will be notified. Track replies in your inbox.
            </p>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded font-semibold text-sm hover:bg-muted transition-colors">Close</button>
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
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Campaign context for AI */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  What are you promoting?
                  <span className="text-muted-foreground font-normal ml-1">(helps AI draft your message)</span>
                </label>
                <input
                  value={campaignContext}
                  onChange={(e) => setCampaignContext(e.target.value)}
                  placeholder="e.g. new ethnic wear collection launch"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:border-primary/60 transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium">Your message *</label>
                  <button
                    type="button"
                    onClick={draftWithAI}
                    disabled={drafting}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-primary/10 text-primary border border-primary/30 rounded-full hover:bg-primary/20 transition-all disabled:opacity-50"
                  >
                    {drafting ? (
                      <>
                        <span className="inline-block w-3 h-3 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                        Drafting…
                      </>
                    ) : (
                      <>✦ Draft with AI</>
                    )}
                  </button>
                </div>
                <textarea
                  required rows={5} value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Hi ${creatorName.split(" ")[0]}, we'd love to collaborate on…`}
                  className="w-full px-4 py-3 bg-background border border-border rounded text-sm focus:outline-none focus:border-primary/60 resize-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Budget offer <span className="text-muted-foreground font-normal">(optional)</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
                  <input type="number" value={offer} onChange={(e) => setOffer(e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full pl-8 pr-4 py-3 bg-background border border-border rounded text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} className="flex-1 py-3 border border-border rounded font-semibold hover:bg-muted transition-colors">Cancel</button>
                <button type="submit" disabled={submitting || !message.trim()}
                  className="flex-[2] py-3 bg-primary text-primary-foreground font-bold rounded hover:bg-primary/90 transition-colors disabled:opacity-50">
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

// ── Save to Shortlist Modal ───────────────────────────────────────────────────

function SaveToShortlistModal({ creatorId, creatorName, brandId, shortlists, onClose, onSaved }: {
  creatorId: string;
  creatorName: string;
  brandId: string;
  shortlists: ShortlistRow[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  async function saveToExisting(shortlistId: string) {
    setSaving(true);
    setError("");
    const { error: err } = await supabase
      .from("shortlist_items")
      .insert({ shortlist_id: shortlistId, creator_id: creatorId });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  async function createAndSave(e: React.SyntheticEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const { data: sl, error: slErr } = await supabase
      .from("shortlists")
      .insert({ brand_id: brandId, name: newName.trim() })
      .select("id")
      .single();
    if (slErr) { setError(slErr.message); setSaving(false); return; }
    const { error: itemErr } = await supabase
      .from("shortlist_items")
      .insert({ shortlist_id: sl.id, creator_id: creatorId });
    setSaving(false);
    if (itemErr) { setError(itemErr.message); return; }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-bold">Save to Shortlist</h2>
            <p className="text-xs text-muted-foreground">{creatorName}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">✕</button>
        </div>

        <div className="p-6 space-y-3">
          {shortlists.length > 0 && (
            <div className="space-y-2">
              {shortlists.map((s) => (
                <button
                  key={s.id}
                  disabled={saving}
                  onClick={() => saveToExisting(s.id)}
                  className="w-full text-left px-4 py-3 border border-border rounded hover:border-primary hover:bg-primary/5 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {s.name}
                  <span className="float-right text-muted-foreground font-normal text-xs">
                    {s.shortlist_items?.[0]?.count ?? 0} creators
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-border pt-3">
            {creating ? (
              <form onSubmit={createAndSave} className="flex gap-2">
                <input
                  autoFocus required value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="New shortlist name"
                  className="flex-1 px-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:border-primary"
                />
                <button type="submit" disabled={saving || !newName.trim()}
                  className="px-3 py-2 bg-primary text-primary-foreground rounded text-sm font-bold disabled:opacity-50">
                  {saving ? "…" : "Save"}
                </button>
              </form>
            ) : (
              <button onClick={() => setCreating(true)}
                className="w-full text-sm text-primary hover:text-primary/80 py-1">
                + Create new shortlist
              </button>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  );
}

// ── Create Shortlist Modal ────────────────────────────────────────────────────

function CreateShortlistModal({ brandId, onClose, onCreated }: {
  brandId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name,   setName]   = useState("");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const { error: err } = await supabase
      .from("shortlists")
      .insert({ brand_id: brandId, name: name.trim() });

    setSaving(false);
    if (err) { setError(err.message); return; }
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-bold">New Shortlist</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Shortlist name *</label>
            <input
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='e.g. "Summer Campaign Picks"'
              className="w-full px-4 py-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:border-primary"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-border rounded font-semibold text-sm hover:bg-muted transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-[2] py-2.5 bg-primary text-primary-foreground font-bold rounded text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Creating…" : "Create Shortlist"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React from "react";