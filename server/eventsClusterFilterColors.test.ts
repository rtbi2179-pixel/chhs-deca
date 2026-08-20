import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Blazer Event Resources cluster filters", () => {
  it("marks each filter with its cluster and uses the supplied Blazer palette for active chips", () => {
    const events = readFileSync(join(process.cwd(), "client/src/pages/Events.tsx"), "utf8");
    const css = readFileSync(join(process.cwd(), "client/src/index.css"), "utf8");

    expect(events).toContain('data-cluster={c.toLowerCase().replaceAll');
    expect(events).toContain('data-active={activeCluster === c}');
    expect(events).toContain('event-cluster-filter');
    expect(css).toContain('event-cluster-filter[data-cluster="marketing"][data-active="true"]');
    expect(css).toContain('background-color: var(--blazer-red)');
    for (const cluster of ['finance', 'hospitality-and-tourism', 'business-management', 'entrepreneurship', 'personal-finance']) {
      expect(css).toContain(`event-cluster-filter[data-cluster="${cluster}"][data-active="true"]`);
    }
  });
});
