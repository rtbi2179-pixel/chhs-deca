import { describe, expect, it } from "vitest";
import {
  applyCreditCardCharge,
  applyCreditCardPayment,
  calculateCashback,
  summarizeSpending,
} from "./creditCardMath";

describe("credit-card financial calculations", () => {
  const openCard = { creditLimit: 1000, currentBalance: 200 };

  it("updates available credit and utilization after a valid charge", () => {
    expect(applyCreditCardCharge(openCard, 125.5)).toEqual({
      creditLimit: 1000,
      currentBalance: 325.5,
      availableCredit: 674.5,
      utilizationRate: 32.55,
    });
    expect(() => applyCreditCardCharge(openCard, 801)).toThrow("available credit");
  });

  it("updates balances after a valid payment and rejects overpayments", () => {
    expect(applyCreditCardPayment(openCard, 75)).toMatchObject({
      currentBalance: 125,
      availableCredit: 875,
      utilizationRate: 12.5,
    });
    expect(() => applyCreditCardPayment(openCard, 201)).toThrow("current card balance");
  });

  it("calculates tier-based cashback to currency precision", () => {
    expect(calculateCashback(86.67, 3.5)).toBe(3.03);
  });

  it("groups actual card usage by category and calendar month", () => {
    const summary = summarizeSpending([
      { amount: 42.5, category: "Dining", occurredAt: new Date("2026-08-01T12:00:00Z") },
      { amount: 17.5, category: "Dining", occurredAt: new Date("2026-08-03T12:00:00Z") },
      { amount: 100, category: "Books", occurredAt: new Date("2026-09-01T12:00:00Z") },
    ]);

    expect(summary.categories).toEqual([
      { category: "Books", total: 100, transactions: 1, average: 100 },
      { category: "Dining", total: 60, transactions: 2, average: 30 },
    ]);
    expect(summary.monthly).toEqual([
      { month: "2026-08", total: 60 },
      { month: "2026-09", total: 100 },
    ]);
  });
});
