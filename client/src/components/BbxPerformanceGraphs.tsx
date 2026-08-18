import { Activity, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";

type Point = { tickNumber?: number; timestamp?: string | Date | null; index: number; changePercent: number };

function InteractiveGraph({ points, color, title }: { points: Point[]; color: string; title: string }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (points.length < 2) {
    return <div className="flex h-36 items-center justify-center text-xs text-slate-500">Awaiting more BBX ticks</div>;
  }

  const values = points.map((point) => point.index);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 0.1);

  const activePoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : points[points.length - 1];
  const activeTimeStr = activePoint.timestamp ? new Date(String(activePoint.timestamp)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : (activePoint.tickNumber ? `Tick ${activePoint.tickNumber}` : "Latest");
  const activeDateStr = activePoint.timestamp ? new Date(String(activePoint.timestamp)).toLocaleDateString([], { month: 'short', day: 'numeric' }) : "";

  const startTimeStr = points[0].timestamp ? new Date(String(points[0].timestamp)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Start";
  const endTimeStr = points[points.length - 1].timestamp ? new Date(String(points[points.length - 1].timestamp)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Live";

  const path = points.map((point, index) => `${index ? "L" : "M"}${(index / (points.length - 1)) * 100},${90 - ((point.index - min) / range) * 80}`).join(" ");

  return (
    <div className="mt-4">
      {/* Live / Hover Readout Header */}
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="text-slate-400 font-medium">
          {hoverIndex !== null ? "Hovered Mark" : "Latest Mark"} ({activeDateStr} {activeTimeStr})
        </span>
        <span className="font-mono font-bold text-white">
          {activePoint.index.toFixed(2)} pts ({activePoint.changePercent >= 0 ? "+" : ""}{activePoint.changePercent.toFixed(2)}%)
        </span>
      </div>

      {/* SVG Graph with Mouse Tracking */}
      <div 
        className="relative h-32 w-full cursor-crosshair overflow-hidden rounded-lg bg-slate-950/60 p-2 border border-white/10"
        onMouseLeave={() => setHoverIndex(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
          const ratio = x / rect.width;
          const idx = Math.round(ratio * (points.length - 1));
          setHoverIndex(Math.max(0, Math.min(idx, points.length - 1)));
        }}
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible" aria-label={title}>
          <path d="M0,90 L100,90" stroke="rgba(148,163,184,.15)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <path d="M0,50 L100,50" stroke="rgba(148,163,184,.08)" strokeWidth="1" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
          <path d={path} fill="none" stroke={color} strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
          {hoverIndex !== null && points[hoverIndex] && (() => {
            const cx = (hoverIndex / (points.length - 1)) * 100;
            const cy = 90 - ((points[hoverIndex].index - min) / range) * 80;
            return (
              <g>
                <line x1={cx} y1="0" x2={cx} y2="100" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
                <circle cx={cx} cy={cy} r="3.5" fill={color} stroke="#ffffff" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Explicit Time Axis Labels */}
      <div className="mt-2 flex justify-between text-[11px] text-slate-500 font-mono">
        <span>{startTimeStr}</span>
        <span>Recorded Ticks ({points.length})</span>
        <span>{endTimeStr}</span>
      </div>
    </div>
  );
}

export function BbxPerformanceGraphs({ performance }: { performance: { market: Point[]; affectedSectors: Array<{ sector: string; headline: string; series: Point[] }> } }) {
  const marketChange = performance.market.at(-1)?.changePercent ?? 0;
  return (
    <section className="mt-8 grid gap-5 xl:grid-cols-[1.35fr_1fr]">
      <div className="editorial-panel p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="data-label">Exchange trajectory</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Whole BBX market</h2>
            <p className="mt-1 text-sm text-slate-400">Equal-weighted fictional market performance across recorded BBX ticks with explicit timestamps.</p>
          </div>
          <div className={`flex items-center gap-1 font-mono text-sm font-semibold ${marketChange >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
            {marketChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {marketChange >= 0 ? "+" : ""}{marketChange.toFixed(2)}%
          </div>
        </div>
        <InteractiveGraph points={performance.market} color={marketChange >= 0 ? "#34d399" : "#fb7185"} title="Whole BBX market trajectory" />
      </div>

      <div className="editorial-panel p-6">
        <div className="flex items-start gap-3">
          <Activity className="mt-0.5 h-5 w-5 text-blue-300" />
          <div>
            <p className="data-label">News influence</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Affected sectors</h2>
            <p className="mt-1 text-sm text-slate-400">Recent fictional Blue’s News events and sector trajectories with interactive hover readouts.</p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {performance.affectedSectors.length ? (
            performance.affectedSectors.map((sector) => (
              <details key={sector.sector} className="rounded-md border border-white/10 bg-slate-950/30 p-3" open>
                <summary className="cursor-pointer list-none">
                  <p className="text-sm font-semibold text-white">{sector.sector}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-400">{sector.headline}</p>
                </summary>
                <InteractiveGraph points={sector.series} color="#60a5fa" title={`${sector.sector} sector performance graph`} />
              </details>
            ))
          ) : (
            <p className="rounded-md border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-400">News-affected sector graphs appear after fictional sector events are published.</p>
          )}
        </div>
      </div>
    </section>
  );
}
