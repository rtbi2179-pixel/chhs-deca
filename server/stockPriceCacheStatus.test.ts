import { describe, expect, it } from "vitest";
import { getStockPriceCacheStatus, resetStockPriceServiceForTests } from "./stockPriceService";

describe("stock price cache status", () => {
  it("returns operational metadata without exposing cached quote values", () => {
    resetStockPriceServiceForTests();
    const status = getStockPriceCacheStatus();

    expect(status).toMatchObject({
      ttlMilliseconds: 300000,
      apiMode: "on_demand",
      entryCount: expect.any(Number),
      inFlightRequestCount: expect.any(Number),
    });
    expect(Array.isArray(status.entries)).toBe(true);
    status.entries.forEach((entry) => {
      expect(entry).toMatchObject({
        ticker: expect.any(String),
        ageMilliseconds: expect.any(Number),
        isFresh: expect.any(Boolean),
        hasQuote: expect.any(Boolean),
      });
      expect(entry).not.toHaveProperty("price");
    });
  });
});
