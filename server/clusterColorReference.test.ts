import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

describe("reference-aligned DECA cluster palette", () => {
  it("uses gold, gray, green, blue, red, and lime in Event Resources", () => {
    const events = source("client/src/pages/Events.tsx");
    expect(events).toContain("'Business Management': 'bg-amber-500/15 text-amber-300 border-amber-500/30'");
    expect(events).toContain("Entrepreneurship': 'bg-slate-400/15 text-slate-300 border-slate-400/30'");
    expect(events).toContain("'Finance': 'bg-green-500/15 text-green-300 border-green-500/30'");
    expect(events).toContain("'Hospitality & Tourism': 'bg-blue-500/15 text-blue-300 border-blue-500/30'");
    expect(events).toContain("'Marketing': 'bg-red-500/15 text-red-300 border-red-500/30'");
    expect(events).toContain("'Personal Finance': 'bg-lime-500/15 text-lime-300 border-lime-500/30'");
  });

  it("keeps the same assignments in event selection and Blazer active cluster controls", () => {
    const profile = source("client/src/pages/Profile.tsx");
    const styles = source("client/src/index.css");
    expect(profile).toContain("Marketing: { panel: 'border-red-300/25");
    expect(profile).toContain("'Hospitality & Tourism': { panel: 'border-blue-300/25");
    expect(profile).toContain("'Business Management': { panel: 'border-amber-300/25");
    expect(profile).toContain("Entrepreneurship: { panel: 'border-slate-300/25");
    expect(profile).toContain("'Personal Finance': { panel: 'border-lime-300/25");
    expect(styles).toContain('event-cluster-filter[data-cluster="business-management"][data-active="true"] { background-color: var(--blazer-yellow)');
    expect(styles).toContain('event-cluster-filter[data-cluster="entrepreneurship"][data-active="true"] { background-color: var(--blazer-gray)');
    expect(styles).toContain('event-cluster-filter[data-cluster="personal-finance"][data-active="true"] { background-color: var(--blazer-lime)');
  });
});
