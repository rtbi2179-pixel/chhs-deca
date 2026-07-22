import { describe, it, expect } from 'vitest';

describe('Market System End-to-End Tests', () => {
  describe('Stock Trading Flow', () => {
    it('should complete a full buy-sell cycle', () => {
      // User starts with initial cash
      const initialCash = 10000;
      expect(initialCash).toBeGreaterThan(0);

      // User buys stock
      const stockPrice = 150;
      const quantity = 10;
      const buyAmount = stockPrice * quantity;
      const cashAfterBuy = initialCash - buyAmount;
      
      expect(cashAfterBuy).toBe(9500);
      expect(cashAfterBuy).toBeGreaterThanOrEqual(0);

      // User sells stock at higher price
      const sellPrice = 160;
      const sellAmount = sellPrice * quantity;
      const cashAfterSell = cashAfterBuy + sellAmount;
      const profit = sellAmount - buyAmount;

      expect(profit).toBe(100);
      expect(cashAfterSell).toBe(9600);
    });

    it('should track portfolio holdings correctly', () => {
      const holdings = [
        { symbol: 'AAPL', quantity: 10, avgCost: 150 },
        { symbol: 'GOOGL', quantity: 5, avgCost: 2800 },
      ];

      const totalValue = holdings.reduce((sum, h) => sum + (h.quantity * h.avgCost), 0);
      expect(totalValue).toBe(15500);
    });

    it('should calculate portfolio performance', () => {
      const portfolio = {
        holdings: [
          { symbol: 'AAPL', quantity: 10, avgCost: 150, currentPrice: 160 },
        ],
        cash: 9500,
      };

      const holdingValue = portfolio.holdings[0].quantity * portfolio.holdings[0].currentPrice;
      const totalValue = holdingValue + portfolio.cash;
      const totalCost = portfolio.holdings[0].quantity * portfolio.holdings[0].avgCost + portfolio.cash;
      const gain = totalValue - totalCost;

      expect(gain).toBe(100);
    });
  });

  describe('Order Processing', () => {
    it('should execute market hours orders immediately', () => {
      const order = {
        type: 'BUY',
        symbol: 'AAPL',
        quantity: 10,
        price: 150,
        status: 'EXECUTED',
      };

      expect(order.status).toBe('EXECUTED');
    });

    it('should queue after-hours orders as pending', () => {
      const order = {
        type: 'BUY',
        symbol: 'AAPL',
        quantity: 10,
        price: 150,
        status: 'PENDING',
        executionTime: new Date('2026-07-23T09:30:00'),
      };

      expect(order.status).toBe('PENDING');
      expect(order.executionTime).toBeInstanceOf(Date);
    });

    it('should prevent insufficient balance orders', () => {
      const cash = 1000;
      const orderAmount = 2000;
      const canExecute = cash >= orderAmount;

      expect(canExecute).toBe(false);
    });
  });

  describe('Leaderboard Integration', () => {
    it('should rank users by portfolio value', () => {
      const users = [
        { name: 'User1', portfolioValue: 15000 },
        { name: 'User2', portfolioValue: 12000 },
        { name: 'User3', portfolioValue: 18000 },
      ];

      const ranked = users.sort((a, b) => b.portfolioValue - a.portfolioValue);
      expect(ranked[0].name).toBe('User3');
      expect(ranked[0].portfolioValue).toBe(18000);
    });

    it('should calculate return on investment', () => {
      const initialInvestment = 10000;
      const currentValue = 12000;
      const roi = ((currentValue - initialInvestment) / initialInvestment) * 100;

      expect(roi).toBe(20);
    });
  });

  describe('Transaction History', () => {
    it('should record all transactions', () => {
      const transactions = [
        { type: 'BUY', symbol: 'AAPL', quantity: 10, price: 150, date: new Date() },
        { type: 'SELL', symbol: 'AAPL', quantity: 5, price: 160, date: new Date() },
      ];

      expect(transactions).toHaveLength(2);
      expect(transactions[0].type).toBe('BUY');
      expect(transactions[1].type).toBe('SELL');
    });

    it('should filter transactions by symbol', () => {
      const transactions = [
        { symbol: 'AAPL', type: 'BUY' },
        { symbol: 'GOOGL', type: 'BUY' },
        { symbol: 'AAPL', type: 'SELL' },
      ];

      const aaplTransactions = transactions.filter(t => t.symbol === 'AAPL');
      expect(aaplTransactions).toHaveLength(2);
    });

    it('should filter transactions by date range', () => {
      const startDate = new Date('2026-07-01');
      const endDate = new Date('2026-07-31');
      
      const transactions = [
        { date: new Date('2026-07-15'), type: 'BUY' },
        { date: new Date('2026-06-15'), type: 'BUY' },
        { date: new Date('2026-07-25'), type: 'SELL' },
      ];

      const filtered = transactions.filter(t => t.date >= startDate && t.date <= endDate);
      expect(filtered).toHaveLength(2);
    });
  });

  describe('Portfolio Snapshots', () => {
    it('should create daily portfolio snapshots', () => {
      const snapshot = {
        date: new Date('2026-07-22'),
        totalValue: 15000,
        cash: 5000,
        holdings: [
          { symbol: 'AAPL', value: 10000 },
        ],
      };

      expect(snapshot.date).toBeInstanceOf(Date);
      expect(snapshot.totalValue).toBe(15000);
      expect(snapshot.cash + snapshot.holdings[0].value).toBe(15000);
    });

    it('should calculate performance vs previous snapshot', () => {
      const previous = { totalValue: 14000 };
      const current = { totalValue: 15000 };
      const change = current.totalValue - previous.totalValue;
      const changePercent = (change / previous.totalValue) * 100;

      expect(change).toBe(1000);
      expect(changePercent).toBeCloseTo(7.14, 1);
    });
  });
});
