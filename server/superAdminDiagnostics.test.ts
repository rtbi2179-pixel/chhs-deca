import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { assertDesignatedDiagnosticsAdmin, isDesignatedDiagnosticsAdmin } from "./superAdminDiagnosticsRouter";
import type { TrpcContext } from "./_core/context";

type DiagnosticsUser = NonNullable<TrpcContext["user"]>;

function contextFor(email: string, role: DiagnosticsUser["role"] = "super_admin"): TrpcContext {
  return {
    user: {
      id: 987,
      openId: "diagnostics-test-user",
      email,
      name: "Diagnostics Test User",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("superAdminDiagnostics authorization", () => {
  it.each(["sahan.mallampati@gmail.com", "rtbi2179@gmail.com", "SAHAN.MALLAMPATI@GMAIL.COM"])("allows designated super admin %s", (email) => {
    expect(isDesignatedDiagnosticsAdmin(contextFor(email).user!)).toBe(true);
    expect(() => assertDesignatedDiagnosticsAdmin(contextFor(email).user!)).not.toThrow();
  });

  it("rejects non-designated accounts even when their role is super_admin", async () => {
    const ctx = contextFor("another-super-admin@example.com");
    expect(isDesignatedDiagnosticsAdmin(ctx.user!)).toBe(false);
    expect(() => assertDesignatedDiagnosticsAdmin(ctx.user!)).toThrow(/restricted/i);
    await expect(appRouter.createCaller(ctx).superAdminDiagnostics.listChapters()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("keeps the diagnostics router exposed through the typed app router", () => {
    expect(appRouter._def.record.superAdminDiagnostics).toBeDefined();
    const routerSource = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
    const diagnosticsSource = readFileSync(resolve(process.cwd(), "server/superAdminDiagnosticsRouter.ts"), "utf8");
    expect(routerSource).toContain("superAdminDiagnostics: superAdminDiagnosticsRouter");
    expect(diagnosticsSource).toContain("getChapter: protectedProcedure");
    expect(diagnosticsSource).toContain("trackInteraction: protectedProcedure");
  });
});

describe("WebsiteInteractionTracker privacy boundary", () => {
  it("records only semantic page views and control clicks while honoring the opt-out marker", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/components/WebsiteInteractionTracker.tsx"), "utf8");
    expect(source).toContain('eventType: "page_view"');
    expect(source).toContain('eventType: "control_click"');
    expect(source).toContain('[data-no-diagnostics]');
    expect(source).not.toContain("input.value");
  });
});
