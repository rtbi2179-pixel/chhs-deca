import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { calculateMonthlySavingsInterest, SAVINGS_MONTHLY_RATE_PERCENT } from "./savingsInterest";

describe("unified Blue Bucks, Banking, and BBX simulation balances", () => {
  it("calculates the configured 7% savings return once per monthly credit", () => {
    expect(SAVINGS_MONTHLY_RATE_PERCENT).toBe(7);
    expect(calculateMonthlySavingsInterest(1200)).toBe(84);
  });

  it("uses the Banking investment account as BBX trading cash and credits news rewards to checking", () => {
    const router = readFileSync(join(process.cwd(), "server/bbxRouter.ts"), "utf8");
    expect(router).toContain("investmentBalance: userBankAccounts.investmentBalance");
    expect(router).toContain("checkingBalance: nextChecking.toFixed(2)");
    expect(router).toContain("Insufficient investment-account funds for this simulated order.");
    expect(router).toContain("investmentBalance: nextCash.toFixed(2)");
  });

  it("shows checking beneath the member name and registers an idempotent monthly credit endpoint", () => {
    const sidebar = readFileSync(join(process.cwd(), "client/src/components/SidebarNavigation.tsx"), "utf8");
    const server = readFileSync(join(process.cwd(), "server/_core/index.ts"), "utf8");
    expect(sidebar).toContain("bankAccountQuery");
    expect(sidebar).toContain("Checking");
    expect(server).toContain('/api/scheduled/savings-interest');
    expect(server).toContain("accrueMonthlySavingsInterestForAllAccounts");
  });
});
