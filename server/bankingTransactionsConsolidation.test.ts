import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const readProjectFile = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), "utf8");

describe("Banking and Transactions consolidation", () => {
  const banking = readProjectFile("client/src/pages/BankingDashboard.tsx");
  const transactions = readProjectFile("client/src/pages/TransactionHistory.tsx");
  const sidebar = readProjectFile("client/src/components/SidebarNavigation.tsx");
  const legacyNavigation = readProjectFile("client/src/components/Navigation.tsx");
  const app = readProjectFile("client/src/App.tsx");

  it("renders the existing transaction history inside Banking", () => {
    expect(banking).toContain('import TransactionHistory from "./TransactionHistory"');
    expect(banking).toContain("<TransactionHistory embedded />");
    expect(transactions).toContain("trpc.market.getTransactionHistory.useQuery");
    expect(transactions).toContain("selectedTicker");
    expect(transactions).toContain("startDate");
    expect(transactions).toContain("endDate");
    expect(transactions).toContain("Show'} Blue Bucks Breakdown");
    expect(transactions).toContain("Previous");
    expect(transactions).toContain("Next");
  });

  it("removes standalone Transactions navigation while retaining legacy-route compatibility", () => {
    expect(sidebar).not.toContain("label: 'Transactions'");
    expect(sidebar).not.toContain("href: '/transaction-history'");
    expect(legacyNavigation).not.toContain("href=\"/transaction-history\"");
    expect(legacyNavigation).not.toContain('<span className="font-medium">Transactions</span>');
    expect(sidebar).toContain("location === '/banking' || location === '/transaction-history'");
    expect(app).toContain('path="/transaction-history"');
  });
});
