import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const homeSource = () => readFileSync(join(process.cwd(), "client/src/pages/Home.tsx"), "utf8");

describe("authenticated Overview dashboard", () => {
  it("replaces the signed-in marketing page with an operational member overview", () => {
    const source = homeSource();

    expect(source).toContain("function AuthenticatedOverview");
    expect(source).toContain("if (user) return <AuthenticatedOverview user={user} />");
    expect(source).toContain("WELCOME BACK");
    expect(source).toContain("STUDY PROGRESS");
  });

  it("uses server-authoritative member, financial, BBX, and Blue's News data", () => {
    const source = homeSource();

    for (const query of [
      "trpc.practice.getProfileMetrics.useQuery",
      "trpc.preferences.getPrimaryEvent.useQuery",
      "trpc.banking.getBankAccount.useQuery",
      "trpc.bbx.getPortfolio.useQuery",
      "trpc.bbx.getUnreadNewsCount.useQuery",
      "trpc.bbx.getBluesNews.useQuery",
    ]) expect(source).toContain(query);

    expect(source).toContain("formatCurrency(bankAccount?.checkingBalance)");
    expect(source).toContain("formatCurrency(portfolio?.totalValue)");
    expect(source).toContain("latestNews?.headline");
  });

  it("links each live summary to the current study, financial, market, and chapter destinations", () => {
    const source = homeSource();

    for (const destination of [
      "const studyDestination = primaryEvent ? '/events' : '/event-match'",
      'href="/practice"',
      'href="/mock-exams"',
      'href="/banking"',
      'href="/blues-news"',
      'href="/events"',
      'href="/calendar"',
      'href="/announcements"',
      'href="/discussions"',
    ]) expect(source).toContain(destination);
  });

  it("lets members choose and persist a study-focus event from the Your Study Path compass", () => {
    const source = homeSource();

    expect(source).toContain('aria-label="Choose your DECA event focus"');
    expect(source).toContain("setEventPickerOpen(true)");
    expect(source).toContain("trpc.preferences.setPrimaryEvent.useMutation");
    expect(source).toContain("utils.preferences.getPrimaryEvent.invalidate()");
    expect(source).toContain("Search by event name, code, cluster, or type");
    expect(source).toContain("allEvents.filter");
    expect(source).toContain("aria-pressed={isSelected}");
    expect(source).toContain("No event matches that search.");
  });
});
