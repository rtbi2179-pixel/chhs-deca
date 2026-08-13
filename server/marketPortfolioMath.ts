export type HoldingBalance = { shares: number; averageBuyPrice: number; totalInvested: number };

export function applyPortfolioPurchase(current: HoldingBalance | null, sharesPurchased: number, pricePerShare: number) {
  if (!Number.isFinite(sharesPurchased) || sharesPurchased <= 0 || !Number.isFinite(pricePerShare) || pricePerShare <= 0) {
    throw new Error("Purchase shares and price must be positive numbers");
  }
  const existing = current ?? { shares: 0, averageBuyPrice: 0, totalInvested: 0 };
  const totalInvested = existing.totalInvested + sharesPurchased * pricePerShare;
  const shares = existing.shares + sharesPurchased;
  return { shares, totalInvested, averageBuyPrice: totalInvested / shares };
}

export function applyPortfolioSale(current: HoldingBalance, sharesSold: number) {
  if (!Number.isFinite(sharesSold) || sharesSold <= 0) throw new Error("Sale shares must be a positive number");
  if (sharesSold > current.shares + 1e-9) throw new Error("Insufficient shares to sell");
  const shares = Math.max(0, current.shares - sharesSold);
  const totalInvested = shares === 0 ? 0 : current.totalInvested * (shares / current.shares);
  return { shares, totalInvested, averageBuyPrice: current.averageBuyPrice, closed: shares === 0 };
}

export function calculatePortfolioSnapshot(input: { cashBalance: number; initialAllocation: number; totalInvested: number }) {
  const totalValue = input.cashBalance + input.totalInvested;
  const totalProfit = totalValue - input.initialAllocation;
  return {
    totalValue,
    totalProfit,
    percentageReturn: input.initialAllocation > 0 ? (totalProfit / input.initialAllocation) * 100 : 0,
  };
}
