import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getGuidedBlazerBuddyReply } from "./blazerBuddy";

const readProjectFile = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), "utf8");

describe("guided Blazer Buddy", () => {
  it("routes common member questions to accurate Blue Blazer guidance without an AI call", () => {
    expect(getGuidedBlazerBuddyReply("When does my credit score update?")).toContain("once each day");
    expect(getGuidedBlazerBuddyReply("How do Blue Bucks work with BBX?")).toContain("Investment Account");
    expect(getGuidedBlazerBuddyReply("Which performance indicators should I study?")).toContain("PI Study Library");
    expect(getGuidedBlazerBuddyReply("How can I prepare for a mock exam?")).toContain("Mock Exams");
    expect(getGuidedBlazerBuddyReply("What event should I choose?")).toContain("Event Match Quiz");
  });

  it("persists a separate system-assistant conversation and makes daily refresh notices idempotent", () => {
    const schema = readProjectFile("drizzle/schema.ts");
    const buddy = readProjectFile("server/blazerBuddy.ts");
    const server = readProjectFile("server/_core/index.ts");

    expect(schema).toContain('mysqlTable("blazerBuddyMessages"');
    expect(schema).toContain("blazer_buddy_user_notification");
    expect(buddy).toContain("credit-score-refresh-${now.toISOString().slice(0, 10)}");
    expect(buddy).toContain("if (existing) continue");
    expect(buddy).toContain('notificationKey: "welcome"');
    expect(buddy).toContain("Hi, I’m Blazer Buddy");
    expect(server).toContain("postCreditScoreRefreshNotifications");
    expect(server).toContain("buddyNotifications");
  });

  it("exposes Blazer Buddy as a dedicated Direct Messages contact and guided reply endpoint", () => {
    const panel = readProjectFile("client/src/components/DirectMessagesPanel.tsx");
    const router = readProjectFile("server/membersRouter.ts");

    expect(panel).toContain("const BLAZER_BUDDY");
    expect(panel).toContain("Guided help, study tips, and credit-score refresh notices");
    expect(panel).toContain("trpc.members.getBlazerBuddyMessages.useQuery");
    expect(panel).toContain("trpc.members.sendBlazerBuddyMessage.useMutation");
    expect(router).toContain("getBlazerBuddyMessages");
    expect(router).toContain("sendBlazerBuddyMessage");
  });
});
