export type CreditCardBalanceState = {
  creditLimit: number;
  currentBalance: number;
};

export type CreditCardBalanceUpdate = CreditCardBalanceState & {
  availableCredit: number;
  utilizationRate: number;
};

function currency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function getCreditCardBalanceUpdate({ creditLimit, currentBalance }: CreditCardBalanceState): CreditCardBalanceUpdate {
  const availableCredit = currency(Math.max(0, creditLimit - currentBalance));
  return {
    creditLimit: currency(creditLimit),
    currentBalance: currency(currentBalance),
    availableCredit,
    utilizationRate: creditLimit > 0 ? currency((currentBalance / creditLimit) * 100) : 0,
  };
}

export function applyCreditCardCharge(state: CreditCardBalanceState, amount: number): CreditCardBalanceUpdate {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new RangeError("Charge amount must be greater than zero.");
  }

  const availableCredit = state.creditLimit - state.currentBalance;
  if (amount > availableCredit) {
    throw new RangeError("Charge exceeds available credit.");
  }

  return getCreditCardBalanceUpdate({
    creditLimit: state.creditLimit,
    currentBalance: currency(state.currentBalance + amount),
  });
}

export function applyCreditCardPayment(state: CreditCardBalanceState, amount: number): CreditCardBalanceUpdate {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new RangeError("Payment amount must be greater than zero.");
  }
  if (amount > state.currentBalance) {
    throw new RangeError("Payment exceeds the current card balance.");
  }

  return getCreditCardBalanceUpdate({
    creditLimit: state.creditLimit,
    currentBalance: currency(state.currentBalance - amount),
  });
}

export function calculateCashback(amount: number, rewardsPercentage: number): number {
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(rewardsPercentage) || rewardsPercentage < 0) {
    throw new RangeError("Cashback requires a positive purchase amount and a non-negative reward percentage.");
  }
  return currency((amount * rewardsPercentage) / 100);
}

export type SpendingRecord = {
  amount: number;
  category: string;
  occurredAt: Date;
};

export function summarizeSpending(records: SpendingRecord[]) {
  const categoryTotals = new Map<string, { total: number; transactions: number }>();
  const monthlyTotals = new Map<string, number>();

  for (const record of records) {
    const category = record.category.trim() || "Other";
    const currentCategory = categoryTotals.get(category) ?? { total: 0, transactions: 0 };
    categoryTotals.set(category, {
      total: currency(currentCategory.total + record.amount),
      transactions: currentCategory.transactions + 1,
    });

    const month = `${record.occurredAt.getUTCFullYear()}-${String(record.occurredAt.getUTCMonth() + 1).padStart(2, "0")}`;
    monthlyTotals.set(month, currency((monthlyTotals.get(month) ?? 0) + record.amount));
  }

  return {
    categories: Array.from(categoryTotals, ([category, value]) => ({
      category,
      total: value.total,
      transactions: value.transactions,
      average: currency(value.total / value.transactions),
    })).sort((left, right) => right.total - left.total),
    monthly: Array.from(monthlyTotals, ([month, total]) => ({ month, total })).sort((left, right) =>
      left.month.localeCompare(right.month),
    ),
  };
}
