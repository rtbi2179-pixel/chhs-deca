import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CHAPTER_RESET_LINK_TTL_MS, hashPasswordResetToken } from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("chapter password reset safeguards", () => {
  const databaseSource = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");
  const memberRouterSource = readFileSync(resolve(process.cwd(), "server/membersRouter.ts"), "utf8");
  const authRouterSource = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
  const forgotPasswordSource = readFileSync(resolve(process.cwd(), "client/src/pages/ForgotPassword.tsx"), "utf8");
  const membersPageSource = readFileSync(resolve(process.cwd(), "client/src/pages/MembersPage.tsx"), "utf8");

  it("uses a deterministic hash instead of storing the approved reset token", () => {
    const token = "single-use-reset-token";
    expect(hashPasswordResetToken(token)).toHaveLength(64);
    expect(hashPasswordResetToken(token)).toBe(hashPasswordResetToken(token));
    expect(hashPasswordResetToken(token)).not.toBe(token);
    expect(databaseSource).toContain('resetTokenHash: hashPasswordResetToken(token)');
    expect(databaseSource).toContain('resetTokenHash: null');
    expect(databaseSource).toContain('status: "completed"');
  });

  it("uses an exact one-hour approval window", () => {
    expect(CHAPTER_RESET_LINK_TTL_MS).toBe(60 * 60 * 1000);
    expect(databaseSource).toContain('new Date(approvedAt.getTime() + CHAPTER_RESET_LINK_TTL_MS)');
    expect(databaseSource).toContain('new Date() > request.resetExpiresAt');
  });

  it("requires the submitted school code before creating a normal member request", () => {
    expect(authRouterSource).toContain('schoolCode: z.string().trim().max(50).optional()');
    expect(authRouterSource).toContain('createChapterPasswordResetRequest(input.email, input.schoolCode)');
    expect(databaseSource).toContain('member.schoolCode !== schoolCode');
    expect(forgotPasswordSource).toContain('School Code');
    expect(forgotPasswordSource).toContain('Request Chapter Approval');
  });

  it("restricts approval to school-scoped chapter admins and never collects a password from them", () => {
    expect(memberRouterSource).toContain('Only chapter administrators can manage password reset requests.');
    expect(memberRouterSource).toContain('getChapterManagementSchoolCode(ctx.user, input.schoolCode)');
    expect(memberRouterSource).toContain('approveChapterPasswordResetRequest');
    expect(membersPageSource).toContain('Pending password reset requests');
    expect(membersPageSource).toContain('Issue one-hour reset link');
    expect(membersPageSource).not.toContain('passwordHash');
    expect(membersPageSource).not.toContain('newPassword');
  });

  it("rejects a non-admin before any reset request data can be read", async () => {
    const ctx = {
      user: {
        id: 44221,
        openId: "member-reset-test",
        email: "member@example.com",
        name: "Member Reset Test",
        loginMethod: "manus",
        role: "user",
        schoolCode: "CHAPTER-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    } as TrpcContext;
    await expect(appRouter.createCaller(ctx).members.getPasswordResetRequests({ schoolCode: "CHAPTER-1" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
