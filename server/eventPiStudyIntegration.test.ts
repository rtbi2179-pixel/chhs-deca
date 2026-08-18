import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

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
    expect(piQuizletPage).toContain("getRequestedEventStudyPath");
    expect(piQuizletPage).toContain("query.get(\"event\")");
    expect(piQuizletPage).toContain("query.get(\"module\")");
  });
});
