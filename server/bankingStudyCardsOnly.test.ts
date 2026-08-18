import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const readProjectFile = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), "utf8");

describe("Banking-only Study Cards flow", () => {
  it("renders Study Cards as the only available-card catalog and keeps server selection", () => {
    const banking = readProjectFile("client/src/pages/BankingDashboard.tsx");

    expect(banking).toContain("Choose your Banking Study Card");
    expect(banking).toContain("trpc.studyCards.catalog.useQuery");
    expect(banking).toContain("trpc.studyCards.mine.useQuery");
    expect(banking).toContain("trpc.studyCards.select.useMutation");
    expect(banking).toContain("selectStudyCardMutation.mutate({ cardKey: sc.key })");
    expect(banking).not.toContain("trpc.banking.getAvailableCards.useQuery");
    expect(banking).not.toContain("trpc.banking.applyCreditCard.useMutation");
    expect(banking).not.toContain("handleApplyCard");
  });

  it("uses the selected Study Card as the banking-card surface without removing issued-card account actions", () => {
    const banking = readProjectFile("client/src/pages/BankingDashboard.tsx");

    for (const contract of [
      "Active banking card",
      "Study + banking",
      "activeStudyCard?.liveBenefit",
      "studyCardMineQuery.data?.practiceProgress",
      "activeBankingCard.cardDetails?.tier",
      "Record Purchase",
      "Make Payment",
      "Statement",
      "trpc.banking.chargeCard.useMutation",
      "trpc.banking.makePayment.useMutation",
      "trpc.banking.getCardStatement.useQuery",
    ]) {
      expect(banking, `missing unified Banking Study Card contract: ${contract}`).toContain(contract);
    }
  });

  it("removes the standalone route and navigation item while redirecting onboarding to Banking", () => {
    const app = readProjectFile("client/src/App.tsx");
    const navigation = readProjectFile("client/src/components/Navigation.tsx");
    const walkthrough = readProjectFile("client/src/lib/onboardingWalkthrough.ts");

    expect(app).not.toContain("from \"./pages/StudyCards\"");
    expect(app).not.toContain("path=\"/study-cards\"");
    expect(navigation).not.toContain("href=\"/study-cards\"");
    expect(navigation).not.toContain("<span className=\"font-medium\">Study Cards</span>");
    expect(walkthrough).toContain('path: "/banking"');
    expect(walkthrough).toContain("choose a Study Card");
  });
});

export {};
