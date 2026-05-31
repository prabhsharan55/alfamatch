import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search, Sparkles, Handshake, Mail, FileText, TrendingUp,
  MessageCircle, BarChart2, Building2, Video, Shirt, ChefHat,
  Dumbbell, Laptop, Gem, LineChart, MapPin, Heart, Menu, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Creator } from "@/data/creators";
import { getCreators } from "@/lib/creators-api";
import { BRAND } from "@/lib/brand";
import { useAuth } from "@/contexts/auth";
import { useTheme } from "@/contexts/theme";

export const Route = createFileRoute("/")({
  loader: async () => {
    const creators = await getCreators();
    return { creators };
  },
  head: () => ({
    meta: [
      { title: `${BRAND.name} — ${BRAND.tagline}` },
      { name: "description", content: BRAND.description },
    ],
  }),
  component: Index,
});

// ── Nav ───────────────────────────────────────────────────────────────────────

function Nav() {
  const { session, role, availableRoles, switchRole, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 flex items-center justify-between px-5 lg:px-12 py-3 lg:py-4 bg-background/90 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-8">
          <div className="font-bold text-xl tracking-tight text-primary">{BRAND.name}</div>
          <div className="hidden md:flex items-center gap-6 text-sm text-foreground/60">
            <Link to="/browse" className="hover:text-foreground transition-colors">Browse</Link>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#for-creators" className="hover:text-foreground transition-colors">For Creators</a>
            <a href="#for-brands" className="hover:text-foreground transition-colors">For Brands</a>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-2">
            <button onClick={toggleTheme} aria-label="Toggle theme"
              className="size-9 grid place-items-center rounded-full text-foreground/50 hover:text-foreground hover:bg-muted/60 transition-colors">
              {theme === "dark" ? <span className="text-sm">☀</span> : <span className="text-sm">☾</span>}
            </button>
            {session ? (
              <>
                <Link to="/inbox" className="px-4 py-2 border border-border rounded-full text-sm font-medium hover:bg-muted transition-colors">Inbox</Link>
                <Link to={role === "brand" ? "/dashboard/brand" : "/dashboard/creator"}
                  className="px-4 py-2 border border-border rounded-full text-sm font-medium hover:bg-muted transition-colors">Dashboard</Link>
                {availableRoles.hasCreator && availableRoles.hasBrand && (
                  <button onClick={async () => { const dest = await switchRole(role === "brand" ? "creator" : "brand"); navigate({ to: dest }); }}
                    className="px-4 py-2 border border-primary/40 text-primary rounded-full text-sm font-medium hover:bg-primary/10 transition-colors">
                    Switch role
                  </button>
                )}
                <button onClick={() => signOut()} className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors">Sign Out</button>
              </>
            ) : (
              <>
                <Link to="/auth/login" className="px-4 py-2 border border-border rounded-full text-sm font-medium hover:bg-muted/60 transition-colors">Sign In</Link>
                <Link to="/auth/signup" className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors">Join Free</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((v: boolean) => !v)}
            className="md:hidden size-10 grid place-items-center rounded-md hover:bg-muted transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" strokeWidth={1.75} /> : <Menu className="w-5 h-5" strokeWidth={1.75} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[49px] z-40 bg-background border-b border-border shadow-lg px-5 py-4 space-y-1">
          <Link to="/browse" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm rounded-md hover:bg-muted transition-colors">Browse</Link>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm rounded-md hover:bg-muted transition-colors">How it works</a>
          <a href="#for-creators" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm rounded-md hover:bg-muted transition-colors">For Creators</a>
          <a href="#for-brands" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm rounded-md hover:bg-muted transition-colors">For Brands</a>
          <div className="border-t border-border pt-3 mt-3 space-y-1">
            {session ? (
              <>
                <Link to="/inbox" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm rounded-md hover:bg-muted transition-colors">Inbox</Link>
                <Link to={role === "brand" ? "/dashboard/brand" : "/dashboard/creator"} onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm rounded-md hover:bg-muted transition-colors">Dashboard</Link>
                <button onClick={() => { signOut(); setMenuOpen(false); }} className="w-full text-left px-3 py-2.5 text-sm rounded-md hover:bg-muted transition-colors text-foreground/70">Sign Out</button>
              </>
            ) : (
              <div className="flex gap-2 pt-1">
                <Link to="/auth/login" onClick={() => setMenuOpen(false)} className="flex-1 text-center px-4 py-2.5 border border-border rounded-full text-sm font-medium hover:bg-muted transition-colors">Sign In</Link>
                <Link to="/auth/signup" onClick={() => setMenuOpen(false)} className="flex-1 text-center px-4 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors">Join Free</Link>
              </div>
            )}
            <button onClick={() => { toggleTheme(); setMenuOpen(false); }} className="w-full text-left px-3 py-2.5 text-sm rounded-md hover:bg-muted transition-colors text-foreground/60">
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

function Index() {
  const { creators } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero creators={creators} />
      <StatsStrip />
      <HowItWorks />
      <AISection />
      <CreatorShowcase creators={creators} />
      <ForBrandsAndCreators />
      <CategoriesSection />
      <FinalCTA />
      <Footer />
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero({ creators }: { creators: Creator[] }) {
  const mosaic = creators.slice(0, 6);

  return (
    <section className="relative overflow-hidden min-h-[92vh] flex items-center">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[50%] rounded-full bg-primary/8 blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-12 w-full py-20 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left — copy */}
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs font-semibold text-primary mb-6 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            India's #1 Creator Marketplace
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6">
            Connect with creators who{" "}
            <span className="text-gradient">actually move</span>{" "}
            the needle.
          </h1>

          <p className="text-lg text-foreground/70 mb-8 leading-relaxed">
            Discover nano & micro creators across India. AI-powered matching, direct deals, INR pricing. No middlemen, no hidden fees.
          </p>

          <div className="flex flex-wrap gap-3 mb-10">
            <Link to="/browse"
              className="flex items-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground rounded-full font-bold text-sm hover:bg-primary/90 transition-all duration-200 glow-primary">
              Browse Creators →
            </Link>
            <Link to="/auth/signup"
              className="flex items-center gap-2 px-7 py-3.5 border border-border rounded-full font-bold text-sm hover:bg-muted/60 transition-all duration-200">
              Join as Creator
            </Link>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> Free to join</span>
            <span className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> No commission on deals</span>
            <span className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> INR pricing</span>
          </div>
        </div>

        {/* Right — creator mosaic */}
        <div className="hidden lg:grid grid-cols-3 gap-3">
          {mosaic.map((c, i) => (
            <Link
              key={c.id}
              to="/creator/$creatorId"
              params={{ creatorId: c.id }}
              className={`group relative overflow-hidden rounded-2xl bg-card border border-border card-hover
                ${i === 1 ? "mt-8" : ""} ${i === 4 ? "mt-8" : ""}`}
            >
              <div className="aspect-[3/4] overflow-hidden bg-gradient-to-br from-primary/20 via-primary/5 to-background">
                {c.img ? (
                  <img src={c.img} alt={c.name} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full grid place-items-center">
                    <span className="text-4xl font-black text-primary/30">
                      {c.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                    </span>
                  </div>
                )}
              </div>
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white text-xs font-bold truncate">{c.name}</p>
                <p className="text-white/60 text-[10px] truncate">{c.niche}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Stats Strip ───────────────────────────────────────────────────────────────

function StatsStrip() {
  const stats = [
    { value: "25+",    label: "Verified Creators" },
    { value: "14",     label: "Cities Covered" },
    { value: "9",      label: "Languages" },
    { value: "AI ✦",   label: "Powered Matching" },
  ];

  return (
    <div className="border-y border-border bg-card/40">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-3xl font-black text-primary mb-1">{s.value}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-widest font-mono">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── How It Works ──────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps: { n: string; title: string; body: string; Icon: LucideIcon }[] = [
    {
      n: "01",
      title: "Describe what you need",
      body: "Tell our AI what kind of creator you're looking for — niche, city, language, budget. Or browse 25+ verified profiles directly.",
      Icon: Search,
    },
    {
      n: "02",
      title: "AI finds the best match",
      body: "Our matching engine reads creator profiles and ranks them for your campaign. See match scores and reasoning for each result.",
      Icon: Sparkles,
    },
    {
      n: "03",
      title: "Connect & close deals",
      body: "Send an AI-drafted inquiry, negotiate directly in the inbox, and close your campaign — all in one place, with zero commission.",
      Icon: Handshake,
    },
  ];

  return (
    <section id="how-it-works" className="py-24 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-mono uppercase tracking-widest text-primary mb-3">Simple Process</p>
          <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-4">How AlfaMatch works</h2>
          <p className="text-muted-foreground max-w-md mx-auto">From search to signed deal in minutes, not weeks.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.n} className="bg-card border border-border rounded-2xl p-8 hover:border-primary/30 transition-colors">
              <s.Icon className="w-5 h-5 text-foreground/30 mb-6" strokeWidth={1.5} />
              <div className="text-[10px] font-mono text-muted-foreground tracking-widest mb-2">{s.n}</div>
              <h3 className="text-lg font-bold mb-3">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── AI Section ────────────────────────────────────────────────────────────────

function AISection() {
  const features: { Icon: LucideIcon; title: string; body: string; tag: string }[] = [
    {
      Icon: Sparkles,
      title: "Smart Creator Match",
      body: "Describe your campaign in plain English. Our AI reads every creator profile and returns ranked matches with a score and reason.",
      tag: "Brands",
    },
    {
      Icon: Mail,
      title: "AI Inquiry Drafting",
      body: "Type what you're promoting and let AI write a warm, personalised outreach message to the creator in one click.",
      tag: "Brands",
    },
    {
      Icon: FileText,
      title: "Campaign Brief Generator",
      body: "Enter a campaign name and budget. AI generates a full brief — goals, deliverables, dos and don'ts, tone — instantly.",
      tag: "Brands",
    },
    {
      Icon: TrendingUp,
      title: "Profile Optimizer",
      body: "Creators paste a rough bio and get back a polished headline and bio that's designed to attract brand inquiries.",
      tag: "Creators",
    },
    {
      Icon: MessageCircle,
      title: "Negotiation Coach",
      body: "Stuck on what to reply in a negotiation? One click suggests a context-aware response based on your full thread history.",
      tag: "Both",
    },
    {
      Icon: BarChart2,
      title: "Campaign Reports",
      body: "Click one button and get a professional campaign performance summary with key numbers, insights, and next steps.",
      tag: "Brands",
    },
  ];

  return (
    <section className="py-24 px-6 lg:px-12 bg-card/30 border-y border-border">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs font-semibold text-primary mb-4">
            ✦ AI-Powered Platform
          </div>
          <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-4">
            The only marketplace with<br />AI built into every step
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            6 AI tools that save hours — from finding creators to closing campaigns. All powered by Claude AI.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="group bg-background border border-border rounded-2xl p-6 hover:border-primary/30 transition-all duration-200">
              <div className="flex items-start justify-between mb-5">
                <f.Icon className="w-5 h-5 text-foreground/30" strokeWidth={1.5} />
                <span className="text-[10px] font-mono text-muted-foreground/60">{f.tag}</span>
              </div>
              <h3 className="font-bold mb-2 group-hover:text-primary transition-colors">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Creator Showcase ──────────────────────────────────────────────────────────

function CreatorShowcase({ creators }: { creators: Creator[] }) {
  return (
    <section id="creators" className="py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-primary mb-2">Featured Creators</p>
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight">Meet our creators</h2>
          </div>
          <Link to="/browse" className="text-sm font-semibold text-primary hover:underline hidden md:block">
            Browse all {creators.length} →
          </Link>
        </div>
      </div>

      {/* Scroll rows */}
      <div className="space-y-4">
        <CreatorScrollRow creators={creators.slice(0, 10)} />
        <CreatorScrollRow creators={creators.slice(10)} />
      </div>
    </section>
  );
}

function CreatorScrollRow({ creators }: { creators: Creator[] }) {
  const list = creators.length >= 4 ? [...creators, ...creators] : creators;

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 px-6 lg:px-12 scrollbar-hide snap-x">
      {list.map((c, i) => (
        <Link
          key={`${c.id}-${i}`}
          to="/creator/$creatorId"
          params={{ creatorId: c.id }}
          className="group relative shrink-0 w-[200px] snap-start overflow-hidden rounded-2xl bg-card border border-border card-hover"
        >
          <div className="aspect-[3/4] overflow-hidden bg-gradient-to-br from-primary/20 via-primary/5 to-background">
            {c.img ? (
              <img src={c.img} alt={c.name} loading="lazy" className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full grid place-items-center">
                <span className="text-4xl font-black text-primary/30">
                  {c.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                </span>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-white text-sm font-bold truncate">{c.name}</p>
              <p className="text-white/60 text-[11px] truncate">{c.niche} · {c.followers}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ── For Brands & Creators ─────────────────────────────────────────────────────

function ForBrandsAndCreators() {
  return (
    <section className="py-24 px-6 lg:px-12 border-t border-border">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-6">

        {/* For Brands */}
        <div id="for-brands" className="bg-card border border-border rounded-3xl p-10">
          <Building2 className="w-5 h-5 text-foreground/30 mb-6" strokeWidth={1.5} />
          <p className="text-xs font-mono uppercase tracking-widest text-primary mb-2">For Brands</p>
          <h3 className="text-3xl font-black mb-4 tracking-tight">Run better influencer campaigns</h3>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Find the right creator in seconds with AI, not spreadsheets. Direct deals, structured briefs, and campaign reports — all in one dashboard.
          </p>
          <ul className="space-y-3 mb-8">
            {[
              "AI-powered creator matching by niche, city & language",
              "Draft outreach messages & campaign briefs with AI",
              "Manage shortlists, campaigns & contracts",
              "INR pricing — no dollar conversion, no surprises",
              "Zero commission on deals you close",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm">
                <span className="text-primary mt-0.5 shrink-0">✓</span>
                <span className="text-foreground/80">{item}</span>
              </li>
            ))}
          </ul>
          <Link to="/auth/signup" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-bold text-sm hover:bg-primary/90 transition-all glow-primary">
            Start for free →
          </Link>
        </div>

        {/* For Creators */}
        <div id="for-creators" className="bg-card border border-border rounded-3xl p-10">
          <Video className="w-5 h-5 text-foreground/30 mb-6" strokeWidth={1.5} />
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">For Creators</p>
          <h3 className="text-3xl font-black mb-4 tracking-tight">Get discovered by the right brands</h3>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            You don't need a million followers to land brand deals. AlfaMatch is built for nano & micro creators — your engagement and niche matter more than numbers.
          </p>
          <ul className="space-y-3 mb-8">
            {[
              "Free forever — no subscription, no hidden fees",
              "AI-optimized profile to attract more brand inquiries",
              "Manage all brand conversations in one inbox",
              "Accept, negotiate, or decline deals on your terms",
              "Tier 2 & 3 India creators especially welcome",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm">
                <span className="text-primary mt-0.5 shrink-0">✓</span>
                <span className="text-foreground/80">{item}</span>
              </li>
            ))}
          </ul>
          <Link to="/auth/signup" className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-full font-bold text-sm hover:bg-muted/60 transition-all">
            Create your profile →
          </Link>
        </div>

      </div>
    </section>
  );
}

// ── Categories ────────────────────────────────────────────────────────────────

const CATEGORIES: { name: string; count: string; Icon: LucideIcon }[] = [
  { name: "Fashion & Ethnic Wear", count: "8",  Icon: Shirt      },
  { name: "Food & Recipes",        count: "5",  Icon: ChefHat    },
  { name: "Fitness & Wellness",    count: "4",  Icon: Dumbbell   },
  { name: "Tech & Gaming",         count: "4",  Icon: Laptop     },
  { name: "Beauty & Skincare",     count: "4",  Icon: Gem        },
  { name: "Finance & Business",    count: "4",  Icon: LineChart  },
  { name: "Travel & Photography",  count: "2",  Icon: MapPin     },
  { name: "Parenting & Family",    count: "1",  Icon: Heart      },
];

function CategoriesSection() {
  return (
    <section className="py-24 px-6 lg:px-12 bg-card/20 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-mono uppercase tracking-widest text-primary mb-3">Browse by Niche</p>
          <h2 className="text-3xl lg:text-4xl font-black tracking-tight">Every niche. Every city.</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              to="/browse"
              search={{ category: cat.name.split(" & ")[0] }}
              className="group relative p-5 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all duration-200 card-hover"
            >
              <cat.Icon className="w-4 h-4 text-foreground/30 mb-4" strokeWidth={1.5} />
              <h3 className="font-bold text-sm leading-tight mb-1 group-hover:text-primary transition-colors">{cat.name}</h3>
              <p className="text-xs text-muted-foreground">{cat.count} creators</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Final CTA ─────────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section className="py-24 px-6 lg:px-12 border-t border-border">
      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs font-semibold text-primary mb-6">
          ✦ Free forever for creators
        </div>
        <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-5">
          India's influencer economy<br />is just getting started.
        </h2>
        <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
          Join AlfaMatch today — whether you're a brand looking for authentic voices or a creator ready to monetise your audience.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/auth/signup"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full font-bold hover:bg-primary/90 transition-all glow-primary text-base">
            Get started free →
          </Link>
          <Link to="/browse"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 border border-border rounded-full font-bold hover:bg-muted/60 transition-all text-base">
            Browse creators
          </Link>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">No credit card. No commission. Just connections.</p>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-border px-6 lg:px-12 py-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="font-black text-xl text-primary mb-3">{BRAND.name}</div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              India's creator marketplace for nano & micro influencers. AI-powered. Direct deals. INR pricing.
            </p>
          </div>
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">Platform</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/browse" className="hover:text-foreground transition-colors">Browse Creators</Link></li>
              <li><Link to="/auth/signup" className="hover:text-foreground transition-colors">Join as Creator</Link></li>
              <li><Link to="/auth/signup" className="hover:text-foreground transition-colors">For Brands</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">Company</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
              <li><a href="mailto:hello@alfamatch.in" className="hover:text-foreground transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">Legal</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Terms of Use</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Creator Guidelines</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© {BRAND.year} {BRAND.name}. Made with ♥ for Bharat.</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
