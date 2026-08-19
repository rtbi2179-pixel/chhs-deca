import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 72,
    openId: "pi-library-performance-test-user",
    name: "PI Library Performance Tester",
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

describe("PI Library paginated listings", () => {
  it("returns a compact first page with the full result count instead of loading an entire cluster", async () => {
    const caller = appRouter.createCaller(createContext());
    const page = await caller.piLearning.getModulesByCluster({ cluster: "Marketing", search: "", offset: 0, limit: 24 });

    expect(page.modules).toHaveLength(24);
    expect(page.totalModules).toBeGreaterThan(page.modules.length);
    expect(page.hasMore).toBe(true);
    expect(page.offset).toBe(0);
  });
});
