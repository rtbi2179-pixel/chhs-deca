import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readProjectFile = (relativePath: string) => readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
const overview = readProjectFile("client/src/pages/BlueMarket.tsx");
const board = readProjectFile("client/src/pages/BbxMarketBoard.tsx");
const navigation = readProjectFile("client/src/components/BbxMarketNavigation.tsx");
const controls = readProjectFile("client/src/components/BbxSimulationControls.tsx");
const chapterManagement = readProjectFile("client/src/pages/AdminPanel.tsx");
const routes = readProjectFile("client/src/App.tsx");
const marketViews = readProjectFile("client/src/pages/BbxMarketViews.tsx");

describe("BBX market dashboard organization", () => {
  it("keeps the Overview focused on market summary and performance without duplicating Board or News content", () => {
    expect(overview).toContain("<BbxMarketNavigation />");
    expect(overview).toContain('aria-label="BBX market summary"');
    expect(overview).toContain("market-dashboard-stats");
    expect(overview).toContain("<BbxPerformanceGraphs performance={data.performance} />");
    expect(overview).toContain("Before you trade");
    expect(overview).not.toContain("Latest simulated news");
    expect(overview).not.toContain("Fictional company listings");
    expect(overview).not.toContain("BBX simulation controls");
  });

  it("uses one persistent navigator across Overview, Market Board, Portfolio, News, and Learn", () => {
    for (const label of ["Overview", "Market Board", "Portfolio", "News", "Learn"]) {
      expect(navigation).toContain(`label: "${label}"`);
    }
    expect(navigation).toContain('href: "/market/board"');
    expect(navigation).toContain("sticky top-3");
    expect(marketViews.match(/<BbxMarketNavigation \/>/g)?.length).toBeGreaterThanOrEqual(3);
    expect(routes).toContain('path="/market/board"');
  });

  it("moves listing and trade functionality to the dedicated Market Board without changing its BBX contracts", () => {
    for (const contract of [
      "trpc.bbx.getOverview.useQuery",
      "trpc.bbx.placeMarketOrder.useMutation",
      "utils.bbx.getPortfolio.invalidate()",
      "utils.bbx.getTransactions.invalidate()",
      "Fictional company listings",
      "Market movers",
      "Sector performance",
      "SIMULATED MARKET ORDER",
    ]) {
      expect(board, `missing Market Board contract: ${contract}`).toContain(contract);
    }
  });

  it("places super-admin BBX controls in Chapter Management with server-protected operations", () => {
    expect(chapterManagement).toContain("<BbxSimulationControls />");
    expect(controls).toContain('user?.role === "super_admin"');
    expect(controls).toContain("trpc.bbx.advanceNow.useMutation");
    expect(controls).toContain("trpc.bbx.setRegime.useMutation");
    expect(controls).toContain("trpc.bbx.setMarketOpen.useMutation");
    expect(controls).toContain("trpc.bbx.injectEvent.useMutation");
  });
});
