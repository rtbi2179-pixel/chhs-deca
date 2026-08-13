export type PortfolioSnapshotPoint = { snapshotDate: string | Date; value: number; gain: number; percentageReturn: number };

export function filterPortfolioSnapshots(points: PortfolioSnapshotPoint[], timeframe: "1w" | "1m" | "3m" | "1y", now = new Date()) {
  const daysByTimeframe = { "1w": 7, "1m": 31, "3m": 92, "1y": 366 };
  const cutoff = now.getTime() - daysByTimeframe[timeframe] * 24 * 60 * 60 * 1000;
  return points.filter(point => new Date(point.snapshotDate).getTime() >= cutoff).sort((a, b) => new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime());
}

export function buildPortfolioPolyline(points: PortfolioSnapshotPoint[], width = 600, height = 220) {
  if (points.length < 2) return "";
  const values = points.map(point => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return points.map((point, index) => `${(index / (points.length - 1)) * width},${height - ((point.value - min) / range) * (height - 16) - 8}`).join(" ");
}
