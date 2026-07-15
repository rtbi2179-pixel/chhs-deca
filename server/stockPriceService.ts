import { ENV } from './_core/env';

const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

// In-memory cache for stock prices (5 minute TTL)
const priceCache = new Map<string, { data: StockQuote | null; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// In-flight requests to deduplicate concurrent requests for the same ticker
const inFlightRequests = new Map<string, Promise<StockQuote | null>>();

// Request queue to throttle API calls
let requestQueue: Promise<void> = Promise.resolve();
const REQUEST_DELAY = 300; // 300ms between requests to respect rate limits

interface StockQuote {
  symbol: string;
  price: number;
  timestamp: Date;
  change: number;
  changePercent: number;
}

/**
 * Get cached price if still valid
 */
function getCachedPrice(ticker: string): StockQuote | null | undefined {
  const cached = priceCache.get(ticker);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return undefined;
}

/**
 * Fetch current stock price from Alpha Vantage API
 * Uses 15-minute delayed data (free tier)
 * Implements caching, request throttling, and in-flight deduplication
 */
export async function getStockPrice(ticker: string): Promise<StockQuote | null> {
  // Check cache first
  const cached = getCachedPrice(ticker);
  if (cached !== undefined) {
    return cached;
  }
  
  // Check if this request is already in-flight (deduplication)
  const inFlight = inFlightRequests.get(ticker);
  if (inFlight) {
    console.log(`[Stock Price Service] Reusing in-flight request for ${ticker}`);
    return inFlight;
  }
  
  try {
    // Create the promise for this request
    const promise = new Promise<StockQuote | null>(resolve => {
      requestQueue = requestQueue.then(async () => {
        const apiKey = ENV.ALPHA_VANTAGE_API_KEY;
        if (!apiKey) {
          console.warn('[Stock Price Service] Alpha Vantage API key not configured');
          resolve(null);
          await new Promise(r => setTimeout(r, REQUEST_DELAY));
          return;
        }

        try {
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
            resolve(null);
            await new Promise(r => setTimeout(r, REQUEST_DELAY));
            return;
          }

          const data = await response.json();

          // Check for API errors
          if (data['Error Message'] || data['Note']) {
            console.warn(`[Stock Price Service] API response: ${data['Error Message'] || data['Note']}`);
            resolve(null);
            await new Promise(r => setTimeout(r, REQUEST_DELAY));
            return;
          }

          const quote = data['Global Quote'];
          if (!quote || !quote['05. price']) {
            console.warn(`[Stock Price Service] No quote data for ${ticker}`);
            resolve(null);
            await new Promise(r => setTimeout(r, REQUEST_DELAY));
            return;
          }

          const result: StockQuote = {
            symbol: ticker,
            price: parseFloat(quote['05. price']),
            timestamp: new Date(),
            change: parseFloat(quote['09. change'] || '0'),
            changePercent: parseFloat(quote['10. change percent'] || '0'),
          };

          // Cache the result
          priceCache.set(ticker, { data: result, timestamp: Date.now() });
          resolve(result);
          await new Promise(r => setTimeout(r, REQUEST_DELAY));
        } catch (error) {
          console.error('[Stock Price Service] Error fetching stock price:', error);
          resolve(null);
          await new Promise(r => setTimeout(r, REQUEST_DELAY));
        }
      });
    });
    
    // Store the in-flight request
    inFlightRequests.set(ticker, promise);
    
    // Wait for the result and clean up
    const result = await promise;
    inFlightRequests.delete(ticker);
    
    return result;
  } catch (error) {
    console.error('[Stock Price Service] Error fetching stock price:', error);
    inFlightRequests.delete(ticker);
    return null;
  }
}

/**
 * Fetch multiple stock prices in batch
 * Uses cache and request throttling to respect rate limits
 */
export async function getStockPrices(tickers: string[]): Promise<StockQuote[]> {
  const results: StockQuote[] = [];

  // Fetch all prices (will be throttled by request queue)
  const promises = tickers.map(ticker => getStockPrice(ticker));
  const quotes = await Promise.all(promises);
  
  for (const quote of quotes) {
    if (quote) {
      results.push(quote);
    }
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
