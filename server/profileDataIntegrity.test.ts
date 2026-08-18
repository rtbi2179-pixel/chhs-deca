import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Profile data integrity and navigation', () => {
  const root = process.cwd();
  const database = fs.readFileSync(path.join(root, 'server/db.ts'), 'utf8');
  const router = fs.readFileSync(path.join(root, 'server/routers.ts'), 'utf8');
  const profile = fs.readFileSync(path.join(root, 'client/src/pages/Profile.tsx'), 'utf8');
  const creditChart = fs.readFileSync(path.join(root, 'client/src/components/CreditScoreChart.tsx'), 'utf8');
  const portfolioChart = fs.readFileSync(path.join(root, 'client/src/components/PortfolioChart.tsx'), 'utf8');

  it('derives learning counters and the study streak from persisted practice and bookmark records', () => {
    expect(database).toContain('export async function getProfileLearningMetrics(userId: number)');
    expect(database).toContain('count(${userAnswers.id})');
    expect(database).toContain('sum(case when ${userAnswers.isCorrect} = 1 then 1 else 0 end)');
    expect(database).toContain('count(${bookmarks.id})');
    expect(database).toContain('let studyStreak = 0');
    expect(database).toContain('activityDays.has');
  });

  it('exposes direct profile metrics and the existing daily credit refresh timing through protected queries', () => {
    expect(router).toContain('getProfileMetrics: protectedProcedure');
    expect(router).toContain('db.getProfileLearningMetrics(ctx.user.id)');
    expect(router).toContain('getCreditScoreRefreshSchedule: protectedProcedure.query');
    expect(router).toContain('CREDIT_SCORE_REFRESH_HOUR_UTC = 3');
    expect(router).toContain('creditScoreUpdateSchedule.lastRunAt');
  });

  it('uses direct practice metrics and server-authoritative BBX valuation instead of legacy leaderboard or placeholders', () => {
    expect(profile).toContain('trpc.practice.getProfileMetrics.useQuery');
    expect(profile).toContain('trpc.bbx.getPortfolio.useQuery');
    expect(profile).toContain('trpc.banking.getCreditScoreRefreshSchedule.useQuery');
    expect(profile).toContain('currentValue={bbxPortfolioQuery.data?.totalValue}');
    expect(profile).toContain('totalGain={bbxPortfolioQuery.data?.totalReturnPercent}');
    expect(profile).not.toContain('portfolioValue || 7200');
    expect(profile).not.toContain("{ date: '30d ago', value: 5000");
    expect(profile).not.toContain('trpc.practice.getLeaderboard.useQuery');
  });

  it('keeps the profile’s available sections in a navigable reference-inspired two-column layout', () => {
    expect(profile).toContain('Profile navigation');
    expect(profile).toContain("['profile-settings', 'Profile settings']");
    expect(profile).toContain("['portfolio', 'My portfolio']");
    expect(profile).toContain('lg:grid-cols-[minmax(17rem,0.78fr)_minmax(0,2fr)]');
    expect(profile).toContain('Notification Preferences');
    expect(profile).toContain('My Portfolio');
    expect(profile).toContain('Achievements');
  });

  it('labels both values transparently when there is no historical chart series', () => {
    expect(creditChart).toContain('Updates once daily. Next update:');
    expect(portfolioChart).toContain('BBX historical value points are not available yet');
    expect(portfolioChart).toContain('currencyLabel');
  });
});
