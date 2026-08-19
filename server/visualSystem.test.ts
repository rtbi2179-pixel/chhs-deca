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

  it("keeps the requested community and chapter routes transparent enough for their constellation variants", () => {
    const targetPages = [
      "Leaderboard.tsx",
      "CalendarPage.tsx",
      "Discussions.tsx",
      "Volunteer.tsx",
      "Feedback.tsx",
    ];

    for (const page of targetPages) {
      expect(readClientSource("pages", page)).toContain("page-shell");
    }
  });

  it("uses shared typography tokens and editorial financial-performance surfaces on Banking and Leaderboard", () => {
    const css = readClientSource("index.css");
    const banking = readClientSource("pages", "BankingDashboard.tsx");
    const leaderboard = readClientSource("pages", "Leaderboard.tsx");

    expect(css).toContain("--font-ui");
    expect(css).toContain("--font-data");
    expect(css).toContain(".banking-metric");
    expect(css).toContain(".leaderboard-table-shell");
    expect(banking).toContain("banking-hero");
    expect(banking).toContain("banking-section-card");
    expect(banking).toContain("banking-account-row");
    expect(leaderboard).toContain("leaderboard-hero");
    expect(leaderboard).toContain("leaderboard-table-shell");
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
    expect(background).toContain('overview: { starCount: 58, nodeCount: 16, coreX: 0.76, coreY: 0.3, strength: 1, shape: "orbit", spread: 0.31 }');
    expect(background).toContain('const isCircularOrbit = configuration.shape === "orbit"');
    expect(background).toContain('const orbitalVelocity = prefersReducedMotion ? 0 : time');
    expect(events).toContain('className="page-shell events-atmosphere"');
    expect(announcements).toContain('className="page-shell community-feed"');
  });
});
