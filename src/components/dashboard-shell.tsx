import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  Sun, Moon, LogOut, ArrowLeftRight,
  TrendingUp, TrendingDown, Menu, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { useTheme } from "@/contexts/theme";

export type NavItem = {
  to: string;
  tab?: string;
  label: string;
  icon: LucideIcon;
  section?: string;
  badge?: string;
};

// ── Shared sidebar content ────────────────────────────────────────────────────

function SidebarContent({
  role, name, avatar, sections, onSignOut, onSwitchRole, onNavClick,
}: {
  role: "Creator" | "Brand";
  name: string;
  avatar: string;
  sections: { label?: string; items: NavItem[] }[];
  onSignOut?: () => void;
  onSwitchRole?: () => void;
  onNavClick?: () => void;
}) {
  const pathname  = useRouterState({ select: (s) => s.location.pathname });
  const searchStr = useRouterState({ select: (s) => s.location.searchStr ?? "" });
  const currentTab = new URLSearchParams(searchStr).get("tab") ?? "";
  const { theme, toggleTheme } = useTheme();
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <>
      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {sections.map((section, si) => (
          <div key={si} className={si > 0 ? "mt-4" : ""}>
            {section.label && (
              <p className="px-3 mb-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
                {section.label}
              </p>
            )}
            {section.items.map((item) => {
              const active = item.tab
                ? pathname === item.to && currentTab === item.tab
                : pathname === item.to && !currentTab;

              return (
                <Link
                  key={`${item.to}-${item.tab ?? "root"}`}
                  to={item.to}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  search={item.tab ? ({ tab: item.tab } as any) : undefined}
                  onClick={onNavClick}
                  className={`flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-md text-sm transition-colors mb-0.5 ${
                    active
                      ? "bg-muted text-foreground font-medium"
                      : "text-foreground/55 hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <item.icon
                      className={`w-4 h-4 shrink-0 ${active ? "text-primary" : "text-foreground/40"}`}
                      strokeWidth={1.75}
                    />
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-primary text-primary-foreground rounded">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User row */}
      <div className="border-t border-border p-3 space-y-0.5">
        <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
          {avatar ? (
            <img src={avatar} alt={name} className="size-7 rounded-full object-cover shrink-0" loading="lazy" />
          ) : (
            <div className="size-7 rounded-full bg-muted text-foreground/60 grid place-items-center font-medium text-xs shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate leading-tight">{name}</p>
            <p className="text-[10px] text-muted-foreground">{role}</p>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground/55 hover:text-foreground hover:bg-muted/60 rounded-md transition-colors"
        >
          {theme === "dark"
            ? <Sun  className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            : <Moon className="w-4 h-4 shrink-0" strokeWidth={1.75} />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>

        {onSwitchRole && (
          <button
            onClick={onSwitchRole}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground/55 hover:text-foreground hover:bg-muted/60 rounded-md transition-colors"
          >
            <ArrowLeftRight className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            Switch to {role === "Creator" ? "Brand" : "Creator"}
          </button>
        )}

        {onSignOut && (
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground/55 hover:text-foreground hover:bg-muted/60 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            Sign out
          </button>
        )}
      </div>
    </>
  );
}

// ── DashboardShell ────────────────────────────────────────────────────────────

export function DashboardShell({
  role, name, avatar, nav, onSignOut, onSwitchRole, children,
}: {
  role: "Creator" | "Brand";
  name: string;
  avatar: string;
  nav: NavItem[];
  onSignOut?: () => void;
  onSwitchRole?: () => void;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Group nav items by section
  const sections: { label?: string; items: NavItem[] }[] = [];
  for (const item of nav) {
    const last = sections.at(-1);
    if (!last || last.label !== item.section) {
      sections.push({ label: item.section, items: [item] });
    } else {
      last.items.push(item);
    }
  }

  const sharedProps = { role, name, avatar, sections, onSignOut, onSwitchRole };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row">

      {/* ── Mobile header ─────────────────────────────────────────────────── */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Link to="/" className="font-bold text-base tracking-tight">{BRAND.name}</Link>
          <span className="text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 rounded font-mono uppercase tracking-wide">{role}</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="size-10 grid place-items-center rounded-md hover:bg-muted transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" strokeWidth={1.75} />
        </button>
      </header>

      {/* ── Mobile drawer ─────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          {/* drawer */}
          <aside className="absolute inset-y-0 left-0 w-72 bg-card border-r border-border flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <Link to="/" className="font-bold text-base" onClick={() => setMobileOpen(false)}>{BRAND.name}</Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="size-8 grid place-items-center rounded-md hover:bg-muted transition-colors"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
            <SidebarContent {...sharedProps} onNavClick={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* ── Desktop sidebar ───────────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border bg-card sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-border flex items-center gap-2.5">
          <Link to="/" className="font-bold text-base tracking-tight text-foreground">{BRAND.name}</Link>
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground border border-border px-1.5 py-0.5 rounded">
            {role}
          </span>
        </div>
        <SidebarContent {...sharedProps} />
      </aside>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// ── DashboardHeader ───────────────────────────────────────────────────────────

export function DashboardHeader({
  title, subtitle, actions,
}: {
  title: string; subtitle?: string; actions?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 bg-background border-b border-border px-4 lg:px-8 py-4 flex items-center justify-between gap-4">
      <div>
        <h1 className="text-base lg:text-lg font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────

export function StatCard({
  label, value, delta, trend,
}: {
  label: string; value: string; delta?: string; trend?: "up" | "down";
}) {
  return (
    <div className="p-4 lg:p-5 bg-card border border-border rounded-md">
      <p className="text-xs font-medium text-muted-foreground mb-3">{label}</p>
      <p className="text-xl lg:text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      {delta && (
        <div className={`flex items-center gap-1 text-xs mt-2 ${trend === "down" ? "text-red-500" : "text-emerald-500"}`}>
          {trend === "down"
            ? <TrendingDown className="w-3 h-3" strokeWidth={2} />
            : <TrendingUp   className="w-3 h-3" strokeWidth={2} />}
          <span className="font-medium">{delta}</span>
        </div>
      )}
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="bg-card border border-border rounded-md">
      <header className="px-4 lg:px-5 py-3.5 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </header>
      <div className="p-4 lg:p-5">{children}</div>
    </section>
  );
}
