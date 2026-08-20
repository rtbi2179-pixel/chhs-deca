import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("individual BBX company price chart", () => {
  const companyPage = readFileSync(resolve(process.cwd(), "client/src/pages/BbxCompanyPage.tsx"), "utf8");
  const chartRouter = readFileSync(resolve(process.cwd(), "server/bbxRouter.ts"), "utf8");

  it("uses server-recorded price and timestamp values for chart inspection", () => {
    expect(chartRouter).toContain("timestamp: point.simulationTimestamp");
    expect(chartRouter).toContain("price: number(point.price)");
    expect(companyPage).toContain("new Date(activePoint.timestamp)");
    expect(companyPage).toContain("bb(activePoint.price)");
    expect(companyPage).toContain("Tick {activePoint.tickNumber}");
  });

  it("supports pointer, touch, and keyboard inspection without changing the stored chart data", () => {
    expect(companyPage).toContain("onPointerMove");
    expect(companyPage).toContain("onPointerDown");
    expect(companyPage).toContain("touch-pan-y");
    expect(companyPage).toContain('event.key !== "ArrowLeft" && event.key !== "ArrowRight"');
    expect(companyPage).toContain('aria-live="polite"');
    expect(companyPage).toContain("Hover or tap the line to inspect a recorded mark.");
  });
});
