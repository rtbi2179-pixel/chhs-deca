import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(): TrpcContext {
  return {
    user: {
      id: 72,
      openId: "ai-judge-router-test",
      name: "AI Judge Test Member",
      schoolCode: "1234567",
      selectedSchoolCode: "1234567",
      role: "super_admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("aiJudge router", () => {
  it("exposes only the verified, event-specific scoring configuration", async () => {
    const ruleSets = await appRouter.createCaller(context()).aiJudge.ruleSets();

    expect(ruleSets).toHaveLength(1);
    expect(ruleSets[0]).toMatchObject({
      competitionYear: "2026-2027",
      eventCode: "EIP",
      eventName: "Innovation Plan",
      participantMin: 1,
      participantMax: 3,
      presentationTimeSeconds: 900,
      maximumPoints: 100,
      verified: true,
    });
    expect(ruleSets[0]?.criteria).toHaveLength(10);
    expect(ruleSets[0]?.criteria.find((criterion) => criterion.id === "presentation_design")).toMatchObject({ maximumPoints: 5, assessableFromTranscript: false });
  });
});
