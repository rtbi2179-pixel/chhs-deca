import { BookOpen, LayoutGrid, Newspaper, PieChart, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

const marketTabs = [
  { label: "Overview", href: "/market", icon: TrendingUp },
  { label: "Market Board", href: "/market/board", icon: LayoutGrid },
  { label: "Portfolio", href: "/market/portfolio", icon: PieChart },
  { label: "News", href: "/market/news", icon: Newspaper },
  { label: "Learn", href: "/market/learn", icon: BookOpen },
] as const;

export function BbxMarketNavigation() {
  const [location, setLocation] = useLocation();
  const isOverview = location === "/market" || location === "/blue-market";

  return (
    <nav
      aria-label="BBX market navigation"
      className="sticky top-3 z-40 mb-5 flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/85 p-3 shadow-[0_20px_70px_rgba(0,0,0,.22)] backdrop-blur-xl sm:mb-7 lg:flex-row lg:items-center lg:justify-between"
    >
      <button className="flex min-h-11 items-center gap-3 px-2 text-left" onClick={() => setLocation("/market")}>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-300/30 bg-blue-400/10 text-blue-200 shadow-[0_0_22px_rgba(96,165,250,.18)]">
          <TrendingUp className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-sm font-semibold tracking-wide text-foreground">BlueBlazer Exchange</span>
          <span className="block text-[11px] uppercase tracking-[0.18em] text-foreground/45">BBX · fictional market</span>
        </span>
      </button>
      <div className="bbx-market-tabs -mx-1 flex min-w-0 gap-1 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.025] p-1">
        {marketTabs.map(({ label, href, icon: Icon }) => {
          const active = href === "/market" ? isOverview : location === href;
          return (
            <button
              key={href}
              type="button"
              onClick={() => setLocation(href)}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${active ? "bg-white text-slate-950 shadow-sm" : "text-foreground/60 hover:bg-white/[0.06] hover:text-foreground"}`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
