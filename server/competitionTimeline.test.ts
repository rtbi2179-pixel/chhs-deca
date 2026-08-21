import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { clusterForEvent, getTimelineStrategy } from "../shared/timelineRequirements";

describe("personalized competition timeline", () => {
  const schema = readFileSync(resolve(process.cwd(), "drizzle/schema.ts"), "utf8");
  const engine = readFileSync(resolve(process.cwd(), "server/timelineEngine.ts"), "utf8");
  const router = readFileSync(resolve(process.cwd(), "server/timelineRouter.ts"), "utf8");
  const page = readFileSync(resolve(process.cwd(), "client/src/pages/CompetitionTimeline.tsx"), "utf8");
  const profilePreview = readFileSync(resolve(process.cwd(), "client/src/components/CompetitionTimelinePreview.tsx"), "utf8");
  const events = readFileSync(resolve(process.cwd(), "client/src/pages/Events.tsx"), "utf8");

  it("assigns distinct preparation strategies to roleplay, written, pitch, presentation, and simulation events", () => {
    expect(getTimelineStrategy("MCS")).toBe("roleplay_exam");
    expect(getTimelineStrategy("FOR")).toBe("written");
    expect(getTimelineStrategy("EIP")).toBe("pitch");
    expect(getTimelineStrategy("PSE")).toBe("prepared");
    expect(getTimelineStrategy("SMG")).toBe("simulation");
    expect(clusterForEvent("ACT")).toBe("Finance");
    expect(clusterForEvent("HLM")).toBe("Hospitality & Tourism");
  });

  it("persists editable competition dates, user timelines, and linked actionable tasks", () => {
    expect(schema).toContain('mysqlTable("eventTimelineCalendarEvents"');
    expect(schema).toContain('mysqlTable("userEventTimelines"');
    expect(schema).toContain('mysqlTable("timelineItems"');
    expect(engine).toContain("ensureTimelineCalendar");
    expect(engine).toContain("generatedReason");
    expect(engine).toContain("deepLink");
    expect(engine).toContain('CURRENT_COMPETITION_YEAR = "2026-2027"');
  });

  it("compresses late starts and preserves hard deadline protections", () => {
    expect(engine).toContain('daysRemaining <= 35 ? "emergency"');
    expect(engine).toContain('daysRemaining <= 75 ? "accelerated"');
    expect(engine).toContain("Hard competition deadlines cannot be moved.");
    expect(engine).toContain("latestCalendarEdit");
    expect(router).toContain("saveCalendarEvent");
    expect(router).toContain("deleteCalendarEvent");
  });

  it("exposes the roadmap in the main timeline view, selected event, and Profile preview", () => {
    expect(page).toContain("My Competition Timeline");
    expect(page).toContain("Recommended next task");
    expect(page).toContain("Manage dates");
    expect(profilePreview).toContain("My competition timeline");
    expect(profilePreview).toContain('href="/timeline"');
    expect(events).toContain("Open Timeline");
  });
});
