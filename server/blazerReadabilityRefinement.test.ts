import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Blazer readability refinement", () => {
  const events = readFileSync(join(process.cwd(), "client/src/pages/Events.tsx"), "utf8");
  const styles = readFileSync(join(process.cwd(), "client/src/index.css"), "utf8");

  it("marks the Events heading, filters, and cards for a light heading zone and outlined cluster treatment", () => {
    expect(events).toContain("events-heading-zone");
    expect(events).toContain("events-filter-zone");
    expect(events).toContain("event-outline-card");
    expect(events).toContain("data-event-cluster={event.cluster.toLowerCase()");
  });

  it("uses a blue, white-text Events heading zone in normal Blazer while preserving distinct Light Blazer surfaces", () => {
    expect(styles).toContain(':root[data-website-theme="blazer"] .events-heading-zone');
    expect(styles).toContain('background: linear-gradient(135deg, #0b74bf 0%, #075f9d 56%, #064b7f 100%) !important;');
    expect(styles).toContain('events-heading-zone :is(h1, h2, h3, p, .page-title, .page-intro) { color: #fff !important;');
    expect(styles).toContain(':root[data-website-theme="blazer"] .event-outline-card');
    expect(styles).toContain('background: #0b121b !important;');
    expect(styles).toContain(':root[data-website-theme="light-blazer"] .event-outline-card');
    expect(styles).toContain('background: #f4f8fc !important;');
    expect(styles).toContain(':root[data-website-theme="blazer"] .banking-hero');
    expect(styles).toContain(':root[data-website-theme="blazer"] .leaderboard-hero');
  });
});
