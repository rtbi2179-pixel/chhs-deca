import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PRACTICE_CLUSTERS } from "../client/src/lib/practiceClusters";

describe("Practice cluster-card launcher", () => {
  it("provides exactly the four required question-bank cluster targets", () => {
    expect(PRACTICE_CLUSTERS.map((cluster) => cluster.value)).toEqual([
      "Marketing",
      "Business Management & Administration",
      "Finance",
      "Hospitality & Tourism",
    ]);
  });

  it("gives every card the visual tokens needed for an independently recognizable launch surface", () => {
    PRACTICE_CLUSTERS.forEach((cluster) => {
      expect(cluster.label).toBeTruthy();
      expect(cluster.description).toBeTruthy();
      expect(cluster.questions).toMatch(/^\d/,);
      expect(cluster.ring).toContain("border-");
      expect(cluster.bar).toContain("bg-");
    });
  });

  it("uses the primary card frame without the former nested inset-outline decoration", () => {
    const practicePage = readFileSync(join(process.cwd(), "client/src/pages/Practice.tsx"), "utf8");
    expect(practicePage).not.toContain("absolute inset-x-5 top-6 h-28 rounded-xl border");
    expect(practicePage).not.toContain("absolute inset-x-4 top-4 h-28 rounded-xl border");
    expect(practicePage).toContain("hover:-translate-y-1");
  });
});
