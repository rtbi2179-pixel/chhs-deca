import { describe, expect, it } from "vitest";
import { createAdministratorActivityRecord } from "./adminActivity";

describe("administrator activity records", () => {
  it("records feedback reviews and role-management actions with reviewable targets", () => {
    const feedback = createAdministratorActivityRecord({ schoolCode: "CHAPTER-1", actorUserId: 7, action: "feedback_reviewed", targetType: "feedback", targetId: "15", details: { reviewed: true } });
    const promotion = createAdministratorActivityRecord({ schoolCode: "CHAPTER-1", actorUserId: 7, action: "user_promoted_to_admin", targetType: "user", targetId: "20", details: { email: "member@example.org" } });
    const demotion = createAdministratorActivityRecord({ schoolCode: "CHAPTER-1", actorUserId: 7, action: "user_demoted_from_admin", targetType: "user", targetId: "20", details: { email: "member@example.org" } });

    expect(feedback).toMatchObject({ action: "feedback_reviewed", targetType: "feedback", targetId: "15" });
    expect(JSON.parse(feedback.details)).toEqual({ reviewed: true });
    expect([promotion.action, demotion.action]).toEqual(["user_promoted_to_admin", "user_demoted_from_admin"]);
    expect(JSON.parse(promotion.details)).toEqual({ email: "member@example.org" });
  });
});
