import { afterEach, describe, expect, it, vi } from 'vitest';
import { getStockPrice, resetStockPriceServiceForTests, testAlphaVantageConnection } from './stockPriceService';

const validQuote = () => ({
  ok: true,
  json: async () => ({ 'Global Quote': { '05. price': '123.45', '09. change': '1.20', '10. change percent': '0.98%' } }),
});

describe('Stock Price Service', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetStockPriceServiceForTests();
  });

  it('parses a valid Alpha Vantage quote response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(validQuote()));
    const quote = await getStockPrice('AAPL');
    expect(quote).toMatchObject({ symbol: 'AAPL', price: 123.45, change: 1.2, changePercent: 0.98 });
    expect(quote?.timestamp).toBeInstanceOf(Date);
  });

  it('reports a successful connection for a valid quote response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(validQuote()));
    await expect(testAlphaVantageConnection()).resolves.toBe(true);
  });

  it('handles an invalid ticker response gracefully', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ 'Error Message': 'Invalid API call.' }) }));
    await expect(getStockPrice('INVALID_TICKER_XYZ')).resolves.toBeNull();
  });
});
