import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  ChartNoAxesCombined,
  ChevronDown,
  ChevronRight,
  Landmark,
  LayoutGrid,
  LineChart,
  ListFilter,
  Loader2,
  Newspaper,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BbxPerformanceGraphs } from "@/components/BbxPerformanceGraphs";

const bb = (value: number) =>
  `${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} BB`;
const pct = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
const MARKET_REFRESH_MS = 20_000;

function Change({ value }: { value: number }) {
  const positive = value >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium ${
        positive ? "text-emerald-400" : "text-rose-400"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {pct(value)}
    </span>
  );
}

const marketTabs = [
  { label: "Overview", href: "/market" },
  { label: "Portfolio", href: "/market/portfolio" },
  { label: "News", href: "/market/news" },
  { label: "Learn", href: "/market/learn" },
];

const MARKET_SECTIONS = [
  { id: "market-overview", label: "Overview", description: "Benchmark and performance", icon: LayoutGrid },
  { id: "market-listings", label: "Listings", description: "Browse and trade companies", icon: ListFilter },
  { id: "market-movers", label: "Movers", description: "Gainers and losers", icon: LineChart },
  { id: "market-sectors", label: "Sectors", description: "Compare sector performance", icon: ChartNoAxesCombined },
  { id: "market-news", label: "News", description: "Read simulated events", icon: Newspaper },
  { id: "market-guidance", label: "Guidance", description: "Review before trading", icon: ShieldCheck },
] as const;

export default function BlueMarket() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { user } = useAuth();
  const canAdmin = user?.role === "super_admin";
  const overview = trpc.bbx.getOverview.useQuery(undefined, {
    refetchInterval: MARKET_REFRESH_MS,
  });
  const { data, isLoading, error } = overview;
  const order = trpc.bbx.placeMarketOrder.useMutation();
  const advance = trpc.bbx.advanceNow.useMutation({
    onSuccess: () => void utils.bbx.getOverview.invalidate(),
  });
  const adminOptions = trpc.bbx.getAdminOptions.useQuery(undefined, {
    enabled: canAdmin,
  });
  const setRegime = trpc.bbx.setRegime.useMutation({
    onSuccess: () => void utils.bbx.getOverview.invalidate(),
  });
  const setMarketOpen = trpc.bbx.setMarketOpen.useMutation({
    onSuccess: () => void utils.bbx.getOverview.invalidate(),
  });
  const injectEvent = trpc.bbx.injectEvent.useMutation({
    onSuccess: () => {
      void utils.bbx.getOverview.invalidate();
      void utils.bbx.getNews.invalidate();
    },
  });
  const [trade, setTrade] = useState<{
    ticker: string;
    side: "buy" | "sell";
    price: number;
  } | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [eventTemplate, setEventTemplate] = useState("");
  const [eventTicker, setEventTicker] = useState("");
  const [activeSection, setActiveSection] = useState<(typeof MARKET_SECTIONS)[number]["id"]>("market-overview");
  const [mobileSectionMenuOpen, setMobileSectionMenuOpen] = useState(false);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const benchmarkChange = data?.state.benchmarkChangePercent ?? 0;
  const news = data?.news ?? [];
  const companies = data?.companies ?? [];
  const selectedCompany = useMemo(
    () => companies.find((company) => company.ticker === trade?.ticker),
    [companies, trade?.ticker],
  );
  const refreshRemaining = Math.max(
    0,
    Math.ceil((MARKET_REFRESH_MS - (clockNow - overview.dataUpdatedAt)) / 1000),
  );

  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const observedSections = MARKET_SECTIONS.map(({ id }) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (observedSections.length === 0) return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]?.target instanceof HTMLElement) setActiveSection(visible[0].target.id as (typeof MARKET_SECTIONS)[number]["id"]);
    }, { rootMargin: "-16% 0px -64% 0px", threshold: [0, 0.2, 0.6] });
    observedSections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const scrollToMarketSection = (id: (typeof MARKET_SECTIONS)[number]["id"]) => {
    setActiveSection(id);
    setMobileSectionMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const submitOrder = async () => {
    if (!trade) return;

    try {
      const result = await order.mutateAsync({
        ticker: trade.ticker,
        side: trade.side,
        quantity,
        idempotencyKey:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,
      });
      toast.success(
        `${trade.side === "buy" ? "Purchase" : "Sale"} filled at ${bb(
          result.fillPrice,
        )} per share.`,
      );
      setTrade(null);
      setQuantity("1");
      await Promise.all([
        utils.bbx.getOverview.invalidate(),
        utils.bbx.getPortfolio.invalidate(),
        utils.bbx.getTransactions.invalidate(),
      ]);
    } catch (reason) {
      toast.error(
        reason instanceof Error
          ? reason.message
          : "Unable to place this simulated order.",
      );
    }
  };

  if (isLoading) {
    return (
      <main className="page-shell">
        <div className="page-content">
          <div className="loading-state min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="page-shell">
        <div className="page-content">
          <div className="empty-state min-h-64 px-6">
            Unable to load the BBX simulation. {error?.message ?? "Please try again."}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="page-content max-w-7xl">
        <nav
          aria-label="BBX market navigation"
          className="market-dashboard-topbar sticky top-3 z-40 mb-4 flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-950/80 p-3 shadow-[0_20px_70px_rgba(0,0,0,.22)] backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between"
        >
          <button
            className="flex items-center gap-3 px-2 text-left"
            onClick={() => setLocation("/market")}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-300/30 bg-blue-400/10 text-blue-200 shadow-[0_0_22px_rgba(96,165,250,.18)]">
              <TrendingUp className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-wide text-foreground">
                BlueBlazer Exchange
              </span>
              <span className="block text-[11px] uppercase tracking-[0.18em] text-foreground/45">
                BBX · fictional market
              </span>
            </span>
          </button>
          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-white/[0.025] p-1">
            {marketTabs.map((tab) => (
              <button
                key={tab.href}
                className={`rounded-lg px-4 py-2 text-sm transition ${
                  tab.href === "/market"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-foreground/60 hover:bg-white/[0.06] hover:text-foreground"
                }`}
                onClick={() => setLocation(tab.href)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 px-2 lg:justify-end">
            <span className="rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 font-mono text-xs text-blue-100">
              Refresh in {refreshRemaining}s
            </span>
            {canAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void advance.mutateAsync()}
                disabled={advance.isPending}
              >
                {advance.isPending ? "Advancing…" : "Advance BBX"}
              </Button>
            )}
          </div>
        </nav>

        <nav aria-label="Jump to market section" className="relative z-30 mb-7 rounded-2xl border border-white/10 bg-slate-950/65 p-2 shadow-[0_14px_45px_rgba(0,0,0,.18)] backdrop-blur-xl">
          <div className="relative sm:hidden">
            <button type="button" onClick={() => setMobileSectionMenuOpen((open) => !open)} aria-expanded={mobileSectionMenuOpen} className="flex w-full items-center justify-between rounded-xl bg-white/[0.045] px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-white/[0.08]"><span><span className="block text-[10px] uppercase tracking-[0.16em] text-foreground/40">Jump to market area</span><span className="mt-0.5 block font-medium">{MARKET_SECTIONS.find((section) => section.id === activeSection)?.label}</span></span><ChevronDown className={`h-4 w-4 text-blue-300 transition-transform ${mobileSectionMenuOpen ? "rotate-180" : ""}`} /></button>
            {mobileSectionMenuOpen && <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] overflow-hidden rounded-xl border border-white/10 bg-slate-900 p-1.5 shadow-2xl">{MARKET_SECTIONS.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => scrollToMarketSection(id)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${activeSection === id ? "bg-blue-500/15 text-blue-100" : "text-foreground/70 hover:bg-white/[0.06] hover:text-foreground"}`}><Icon className="h-4 w-4 text-blue-300" />{label}</button>)}</div>}
          </div>
          <div className="hidden items-center gap-1 overflow-x-auto sm:flex">{MARKET_SECTIONS.map(({ id, label, description, icon: Icon }) => <button key={id} type="button" onClick={() => scrollToMarketSection(id)} className={`group flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs transition-colors ${activeSection === id ? "bg-blue-500/15 text-blue-100 ring-1 ring-inset ring-blue-400/25" : "text-foreground/55 hover:bg-white/[0.06] hover:text-foreground"}`}><Icon className="h-3.5 w-3.5 text-blue-300/80" /><span className="text-left"><span className="block">{label}</span><span className="hidden text-[10px] text-foreground/35 lg:block">{description}</span></span>{activeSection === id && <ChevronRight className="h-3.5 w-3.5 text-blue-300" />}</button>)}</div>
        </nav>

        <header id="market-overview" className="market-dashboard-hero mb-7 flex scroll-mt-28 flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="page-eyebrow">Financial learning lab · fictional market</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="page-title">BlueBlazer Exchange</h1>
              <span className="rounded-full border border-blue-400/30 bg-blue-400/10 px-2.5 py-1 text-xs font-semibold tracking-wide text-blue-200">
                SIMULATED
              </span>
            </div>
            <p className="page-intro mt-3 max-w-2xl">
              Practice reading company news, risk, diversification, and execution costs with fictional BBX companies. BBX BlueBucks are isolated from your chapter balance and have no cash value.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button variant="outline" onClick={() => setLocation("/market/portfolio")}>
              Portfolio
            </Button>
            <Button variant="outline" onClick={() => setLocation("/market/news")}>
              News feed
            </Button>
            <Button variant="outline" onClick={() => setLocation("/market/learn")}>
              <BookOpen className="mr-2 h-4 w-4" />
              Learn
            </Button>
          </div>
        </header>

        <section
          aria-label="BBX market summary"
          className="market-dashboard-stats grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <Card className="editorial-panel p-5">
            <p className="data-label">BBX BlueBucks available</p>
            <p className="mt-3 text-2xl font-semibold text-blue-300">{bb(data.cash)}</p>
            <p className="mt-1 text-xs text-foreground/55">Ring-fenced simulation balance</p>
          </Card>
          <Card className="editorial-panel p-5">
            <p className="data-label">Exchange benchmark</p>
            <p className="mt-3 text-2xl font-semibold text-foreground">
              {data.state.benchmarkLevel.toFixed(2)}
            </p>
            <div className="mt-1">
              <Change value={benchmarkChange} />
            </div>
          </Card>
          <Card className="editorial-panel p-5">
            <p className="data-label">Market regime</p>
            <p className="mt-3 text-2xl font-semibold capitalize text-foreground">
              {data.state.marketRegime.replace("_", " ")}
            </p>
            <p className="mt-1 text-xs text-foreground/55">
              Structured events drive the largest moves
            </p>
          </Card>
          <Card className="editorial-panel p-5">
            <p className="data-label">Simulation state</p>
            <p
              className={`mt-3 text-2xl font-semibold ${
                data.state.marketOpen ? "text-emerald-300" : "text-amber-300"
              }`}
            >
              {data.state.marketOpen ? "Open" : "Paused"}
            </p>
            <p className="mt-1 text-xs text-foreground/55">
              Tick {data.state.tickNumber} · server-authoritative
            </p>
            <p className="mt-2 font-mono text-xs text-blue-200">
              Auto-refresh in {refreshRemaining}s
            </p>
          </Card>
        </section>

        <BbxPerformanceGraphs performance={data.performance} />

        <section className="market-dashboard-content mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.85fr)]">
          <Card id="market-listings" className="editorial-panel scroll-mt-28 overflow-hidden p-0">
            <div className="border-b border-white/10 px-6 py-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="data-label">Market board</p>
                  <h2 className="section-heading mt-1">Fictional company listings</h2>
                  <p className="mt-1 text-sm text-foreground/60">
                    Displayed prices are BBX simulation marks. Final fills include a small, disclosed simulated spread and slippage.
                  </p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-xs text-foreground/55">
                  {companies.length} listings
                </span>
              </div>
            </div>
            <div className="divide-y divide-white/8">
              {companies.map((company) => (
                <div
                  key={company.ticker}
                  className="grid gap-3 px-6 py-4 transition hover:bg-white/[0.025] sm:grid-cols-[1.2fr_0.65fr_0.75fr_auto] sm:items-center"
                >
                  <button
                    className="min-w-0 text-left"
                    onClick={() => setLocation(`/market/${company.ticker}`)}
                  >
                    <p className="font-semibold text-foreground">{company.ticker}</p>
                    <p className="truncate text-sm text-foreground/60">
                      {company.companyName} · {company.sector}
                    </p>
                  </button>
                  <div>
                    <p className="font-semibold text-foreground">{bb(company.price)}</p>
                    <Change value={company.changePercent} />
                  </div>
                  <span className="w-fit rounded-full border border-white/10 bg-white/[0.035] px-2 py-1 text-xs text-foreground/65">
                    {company.status}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setTrade({ ticker: company.ticker, side: "buy", price: company.price });
                        setQuantity("1");
                      }}
                    >
                      Buy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setTrade({ ticker: company.ticker, side: "sell", price: company.price });
                        setQuantity("1");
                      }}
                    >
                      Sell
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="space-y-6">
            <Card id="market-movers" className="editorial-panel scroll-mt-28 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="data-label">Exchange activity</p>
                  <h2 className="section-heading mt-1">Market movers</h2>
                </div>
                <TrendingUp className="h-5 w-5 text-blue-300" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-5">
                <div>
                  <p className="data-label">Gainers</p>
                  <div className="mt-2 space-y-2">
                    {data.movers.gainers.slice(0, 3).map((company) => (
                      <button
                        key={company.ticker}
                        className="flex w-full justify-between text-left text-sm"
                        onClick={() => setLocation(`/market/${company.ticker}`)}
                      >
                        <span className="text-foreground">{company.symbol}</span>
                        <Change value={company.changePercent} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="data-label">Losers</p>
                  <div className="mt-2 space-y-2">
                    {data.movers.losers.slice(0, 3).map((company) => (
                      <button
                        key={company.ticker}
                        className="flex w-full justify-between text-left text-sm"
                        onClick={() => setLocation(`/market/${company.ticker}`)}
                      >
                        <span className="text-foreground">{company.symbol}</span>
                        <Change value={company.changePercent} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card id="market-sectors" className="editorial-panel scroll-mt-28 p-6">
              <p className="data-label">Sector view</p>
              <h2 className="section-heading mt-1">Sector performance</h2>
              <div className="mt-4 space-y-3">
                {data.sectors.map((sector) => (
                  <div key={sector.sector} className="flex items-center justify-between">
                    <span className="text-sm text-foreground/75">{sector.sector}</span>
                    <Change value={sector.changePercent} />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {canAdmin && (
          <Card className="editorial-panel mt-8 p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="page-eyebrow">Super-admin only</p>
                <h2 className="section-heading mt-2">BBX simulation controls</h2>
                <p className="mt-1 text-sm text-foreground/60">
                  Controls operate only on fictional BBX data. Event magnitudes remain server-defined by reviewed templates.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => void setMarketOpen.mutateAsync({ open: !data.state.marketOpen })}
                disabled={setMarketOpen.isPending}
              >
                {data.state.marketOpen ? "Pause exchange" : "Resume exchange"}
              </Button>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <label className="text-sm text-foreground/70">
                Market regime
                <select
                  className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-foreground"
                  value={data.state.marketRegime}
                  onChange={(event) =>
                    void setRegime.mutateAsync({
                      regime: event.target.value as "bull" | "neutral" | "bear" | "high_volatility",
                    })
                  }
                  disabled={setRegime.isPending}
                >
                  <option value="bull">Bull</option>
                  <option value="neutral">Neutral</option>
                  <option value="bear">Bear</option>
                  <option value="high_volatility">High volatility</option>
                </select>
              </label>
              <label className="text-sm text-foreground/70">
                Event template
                <select
                  className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-foreground"
                  value={eventTemplate}
                  onChange={(event) => setEventTemplate(event.target.value)}
                >
                  <option value="">Choose reviewed event</option>
                  {adminOptions.data?.templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.id} · {template.severity} · {template.headline}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-foreground/70">
                Company target (optional)
                <select
                  className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-foreground"
                  value={eventTicker}
                  onChange={(event) => setEventTicker(event.target.value)}
                >
                  <option value="">Use event scope</option>
                  {adminOptions.data?.companies.map((company) => (
                    <option key={company.ticker} value={company.ticker}>
                      {company.ticker} · {company.companyName}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-4">
              <Button
                disabled={!eventTemplate || injectEvent.isPending}
                onClick={() =>
                  void injectEvent
                    .mutateAsync({ templateId: eventTemplate, ticker: eventTicker || undefined })
                    .then((result) => {
                      toast.success(`Queued ${result.templateId} for the next BBX tick.`);
                      setEventTemplate("");
                    })
                }
              >
                {injectEvent.isPending ? "Queueing…" : "Inject fictional event"}
              </Button>
            </div>
          </Card>
        )}

        <section id="market-news" className="mt-8 scroll-mt-28 grid gap-6 lg:grid-cols-[1.45fr_0.85fr]">
          <Card className="editorial-panel p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="data-label">Blue’s News</p>
                <h2 className="section-heading mt-1">Latest simulated news</h2>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setLocation("/market/news")}>
                View all
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {news.length === 0 ? (
                <p className="empty-state px-4 py-7 text-sm">
                  The first structured BBX event will appear here as the simulation advances.
                </p>
              ) : (
                news.slice(0, 4).map((article) => (
                  <article key={article.id} className="editorial-panel-muted p-4">
                    <div className="flex items-start gap-3">
                      <Newspaper className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
                      <div>
                        <p className="text-xs font-semibold tracking-wide text-blue-200">
                          SIMULATED · {article.scopeLabel}
                        </p>
                        <p className="mt-1 font-medium text-foreground">{article.headline}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-foreground/60">
                          {article.whyItMatters}
                        </p>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </Card>
          <Card id="market-guidance" className="editorial-panel scroll-mt-28 p-6">
            <Landmark className="h-5 w-5 text-blue-300" />
            <h2 className="section-heading mt-4">Before you trade</h2>
            <ul className="mt-3 space-y-3 text-sm leading-6 text-foreground/65">
              <li className="flex gap-2">
                <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-emerald-400" />
                Prices, companies, and news are fictional educational content.
              </li>
              <li>
                System-generated events—not headlines or other users—are the primary source of BBX price movement.
              </li>
              <li>
                Spreads and slippage illustrate execution costs. They are shown before your final simulated fill.
              </li>
            </ul>
          </Card>
        </section>
      </div>

      {trade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <Card className="w-full max-w-md border border-white/15 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="data-label">SIMULATED MARKET ORDER</p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">
                  {trade.side === "buy" ? "Buy" : "Sell"} {trade.ticker}
                </h2>
              </div>
              <button
                aria-label="Close order dialog"
                className="rounded p-1 text-foreground/60 hover:bg-white/10 hover:text-foreground"
                onClick={() => setTrade(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-3 text-sm text-foreground/65">
              Midpoint: {bb(selectedCompany?.price ?? trade.price)}. Your final fill is determined on the server and may include simulated spread and slippage.
            </p>
            <label className="mt-5 block text-sm text-foreground/70">
              Fractional shares
              <input
                aria-label="Quantity"
                type="number"
                min="0.000001"
                step="0.000001"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-foreground outline-none focus:border-blue-400"
              />
            </label>
            <p className="mt-3 text-sm text-foreground/60">
              Estimated midpoint total: {bb((Number(quantity) || 0) * (selectedCompany?.price ?? trade.price))}
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                className="flex-1"
                disabled={order.isPending || !(Number(quantity) > 0)}
                onClick={() => void submitOrder()}
              >
                {order.isPending ? "Filling…" : `Confirm ${trade.side === "buy" ? "buy" : "sale"}`}
              </Button>
              <Button className="flex-1" variant="outline" onClick={() => setTrade(null)}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}
