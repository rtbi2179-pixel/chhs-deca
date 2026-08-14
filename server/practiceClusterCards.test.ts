import { describe, expect, it } from "vitest";
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
});
