import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("BBX performance graph time axes and hover readouts", () => {
  it("renders explicit time axes and interactive hover readouts in BbxPerformanceGraphs", () => {
    const component = readFileSync(join(process.cwd(), "client/src/components/BbxPerformanceGraphs.tsx"), "utf8");
    expect(component).toContain("InteractiveGraph");
    expect(component).toContain("onMouseMove");
    expect(component).toContain("onMouseLeave");
    expect(component).toContain("toLocaleTimeString");
    expect(component).toContain("pts");
    expect(component).toContain("Recorded Ticks");
  });
});
