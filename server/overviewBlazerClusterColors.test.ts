import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Blazer Overview cluster color treatment", () => {
  const overview = readFileSync(join(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
  const styles = readFileSync(join(process.cwd(), "client/src/index.css"), "utf8");

  it("binds Overview metrics, sections, account rows, and actions to cluster identities", () => {
    expect(overview).toContain('data-overview-cluster={cluster}');
    expect(overview).toContain('data-overview-cluster="hospitality-and-tourism"');
    expect(overview).toContain('data-overview-cluster="finance"');
    expect(overview).toContain('data-overview-cluster="marketing"');
    expect(overview).toContain('data-overview-cluster="entrepreneurship"');
    expect(overview).toContain('data-overview-cluster="personal-finance"');
    expect(overview).toContain('overview-cluster-action');
  });

  it("uses every reference color in Blazer Overview rules with accessible foregrounds", () => {
    for (const cluster of ["business-management", "entrepreneurship", "finance", "hospitality-and-tourism", "marketing", "personal-finance"]) {
      expect(styles).toContain(`overview-cluster-section[data-overview-cluster="${cluster}"]`);
    }
    expect(styles).toContain("var(--blazer-yellow)");
    expect(styles).toContain("var(--blazer-gray)");
    expect(styles).toContain("var(--blazer-green)");
    expect(styles).toContain("var(--blazer-blue)");
    expect(styles).toContain("var(--blazer-red)");
    expect(styles).toContain("var(--blazer-lime)");
  });
});
