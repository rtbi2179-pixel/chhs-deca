import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Blazer Leaderboard cluster tabs", () => {
  it("uses semantic cluster data and the shared Blazer colors for active leaderboard filters", () => {
    const leaderboard = readFileSync(join(process.cwd(), "client/src/pages/Leaderboard.tsx"), "utf8");
    const css = readFileSync(join(process.cwd(), "client/src/index.css"), "utf8");

    expect(leaderboard).toContain('leaderboard-cluster-tab');
    expect(leaderboard).toContain('data-active={selectedCluster === cluster.value}');
    expect(css).toContain('leaderboard-cluster-tab[data-cluster="marketing"][data-active="true"]');
    expect(css).toContain('background-color: var(--blazer-red)');
    for (const cluster of ['all', 'business-management-and-administration', 'finance', 'hospitality-and-tourism']) {
      expect(css).toContain(`leaderboard-cluster-tab[data-cluster="${cluster}"][data-active="true"]`);
    }
  });
});
