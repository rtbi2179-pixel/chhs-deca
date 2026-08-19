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
    expect(modules).toHaveLength(guide.totalModules);
    expect(modules[0]).toMatchObject({ cluster: "Finance" });
    expect(modules[0]?.piId).toBeTruthy();
    expect(modules[0]?.performanceIndicator).toBeTruthy();
  });

  it("wires each Events card to a PI dialog and deep-links the selected event and module", () => {
    const eventsPage = readFileSync(join(process.cwd(), "client/src/pages/Events.tsx"), "utf8");
    const piQuizletPage = readFileSync(join(process.cwd(), "client/src/pages/PIQuizlet.tsx"), "utf8");

    expect(eventsPage).toContain("EventPiStudyDialog");
    expect(eventsPage).toContain("getEventStudyGuide.useQuery");
    expect(eventsPage).toContain("View {event.code} PIs");
    expect(eventsPage).toContain("/pi-quizlet?event=${encodeURIComponent(event.code)}");
    expect(eventsPage).not.toContain("displayedModules.slice(0, 24)");
    expect(eventsPage).toContain("Showing all ${totalModules}");
    expect(piQuizletPage).toContain("getRequestedEventStudyPath");
    expect(piQuizletPage).toContain("query.get(\"event\")");
    expect(piQuizletPage).toContain("query.get(\"module\")");
  });

  it("filters event-specific PIs by code, performance indicator, instructional area, or cluster and recovers from no results", () => {
    const eventsPage = readFileSync(join(process.cwd(), "client/src/pages/Events.tsx"), "utf8");

    expect(eventsPage).toContain("const [piSearch, setPiSearch] = useState('')");
    expect(eventsPage).toContain("normalizedPiSearch");
    expect(eventsPage).toContain("module.piId, module.performanceIndicator, module.instructionalArea, module.cluster, event.cluster");
    expect(eventsPage).toContain("Search ${event.code} PIs by code, skill, or area");
    expect(eventsPage).toContain("No event PIs match that search.");
    expect(eventsPage).toContain("Clear search");
    expect(eventsPage).toContain("if (!nextOpen) setPiSearch('')");
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
