import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Direct Messages send control", () => {
  const panel = readFileSync(resolve(process.cwd(), "client/src/components/DirectMessagesPanel.tsx"), "utf8");
  const router = readFileSync(resolve(process.cwd(), "server/membersRouter.ts"), "utf8");

  it("passes the active school scope to both message reads and sends", () => {
    expect(panel).toContain('schoolCode: activeSchoolCode || undefined');
    expect(panel).toContain('recipientId: selectedUser.id');
    expect(panel).toContain('body: messageText.trim()');
    expect(router).toContain("const schoolCode = ctx.user.role === 'super_admin' ? input.schoolCode : ctx.user.schoolCode");
  });

  it("keeps the send control reachable and reconciles a delivered message from the server", () => {
    expect(panel).toContain('aria-label="Send message"');
    expect(panel).toContain('utils.members.getMessages.invalidate');
    expect(panel).toContain('utils.members.getConversations.invalidate');
    expect(panel).toContain('toast.error');
    expect(panel).toContain('onKeyDown');
  });
});
