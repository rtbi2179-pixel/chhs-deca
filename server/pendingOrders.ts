import { getDb } from './db'
import { pendingOrders, marketTransactions, portfolioCash, portfolioHoldings } from '../drizzle/schema'
import { eq, and } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'

export async function createPendingOrder(
  userId: number,
  stockId: number,
  type: 'buy' | 'sell',
  blueBucksAmount: string | null,
  shares: string | null,
  schoolCode: string
): Promise<{ id: number }> {
  const db = await getDb()
  if (!db) throw new Error('Database not initialized')

  if (type === 'buy' && !blueBucksAmount) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Buy orders require blueBucksAmount' })
  }
  if (type === 'sell' && !shares) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Sell orders require shares' })
  }

  const result = await db.insert(pendingOrders).values({
    userId,
    stockId,
    type,
    blueBucksAmount: blueBucksAmount || '0',
    shares: shares || null,
    status: 'pending',
    schoolCode,
  })

  return { id: result[0].insertId as number }
}

export async function getPendingOrders(userId: number, schoolCode: string) {
  const db = await getDb()
  if (!db) throw new Error('Database not initialized')

  return await db
    .select()
    .from(pendingOrders)
    .where(
      and(
        eq(pendingOrders.userId, userId),
        eq(pendingOrders.schoolCode, schoolCode),
        eq(pendingOrders.status, 'pending')
      )
    )
}

export async function executePendingOrder(
  orderId: number,
  pricePerShare: string,
  schoolCode: string
): Promise<void> {
  const db = await getDb()
  if (!db) throw new Error('Database not initialized')

  const order = await db
    .select()
    .from(pendingOrders)
    .where(eq(pendingOrders.id, orderId))
    .limit(1)

  if (!order[0]) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' })
  }

  if (order[0].status !== 'pending') {
    throw new TRPCError({ code: 'CONFLICT', message: 'Order already executed or cancelled' })
  }

  // Record market transaction
  const sharesAmount = order[0].type === 'buy'
    ? (parseFloat(order[0].blueBucksAmount) / parseFloat(pricePerShare)).toString()
    : order[0].shares

  const totalAmount = order[0].type === "buy"
    ? order[0].blueBucksAmount
    : (parseFloat(sharesAmount || "0") * parseFloat(pricePerShare)).toString()

  await db.insert(marketTransactions).values({
    userId: order[0].userId,
    stockId: order[0].stockId,
    type: order[0].type,
    shares: sharesAmount || "0",
    pricePerShare,
    totalAmount,
    schoolCode,
  })

  // Update portfolio
  if (order[0].type === 'buy') {
    // Get current cash balance
    const cashRecord = await db
      .select()
      .from(portfolioCash)
      .where(
        and(
          eq(portfolioCash.userId, order[0].userId),
          eq(portfolioCash.schoolCode, schoolCode)
        )
      )
      .limit(1)

    const currentCash = cashRecord.length > 0 ? parseFloat(cashRecord[0].cashBalance) : 0
    const newCash = currentCash - parseFloat(order[0].blueBucksAmount)

    if (newCash < 0) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Insufficient funds' })
    }

    // Update portfolio holding
    const holding = await db
      .select()
      .from(portfolioHoldings)
      .where(
        and(
          eq(portfolioHoldings.userId, order[0].userId),
          eq(portfolioHoldings.stockId, order[0].stockId),
          eq(portfolioHoldings.schoolCode, schoolCode)
        )
      )
      .limit(1)

    if (holding.length > 0) {
      const currentShares = parseFloat(holding[0].shares)
      const newShares = currentShares + parseFloat(sharesAmount || '0')
      await db
        .update(portfolioHoldings)
        .set({ shares: newShares.toString() })
        .where(eq(portfolioHoldings.id, holding[0].id))
    } else {
      await db.insert(portfolioHoldings).values({
        userId: order[0].userId,
        stockId: order[0].stockId,
        shares: sharesAmount || '0',
        averageBuyPrice: pricePerShare,
        totalInvested: (parseFloat(sharesAmount || '0') * parseFloat(pricePerShare)).toString(),
        schoolCode,
      })
    }

    // Update cash balance
    if (cashRecord.length > 0) {
      await db
        .update(portfolioCash)
        .set({ cashBalance: newCash.toString() })
        .where(eq(portfolioCash.id, cashRecord[0].id))
    } else {
      await db.insert(portfolioCash).values({
        userId: order[0].userId,
        cashBalance: newCash.toString(),
        schoolCode,
      })
    }
  } else {
    // Sell order - add to cash balance
    const totalAmount = (parseFloat(sharesAmount || '0') * parseFloat(pricePerShare)).toString()
    const cashRecord = await db
      .select()
      .from(portfolioCash)
      .where(
        and(
          eq(portfolioCash.userId, order[0].userId),
          eq(portfolioCash.schoolCode, schoolCode)
        )
      )
      .limit(1)

    const currentCash = cashRecord.length > 0 ? parseFloat(cashRecord[0].cashBalance) : 0
    const newCash = currentCash + parseFloat(totalAmount)

    if (cashRecord.length > 0) {
      await db
        .update(portfolioCash)
        .set({ cashBalance: newCash.toString() })
        .where(eq(portfolioCash.id, cashRecord[0].id))
    } else {
      await db.insert(portfolioCash).values({
        userId: order[0].userId,
        cashBalance: newCash.toString(),
        schoolCode,
      })
    }

    // Update portfolio holding
    const holding = await db
      .select()
      .from(portfolioHoldings)
      .where(
        and(
          eq(portfolioHoldings.userId, order[0].userId),
          eq(portfolioHoldings.stockId, order[0].stockId),
          eq(portfolioHoldings.schoolCode, schoolCode)
        )
      )
      .limit(1)

    if (holding.length > 0) {
      const currentShares = parseFloat(holding[0].shares)
      const newShares = currentShares - parseFloat(sharesAmount || '0')
      if (newShares > 0) {
        await db
          .update(portfolioHoldings)
          .set({ shares: newShares.toString() })
          .where(eq(portfolioHoldings.id, holding[0].id))
      }
    }
  }

  // Mark order as executed
  await db
    .update(pendingOrders)
    .set({ status: 'executed', executedAt: new Date() })
    .where(eq(pendingOrders.id, orderId))
}

export async function cancelPendingOrder(orderId: number): Promise<void> {
  const db = await getDb()
  if (!db) throw new Error('Database not initialized')

  const order = await db
    .select()
    .from(pendingOrders)
    .where(eq(pendingOrders.id, orderId))
    .limit(1)

  if (!order[0]) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' })
  }

  if (order[0].status !== 'pending') {
    throw new TRPCError({ code: 'CONFLICT', message: 'Only pending orders can be cancelled' })
  }

  await db
    .update(pendingOrders)
    .set({ status: 'cancelled' })
    .where(eq(pendingOrders.id, orderId))
}
