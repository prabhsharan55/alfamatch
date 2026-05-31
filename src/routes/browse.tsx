import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { z } from "zod";
import { X as XIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { BRAND } from "@/lib/brand";
import { useAuth } from "@/contexts/auth";
import { useTheme } from "@/contexts/theme";

// ── Loader ────────────────────────────────────────────────────────────────────

const searchSchema = z.object({
  q:        z.string().optional(),
  category: z.string().optional(),
});

export const Route = createFileRoute("/browse")({
  validateSearch: searchSchema,
  loader: async () => {
    const { data } = await supabase
      .from("creator_profiles")
      .select(`
        id, slug, display_name, headline, avatar_url,
        city, state, languages, categories,
        total_followers, avg_engagement_rate, tier, verified, accepting_inquiries,
        social_channels(platform, handle, followers),
        rate_cards(price_inr, deliverable)
      `)
      .eq("accepting_inquiries", true)
      .order("total_followers", { ascending: false });

    return { creators: data ?? [] };
  },
  head: () => ({
    meta: [
      { title: `Browse Creators — ${BRAND.name}` },
      { name: "description", content: "Find the right creator for your campaign. Filter by category, city, language, tier and budget." },
    ],
  }),
  component: BrowsePage,
});

// ── Types ─────────────────────────────────────────────────────────────────────

type CreatorRow = {
  id: string; slug: string; display_name: string; headline: string | null;
  avatar_url: string | null; city: string | null; state: string | null;
  languages: string[] | null; categories: string[] | null;
  total_followers: number; avg_engagement_rate: number;
  tier: string | null; verified: boolean; accepting_inquiries: boolean;
  social_channels: { platform: string; handle: string; followers: number }[];
  rate_cards: { price_inr: number; deliverable: string }[];
};

const TIERS = ["nano", "micro", "macro", "mega"] as const;
const TIER_RANGE: Record<string, string> = {
  nano: "1K – 10K", micro: "10K – 100K", macro: "100K – 1M", mega: "1M+",
};

// ── Component ─────────────────────────────────────────────────────────────────

function BrowsePage() {
  const { creators } = Route.useLoaderData() as { creators: CreatorRow[] };
  const { session, role } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { q, category } = useSearch({ from: "/browse" });

  // ── Derive available filter options from data ──────────────────────────────
  const allCategories = useMemo(() =>
    [...new Set(creators.flatMap((c) => c.categories ?? []))].sort(), [creators]);
  const allCities = useMemo(() =>
    [...new Set(creators.map((c) => c.city).filter(Boolean) as string[])].sort(), [creators]);
  const allLanguages = useMemo(() =>
    [...new Set(creators.flatMap((c) => c.languages ?? []))].sort(), [creators]);

  // ── Filter state — seeded from URL params ──────────────────────────────────
  const [search,     setSearch]     = useState(q ?? "");
  const [categories, setCategories] = useState<string[]>(category ? [category] : []);
  const [cities,     setCities]     = useState<string[]>([]);
  const [languages,  setLanguages]  = useState<string[]>([]);
  const [tiers,      setTiers]      = useState<string[]>([]);
  const [maxBudget,  setMaxBudget]  = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  function toggle(arr: string[], val: string, set: (v: string[]) => void) {
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  function clearAll() {
    setSearch(""); setCategories([]); setCities([]);
    setLanguages([]); setTiers([]); setMaxBudget("");
  }

  const activeCount = categories.length + cities.length + languages.length + tiers.length + (maxBudget ? 1 : 0);

  // ── Filtered results ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const budget = maxBudget ? parseInt(maxBudget.replace(/[^0-9]/g, "")) : null;
    return creators.filter((c) => {
      if (search && !c.display_name.toLowerCase().includes(search.toLowerCase()) &&
          !(c.headline ?? "").toLowerCase().includes(search.toLowerCase())) return false;
      if (categories.length && !categories.some((cat) => c.categories?.includes(cat))) return false;
      if (cities.length     && !cities.includes(c.city ?? ""))                         return false;
      if (languages.length  && !languages.some((l) => c.languages?.includes(l)))       return false;
      if (tiers.length      && !tiers.includes(c.tier ?? ""))                          return false;
      if (budget) {
        const minRate = c.rate_cards.length ? Math.min(...c.rate_cards.map((r) => r.price_inr)) : Infinity;
        if (minRate > budget) return false;
      }
      return true;
    });
  }, [creators, search, categories, cities, languages, tiers, maxBudget]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-8">
            <Link to="/" className="font-black text-xl tracking-tight text-primary">{BRAND.name}</Link>
            <span className="text-sm text-foreground/60">Browse Creators</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="size-8 grid place-items-center rounded-full text-foreground/60 hover:text-foreground hover:bg-muted/60 transition-all duration-200 text-sm"
            >
              {theme === "dark" ? "☀" : "☾"}
            </button>
            {session ? (
              <Link
                to={role === "brand" ? "/dashboard/brand" : "/dashboard/creator"}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded font-semibold hover:bg-primary/90 transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <Link to="/auth/signup" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded font-semibold hover:bg-primary/90 transition-colors">
                Join Free
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-1">Discover Creators</h1>
          <p className="text-muted-foreground text-sm">
            {creators.length} verified creators across India
          </p>
        </div>

        {/* Search + mobile filter toggle */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or niche…"
              className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-primary/60 transition-all duration-200"
            />
          </div>
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className={`lg:hidden flex items-center gap-2 px-4 py-2.5 border rounded text-sm font-medium transition-colors
              ${filtersOpen ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
          >
            ⚙ Filters {activeCount > 0 && <span className="bg-primary text-primary-foreground text-xs rounded-full px-1.5">{activeCount}</span>}
          </button>
          {activeCount > 0 && (
            <button onClick={clearAll} className="px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded">
              Clear all
            </button>
          )}
        </div>

        <div className="flex gap-8">

          {/* ── Mobile filter drawer overlay ─────────────────────────────── */}
          {filtersOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setFiltersOpen(false)} />
              <aside className="absolute inset-y-0 left-0 w-80 max-w-[90vw] bg-background border-r border-border flex flex-col shadow-xl">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                  <span className="font-semibold text-sm">Filters {activeCount > 0 && `(${activeCount})`}</span>
                  <button onClick={() => setFiltersOpen(false)} className="size-8 grid place-items-center rounded hover:bg-muted transition-colors" aria-label="Close filters">
                    <XIcon className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                  <FilterPanelContents
                    allCategories={allCategories} categories={categories} setCategories={setCategories}
                    tiers={tiers} setTiers={setTiers}
                    allCities={allCities} cities={cities} setCities={setCities}
                    allLanguages={allLanguages} languages={languages} setLanguages={setLanguages}
                    maxBudget={maxBudget} setMaxBudget={setMaxBudget}
                    toggle={toggle}
                  />
                </div>
                {activeCount > 0 && (
                  <div className="p-4 border-t border-border shrink-0">
                    <button onClick={() => { clearAll(); setFiltersOpen(false); }} className="w-full py-2.5 text-sm font-medium border border-border rounded hover:bg-muted transition-colors">
                      Clear all filters
                    </button>
                  </div>
                )}
              </aside>
            </div>
          )}

          {/* ── Desktop filter sidebar ───────────────────────────────────── */}
          <aside className="hidden lg:block w-48 shrink-0 space-y-6">
            <FilterPanelContents
              allCategories={allCategories} categories={categories} setCategories={setCategories}
              tiers={tiers} setTiers={setTiers}
              allCities={allCities} cities={cities} setCities={setCities}
              allLanguages={allLanguages} languages={languages} setLanguages={setLanguages}
              maxBudget={maxBudget} setMaxBudget={setMaxBudget}
              toggle={toggle}
            />
          </aside>

          {/* ── Results ─────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Result count + active filters */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-muted-foreground">
                <span className="font-bold text-foreground">{filtered.length}</span> creator{filtered.length !== 1 ? "s" : ""} found
              </p>
            </div>

            {filtered.length === 0 ? (
              <EmptyState onClear={clearAll} />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((c) => <CreatorCard key={c.id} creator={c} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Creator Card ──────────────────────────────────────────────────────────────

function CreatorCard({ creator: c }: { creator: CreatorRow }) {
  const minRate = c.rate_cards.length ? Math.min(...c.rate_cards.map((r) => r.price_inr)) : null;
  const initials = c.display_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const location = [c.city, c.state].filter(Boolean).join(", ");

  function formatN(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
    return `${n}`;
  }

  return (
    <Link
      to="/creator/$creatorId"
      params={{ creatorId: c.slug }}
      className="group block bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 card-hover"
    >
      {/* Portrait image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-primary/30 via-primary/10 to-background">
        {c.avatar_url ? (
          <img src={c.avatar_url} alt={c.display_name} className="w-full h-full object-cover object-top" />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-6xl font-black text-primary/40 select-none">
            {initials}
          </span>
        )}
        {/* Badges */}
        {c.tier && (
          <span className={`absolute top-2 right-2 text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded font-bold
            ${c.tier === "nano"  ? "bg-emerald-500/20 text-emerald-300" :
              c.tier === "micro" ? "bg-blue-500/20 text-blue-300" :
              c.tier === "macro" ? "bg-violet-500/20 text-violet-300" :
                                   "bg-amber-500/20 text-amber-300"}`}>
            {c.tier}
          </span>
        )}
        {c.verified && (
          <span className="absolute top-2 left-2 text-[10px] font-mono text-primary bg-background/80 px-1.5 py-0.5 rounded">
            ● Verified
          </span>
        )}
        {/* Bottom gradient overlay with follower count */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent flex items-end px-3 pb-2.5">
          {c.total_followers > 0 && (
            <span className="text-white text-sm font-black">{formatN(c.total_followers)} followers</span>
          )}
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-sm leading-tight group-hover:text-primary transition-colors">
            {c.display_name}
          </h3>
          {c.avg_engagement_rate > 0 && (
            <span className="text-[10px] font-mono font-bold text-primary shrink-0">{c.avg_engagement_rate}%</span>
          )}
        </div>

        {location && (
          <p className="text-[11px] text-muted-foreground mb-2">📍 {location}</p>
        )}

        {/* Categories */}
        {(c.categories?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {c.categories!.slice(0, 2).map((cat) => (
              <span key={cat} className="text-[10px] px-1.5 py-0.5 bg-muted text-foreground/70 rounded-full">{cat}</span>
            ))}
            {(c.categories?.length ?? 0) > 2 && (
              <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded-full">+{c.categories!.length - 2}</span>
            )}
          </div>
        )}

        <div className="text-[11px] font-bold text-muted-foreground">
          {minRate ? `from ₹${minRate.toLocaleString("en-IN")}` : "Rate on request"}
        </div>
      </div>
    </Link>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="py-20 text-center">
      <div className="text-5xl mb-4">🔍</div>
      <h3 className="text-xl font-bold mb-2">No creators match yet</h3>
      <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
        Try widening your filters — more creators are joining every day.
      </p>
      <button onClick={onClear} className="px-5 py-2.5 bg-primary text-primary-foreground rounded font-semibold text-sm hover:bg-primary/90 transition-colors">
        Clear all filters
      </button>
    </div>
  );
}

// ── Filter panel contents (shared between drawer + desktop sidebar) ───────────

function FilterPanelContents({
  allCategories, categories, setCategories,
  tiers, setTiers,
  allCities, cities, setCities,
  allLanguages, languages, setLanguages,
  maxBudget, setMaxBudget,
  toggle,
}: {
  allCategories: string[]; categories: string[]; setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  tiers: string[]; setTiers: React.Dispatch<React.SetStateAction<string[]>>;
  allCities: string[]; cities: string[]; setCities: React.Dispatch<React.SetStateAction<string[]>>;
  allLanguages: string[]; languages: string[]; setLanguages: React.Dispatch<React.SetStateAction<string[]>>;
  maxBudget: string; setMaxBudget: React.Dispatch<React.SetStateAction<string>>;
  toggle: (arr: string[], val: string, set: React.Dispatch<React.SetStateAction<string[]>>) => void;
}) {
  return (
    <>
      <FilterSection title="Category">
        <div className="flex flex-wrap gap-2">
          {allCategories.map((cat) => (
            <Chip key={cat} active={categories.includes(cat)} onClick={() => toggle(categories, cat, setCategories)}>
              {cat}
            </Chip>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Follower Tier">
        <div className="space-y-2">
          {TIERS.map((t) => (
            <label key={t} className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-2">
                <div
                  className={`size-4 rounded border transition-colors ${tiers.includes(t) ? "bg-primary border-primary" : "border-border group-hover:border-primary/60"}`}
                  onClick={() => toggle(tiers, t, setTiers)}
                >
                  {tiers.includes(t) && <span className="block text-primary-foreground text-[10px] leading-4 text-center">✓</span>}
                </div>
                <span className="text-sm capitalize">{t}</span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">{TIER_RANGE[t]}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {allCities.length > 0 && (
        <FilterSection title="City">
          <div className="flex flex-wrap gap-2">
            {allCities.map((city) => (
              <Chip key={city} active={cities.includes(city)} onClick={() => toggle(cities, city, setCities)}>
                {city}
              </Chip>
            ))}
          </div>
        </FilterSection>
      )}

      {allLanguages.length > 0 && (
        <FilterSection title="Language">
          <div className="flex flex-wrap gap-2">
            {allLanguages.map((lang) => (
              <Chip key={lang} active={languages.includes(lang)} onClick={() => toggle(languages, lang, setLanguages)}>
                {lang}
              </Chip>
            ))}
          </div>
        </FilterSection>
      )}

      <FilterSection title="Max Budget (₹)">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">₹</span>
          <input
            type="number"
            value={maxBudget}
            onChange={(e) => setMaxBudget(e.target.value)}
            placeholder="e.g. 20000"
            className="w-full pl-8 pr-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-2 mt-2">
          {["5000", "15000", "50000"].map((v) => (
            <button key={v} onClick={() => setMaxBudget(v)}
              className={`flex-1 text-xs py-1.5 rounded border transition-colors
                ${maxBudget === v ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/60"}`}>
              ₹{parseInt(v).toLocaleString("en-IN")}
            </button>
          ))}
        </div>
      </FilterSection>
    </>
  );
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors
        ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground/70 border-border hover:border-primary/60"}`}
    >
      {children}
    </button>
  );
}

import React from "react";
