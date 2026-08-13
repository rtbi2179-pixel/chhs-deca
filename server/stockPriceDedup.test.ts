import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getStockPrice, resetStockPriceServiceForTests } from './stockPriceService';

const quoteResponse = () => ({ ok: true, json: async () => ({ 'Global Quote': { '05. price': '101.25', '09. change': '0.50', '10. change percent': '0.50%' } }) });

describe('Stock Price Service - In-Flight Deduplication', () => {
  beforeEach(() => {
    resetStockPriceServiceForTests();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(quoteResponse()));
  });

  afterEach(() => vi.unstubAllGlobals());

  it('deduplicates concurrent requests for the same ticker', async () => {
    const results = await Promise.all([getStockPrice('AAPL'), getStockPrice('AAPL'), getStockPrice('AAPL'), getStockPrice('AAPL'), getStockPrice('AAPL')]);
    expect(results).toHaveLength(5);
    expect(results.every((result) => JSON.stringify(result) === JSON.stringify(results[0]))).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('executes separate requests for different tickers', async () => {
    const results = await Promise.all([getStockPrice('AAPL'), getStockPrice('MSFT'), getStockPrice('GOOGL'), getStockPrice('AMZN')]);
    expect(results).toHaveLength(4);
    results.forEach((result) => expect(result).toMatchObject({ price: 101.25 }));
    expect(fetch).toHaveBeenCalledTimes(4);
  });

  it('returns the cached result after the first fetch', async () => {
    const result1 = await getStockPrice('AAPL');
    const result2 = await getStockPrice('AAPL');
    expect(result1).toEqual(result2);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
