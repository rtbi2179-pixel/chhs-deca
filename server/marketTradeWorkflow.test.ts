import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("retired legacy market trade flow", () => {
  it("rejects client-priced orders so BBX server-authoritative execution cannot be bypassed", async () => {
    const context: TrpcContext = {
      user: { id: 1, openId: "legacy-market-test", email: null, name: "Legacy Market Test", loginMethod: "custom", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(), schoolCode: "TEST" },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(context);
    await expect(caller.market.buyStock({ stockId: 1, ticker: "AAPL", blueBucksAmount: "100", pricePerShare: "0.01" })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    await expect(caller.market.sellStock({ stockId: 1, ticker: "AAPL", shares: "1", pricePerShare: "999999" })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });
});
