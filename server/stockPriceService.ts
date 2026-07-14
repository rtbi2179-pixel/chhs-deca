import { ENV } from './_core/env';

const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

interface StockQuote {
  symbol: string;
  price: number;
  timestamp: Date;
  change: number;
  changePercent: number;
}

/**
 * Fetch current stock price from Alpha Vantage API
 * Uses 15-minute delayed data (free tier)
 */
export async function getStockPrice(ticker: string): Promise<StockQuote | null> {
  try {
    const apiKey = ENV.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) {
      console.warn('[Stock Price Service] Alpha Vantage API key not configured');
      return null;
    }

    const url = new URL(ALPHA_VANTAGE_BASE_URL);
    url.searchParams.append('function', 'GLOBAL_QUOTE');
    url.searchParams.append('symbol', ticker);
    url.searchParams.append('apikey', apiKey);

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'CHHS-DECA-BlueMarket/1.0',
      },
    });

    if (!response.ok) {
      console.error(`[Stock Price Service] API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Check for API errors
    if (data['Error Message'] || data['Note']) {
      console.warn(`[Stock Price Service] API response: ${data['Error Message'] || data['Note']}`);
      return null;
    }

    const quote = data['Global Quote'];
    if (!quote || !quote['05. price']) {
      console.warn(`[Stock Price Service] No quote data for ${ticker}`);
      return null;
    }

    return {
      symbol: ticker,
      price: parseFloat(quote['05. price']),
      timestamp: new Date(),
      change: parseFloat(quote['09. change'] || '0'),
      changePercent: parseFloat(quote['10. change percent'] || '0'),
    };
  } catch (error) {
    console.error('[Stock Price Service] Error fetching stock price:', error);
    return null;
  }
}

/**
 * Fetch multiple stock prices in batch
 */
export async function getStockPrices(tickers: string[]): Promise<StockQuote[]> {
  const results: StockQuote[] = [];

  // Alpha Vantage free tier has rate limits (5 requests per minute)
  // Process sequentially with delays
  for (const ticker of tickers) {
    const quote = await getStockPrice(ticker);
    if (quote) {
      results.push(quote);
    }
    // Add delay between requests to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return results;
}

/**
 * Test connection to Alpha Vantage API
 */
export async function testAlphaVantageConnection(): Promise<boolean> {
  try {
    const apiKey = ENV.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) {
      console.warn('[Stock Price Service] Alpha Vantage API key not configured');
      return false;
    }

    // Test with a well-known ticker
    const quote = await getStockPrice('AAPL');
    return quote !== null;
  } catch (error) {
    console.error('[Stock Price Service] Connection test failed:', error);
    return false;
  }
}
