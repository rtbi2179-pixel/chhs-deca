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

  it("extends the Overview atmosphere across authenticated routes with route-specific constellation variants", () => {
    const css = readClientSource("index.css");
    const sidebar = readClientSource("components", "SidebarNavigation.tsx");
    const background = readClientSource("components", "InteractiveBackground.tsx");
    const events = readClientSource("pages", "Events.tsx");
    const announcements = readClientSource("pages", "Announcements.tsx");

    expect(css).toContain(".app-atmosphere");
    for (const variant of ["study", "practice", "roleplay", "leaderboard", "piLibrary", "events", "calendar", "announcements", "discussions", "volunteer", "feedback", "banking", "market", "news", "members", "admin", "chapter", "profile"]) {
      expect(css).toContain(`data-atmosphere="${variant}"`);
      expect(sidebar).toContain(`'${variant}'`);
    }
    expect(sidebar).toContain('<InteractiveBackground variant={atmosphere} />');
    expect(background).toContain('"study" | "practice" | "mockExam" | "roleplay"');
    expect(background).toContain("constellationShapes");
    expect(events).toContain('className="page-shell events-atmosphere"');
    expect(announcements).toContain('className="page-shell community-feed"');
  });
});
