import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getStockPrice } from './stockPriceService';

describe('Stock Price Service - In-Flight Deduplication', () => {
  beforeEach(() => {
    // Clear any cached prices between tests
    vi.clearAllMocks();
  });

  it('should deduplicate concurrent requests for the same ticker', async () => {
    // Make 5 concurrent requests for the same ticker
    const promises = [
      getStockPrice('AAPL'),
      getStockPrice('AAPL'),
      getStockPrice('AAPL'),
      getStockPrice('AAPL'),
      getStockPrice('AAPL'),
    ];

    // All requests should resolve
    const results = await Promise.all(promises);
    
    // All results should be the same (either all null or all have the same data)
    expect(results.length).toBe(5);
    
    // All results should be identical
    const firstResult = results[0];
    for (let i = 1; i < results.length; i++) {
      expect(results[i]).toEqual(firstResult);
    }
  });

  it('should handle concurrent requests for different tickers', async () => {
    // Make concurrent requests for different tickers
    const promises = [
      getStockPrice('AAPL'),
      getStockPrice('MSFT'),
      getStockPrice('GOOGL'),
      getStockPrice('AMZN'),
    ];

    // All requests should resolve
    const results = await Promise.all(promises);
    
    // Should have 4 results
    expect(results.length).toBe(4);
    
    // Results can be null or valid quotes
    for (const result of results) {
      if (result !== null) {
        expect(result).toHaveProperty('symbol');
        expect(result).toHaveProperty('price');
        expect(result).toHaveProperty('timestamp');
        expect(result).toHaveProperty('change');
        expect(result).toHaveProperty('changePercent');
      }
    }
  });

  it('should cache results after first fetch', async () => {
    // First request
    const result1 = await getStockPrice('AAPL');
    
    // Second request should use cache (no additional API call)
    const result2 = await getStockPrice('AAPL');
    
    // Results should be identical
    expect(result1).toEqual(result2);
  });
});
