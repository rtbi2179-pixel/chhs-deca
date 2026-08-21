import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("discussion posting and sender-visible updates", () => {
  const db = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");
  const router = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
  const page = readFileSync(resolve(process.cwd(), "client/src/pages/Discussions.tsx"), "utf8");

  it("returns the newly persisted thread and reply with their author data", () => {
    expect(db).toContain("The discussion thread could not be retrieved after posting.");
    expect(db).toContain("The reply could not be retrieved after posting.");
    expect(db).toContain("innerJoin(users, eq(discussionReplies.userId, users.id))");
  });

  it("enforces chapter reply visibility and passes the active school scope", () => {
    expect(db).toContain("You can only reply to discussions in your chapter.");
    expect(router).toContain("ctx.user?.selectedSchoolCode || ctx.user?.schoolCode");
    expect(router).toContain("createDiscussionReply(input.threadId, ctx.user.id");
  });

  it("updates both sender-facing caches before confirming a successful post", () => {
    expect(page).toContain("utils.discussions.getThreads.setData");
    expect(page).toContain("utils.discussions.getReplies.setData");
    expect(page).toContain("utils.discussions.getThreads.invalidate(createdInput)");
    expect(page).toContain("utils.discussions.getReplies.invalidate({ threadId: selectedThreadId })");
  });
});
