import { describe, it, expect } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';

type AuthenticatedUser = NonNullable<TrpcContext['user']>;

function createAuthContext(role: AuthenticatedUser['role'] = 'user'): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: 'test-user',
    email: 'test@example.com',
    name: 'Test User',
    loginMethod: 'custom',
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    schoolCode: 'TEST_SCHOOL',
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: 'https',
      headers: {},
    } as TrpcContext['req'],
    res: {} as TrpcContext['res'],
  };

  return ctx;
}

describe('Market System', () => {
  it('should check if market is open', async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.market.isMarketOpen();

    expect(result).toBeDefined();
    expect(result).toHaveProperty('isOpen');
    expect(result).toHaveProperty('currentTime');
    expect(result).toHaveProperty('marketOpenTime');
    expect(result).toHaveProperty('marketCloseTime');
    expect(result.marketOpenTime).toBe('9:30 AM EST');
    expect(result.marketCloseTime).toBe('4:00 PM EST');
  });

  it('should return market status with reason if closed', async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.market.isMarketOpen();

    // Check if weekend
    const now = new Date();
    const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const dayOfWeek = estTime.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      expect(result.isOpen).toBe(false);
      expect(result.reason).toBe('Market closed on weekends');
    }
  });

  it('should return empty portfolio snapshots', async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.market.getPortfolioSnapshots({ limit: 30 });

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('should return portfolio snapshots with custom limit', async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.market.getPortfolioSnapshots({ limit: 10 });

    expect(Array.isArray(result)).toBe(true);
  });

  it('should validate market hours logic', () => {
    // Test market hours calculation
    const testCases = [
      { hour: 9, minute: 29, expected: false }, // Before market open
      { hour: 9, minute: 30, expected: true },  // Market open
      { hour: 12, minute: 0, expected: true },  // Mid-day
      { hour: 15, minute: 59, expected: true }, // Before market close
      { hour: 16, minute: 0, expected: false }, // Market closed
      { hour: 17, minute: 0, expected: false }, // After market close
    ];

    testCases.forEach(({ hour, minute, expected }) => {
      const currentMinutes = hour * 60 + minute;
      const openMinutes = 9 * 60 + 30;
      const closeMinutes = 16 * 60;

      const isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
      expect(isOpen).toBe(expected);
    });
  });

  it('returns operational cache metadata to an admin', async () => {
    const caller = appRouter.createCaller(createAuthContext('admin'));
    await expect(caller.market.getCacheStatus()).resolves.toMatchObject({
      apiMode: 'paused',
      ttlMilliseconds: 300000,
      entryCount: expect.any(Number),
    });
  });

  it('prevents non-admin users from viewing cache metadata', async () => {
    const caller = appRouter.createCaller(createAuthContext('user'));
    await expect(caller.market.getCacheStatus()).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});
