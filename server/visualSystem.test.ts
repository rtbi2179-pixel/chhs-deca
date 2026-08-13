import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "..");

function readClientSource(...segments: string[]) {
  return readFileSync(path.join(projectRoot, "client", "src", ...segments), "utf8");
}

describe("shared Blue Blazer visual system", () => {
  it("defines restrained editorial page, panel, navigation, and state primitives", () => {
    const css = readClientSource("index.css");

    expect(css).toContain(".page-shell");
    expect(css).toContain(".editorial-panel");
    expect(css).toContain(".editorial-tab-active");
    expect(css).toContain(".empty-state, .loading-state");
    expect(css).not.toContain("backdrop-filter: blur(12px)");
  });

  it("uses the shared page shell on principal student and administration workflows", () => {
    const priorityPages = [
      "PIQuizlet.tsx",
      "BankingDashboard.tsx",
      "BlueMarket.tsx",
      "ChapterMockExam.tsx",
      "SuperAdminDashboard.tsx",
    ];

    for (const page of priorityPages) {
      expect(readClientSource("pages", page)).toContain("page-shell");
    }
  });
});
