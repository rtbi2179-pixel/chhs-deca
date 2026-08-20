import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Credit Score Breakdown guidance", () => {
  it("provides an action and improvement tip for every displayed credit-score factor", () => {
    const bankingDashboard = readFileSync(join(process.cwd(), "client/src/pages/BankingDashboard.tsx"), "utf8");

    for (const factor of ["Payment Reliability", "Account History", "Practice Consistency", "Savings Discipline", "Credit Utilization"]) {
      expect(bankingDashboard).toContain(`"${factor}"`);
    }
    expect(bankingDashboard).toContain("Website action:");
    expect(bankingDashboard).toContain("Improvement tip:");
    expect(bankingDashboard).toContain("<Tooltip content={<CreditScoreBreakdownTooltip />} />");
    expect(bankingDashboard).toContain("Hover over a factor to see the Blue Blazer action");
  });
});
