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
    expect(profile).toContain('PROFILE_SECTIONS');
    expect(profile).toContain('lg:grid-cols-[minmax(17rem,0.78fr)_minmax(0,2fr)]');
    expect(profile).toContain("{activeSection === 'profile-settings' &&");
    expect(profile).toContain("{activeSection === 'event-selection' &&");
    expect(profile).toContain("{activeSection === 'progress' &&");
    expect(profile).toContain("{activeSection === 'preferences' &&");
    expect(profile).toContain("{activeSection === 'portfolio' &&");
    expect(profile).toContain("{activeSection === 'achievements' &&");
    expect(profile).toContain('Notification Preferences');
    expect(profile).toContain('My Portfolio');
    expect(profile).toContain('Achievements');
  });

  it('keeps focused-event selection and both learning and Banking detail within focused Profile tabs', () => {
    expect(profile).toContain('trpc.preferences.getPrimaryEvent.useQuery');
    expect(profile).toContain('trpc.banking.getBankAccount.useQuery');
    expect(profile).toContain('const focusedEvent = allEvents.find');
    expect(profile).toContain('Event Selection');
    expect(profile).toContain('No event selected');
    expect(profile).toContain('Start Event Finder');
    expect(profile).not.toContain('Find Your DECA Event');
    expect(profile).toContain('Learning summary');
    expect(profile).toContain('Banking information');
    expect(profile).toContain('Manage Banking &amp; Cards');
  });

  it('removes obsolete onboarding replay and downloadable-report actions from the Profile page', () => {
    expect(profile).not.toContain('Replay Blue Blazer Onboarding');
    expect(profile).not.toContain('Download Your Report');
    expect(profile).not.toContain('restartOnboarding');
    expect(profile).not.toContain('downloadMyReport');
  });

  it('labels both values transparently when there is no historical chart series', () => {
    expect(creditChart).toContain('Updates once daily. Next update:');
    expect(portfolioChart).toContain('BBX historical value points are not available yet');
    expect(portfolioChart).toContain('currencyLabel');
  });
});
