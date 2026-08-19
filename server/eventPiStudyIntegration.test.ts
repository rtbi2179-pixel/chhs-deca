import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { inArray, sql } from "drizzle-orm";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { eventPerformanceIndicators } from "../drizzle/schema";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 72,
    openId: "event-pi-study-test-user",
    name: "Event PI Study Tester",
    schoolCode: "1234567",
    selectedSchoolCode: "1234567",
    loginMethod: "custom",
    role: "super_admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("event-linked PI Study Library", () => {
  it("returns the official ACT performance-indicator study path", async () => {
    const caller = appRouter.createCaller(createContext());
    const guide = await caller.piLearning.getEventStudyGuide({ eventCode: "act" });
    const modules = guide.instructionalAreas.flatMap((area) => area.modules);

    expect(guide.eventCode).toBe("ACT");
    expect(guide.totalModules).toBeGreaterThan(0);
    expect(modules.length).toBeLessThanOrEqual(24);
    expect(guide.totalModules).toBeGreaterThanOrEqual(modules.length);
    expect(guide.hasMore).toBe(guide.totalModules > modules.length);
    expect(modules[0]).toMatchObject({ cluster: "Finance" });
    expect(modules[0]?.piId).toBeTruthy();
    expect(modules[0]?.performanceIndicator).toBeTruthy();
  });

  it("keeps PI presentation in the PI Library and gives Event Resources a generic library route", () => {
    const eventsPage = readFileSync(join(process.cwd(), "client/src/pages/Events.tsx"), "utf8");
    const piQuizletPage = readFileSync(join(process.cwd(), "client/src/pages/PIQuizlet.tsx"), "utf8");

    expect(eventsPage).toContain('href="/pi-quizlet"');
    expect(eventsPage).toContain("PI Library");
    expect(eventsPage).toContain("Open PI Library");
    expect(eventsPage).toContain("Performance indicators");
    expect(eventsPage).toContain('Start Event Finder');
    expect(eventsPage).not.toContain('Find Your DECA Event');
    expect(eventsPage).toContain('href="/event-match?retake=1"');
    expect(eventsPage).toContain('Competition planning');
    expect(eventsPage).toContain("getPrimaryEvent.useQuery");
    expect(eventsPage).toContain("setPrimaryEvent.useMutation");
    expect(eventsPage).toContain("Select This Event");
    expect(eventsPage).toContain("Focused Event");
    expect(eventsPage).toContain("onSelectEvent={(eventCode) => setPrimaryEvent.mutate({ eventCode })}");
    expect(eventsPage).toContain("Open PI Library");
    expect(eventsPage).not.toContain("<EventPiStudyDialog event={event}");
    expect(eventsPage).not.toContain("{focusedEvent && <SelectedEventPiPanel");
    expect(eventsPage).not.toContain("View {event.code} PIs");
    expect(piQuizletPage).toContain("PI_PAGE_SIZE = 24");
    expect(piQuizletPage).toContain("Next indicators");
    expect(piQuizletPage).toContain("Showing {showingFrom}–{showingTo} of {totalVisibleModules} indicators");
    expect(piQuizletPage).toContain("getRequestedModuleId");
    expect(piQuizletPage).toContain("query.get(\"module\")");
    expect(piQuizletPage).not.toContain("Study for a specific competitive event");
    expect(piQuizletPage).not.toContain("getEventStudyGuide.useQuery");
  });

  it("keeps Event Resources free of event-specific PI search and modal state", () => {
    const eventsPage = readFileSync(join(process.cwd(), "client/src/pages/Events.tsx"), "utf8");

    expect(eventsPage).not.toContain("setPiDialogOpen(true)");
    expect(eventsPage).not.toContain("{focusedEvent && <SelectedEventPiPanel");
    expect(eventsPage).toContain("Open PI Library");
  });

  it("maps every catalog event to a complete PI pathway", async () => {
    const eventsPage = readFileSync(join(process.cwd(), "client/src/pages/Events.tsx"), "utf8");
    const eventCodes = [...eventsPage.matchAll(/code:\s*'([A-Z0-9]+)'/g)].map((match) => match[1]!);
    const database = await getDb();
    if (!database) throw new Error("Database unavailable");
    const coverage = await database
      .select({ eventCode: eventPerformanceIndicators.eventCode, piCount: sql<number>`count(*)` })
      .from(eventPerformanceIndicators)
      .where(inArray(eventPerformanceIndicators.eventCode, eventCodes))
      .groupBy(eventPerformanceIndicators.eventCode);

    expect(coverage).toHaveLength(eventCodes.length);
    expect(coverage.every((item) => Number(item.piCount) > 0)).toBe(true);
  });
});
