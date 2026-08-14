import { describe, expect, it } from "vitest";
import { filterPiStudyModules } from "../client/src/lib/piSearch";

const modules = [
  { piId: "MKT-BA-001", cluster: "Marketing", instructionalArea: "Business Law", performanceIndicator: "Explain contract exclusivity" },
  { piId: "FIN-FI-004", cluster: "Finance", instructionalArea: "Financial Analysis", performanceIndicator: "Calculate return on investment" },
  { piId: "BM-HR-011", cluster: "Business Management & Administration", instructionalArea: "Human Resources Management", performanceIndicator: "Describe employee onboarding" },
];

describe("PI Study Library search", () => {
  it("matches PI codes, indicator text, instructional areas, and clusters without case sensitivity", () => {
    expect(filterPiStudyModules(modules, "mkt-ba")).toEqual([modules[0]]);
    expect(filterPiStudyModules(modules, "return on investment")).toEqual([modules[1]]);
    expect(filterPiStudyModules(modules, "human resources")).toEqual([modules[2]]);
    expect(filterPiStudyModules(modules, "finance")).toEqual([modules[1]]);
  });

  it("returns the complete active list for an empty query and no records for a missing term", () => {
    expect(filterPiStudyModules(modules, "   ")).toEqual(modules);
    expect(filterPiStudyModules(modules, "nonexistent indicator")).toEqual([]);
  });
});
