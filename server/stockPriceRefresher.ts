import { getStockPrice } from './stockPriceService';

// List of stocks to refresh
const DEFAULT_STOCKS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'V', 'WMT'];

// Track when we last refreshed
let lastRefreshTime = 0;
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Proactively refresh all stock prices
 * This ensures prices are always fresh in the cache
 * Runs once per 5 minutes regardless of user activity
 */
export async function refreshStockPrices(): Promise<void> {
  const now = Date.now();
  
  // Only refresh if enough time has passed
  if (now - lastRefreshTime < REFRESH_INTERVAL) {
    return;
  }
  
  lastRefreshTime = now;
  
  console.log('[Stock Price Refresher] Starting price refresh...');
  
  try {
    // Fetch all stock prices in sequence (respects rate limiting)
    const promises = DEFAULT_STOCKS.map(ticker => 
      getStockPrice(ticker)
        .catch(error => {
          console.error(`[Stock Price Refresher] Error fetching ${ticker}:`, error);
          return null;
        })
    );
    
    const results = await Promise.all(promises);
    const successCount = results.filter(r => r !== null).length;
    
    console.log(`[Stock Price Refresher] Refreshed ${successCount}/${DEFAULT_STOCKS.length} stocks`);
  } catch (error) {
    console.error('[Stock Price Refresher] Error during refresh:', error);
  }
}

/**
 * Initialize background refresh job
 * Call this once when the server starts
 */
export function initializeStockPriceRefresher(): void {
  console.log('[Stock Price Refresher] Initializing...');
  
  // Refresh immediately on startup
  refreshStockPrices().catch(error => {
    console.error('[Stock Price Refresher] Initial refresh failed:', error);
  });
  
  // Then refresh every 5 minutes
  setInterval(() => {
    refreshStockPrices().catch(error => {
      console.error('[Stock Price Refresher] Scheduled refresh failed:', error);
    });
  }, REFRESH_INTERVAL);
}
