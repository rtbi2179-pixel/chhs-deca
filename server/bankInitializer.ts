import { getDb } from './db'
import { banks, creditCards } from '../drizzle/schema'
import { eq } from 'drizzle-orm'

const DEFAULT_BANKS = [
  {
    name: 'Blue Horizon',
    focus: 'Student-Friendly Banking',
    description: 'Low fees, high rewards. Perfect for students just starting their financial journey.',
  },
  {
    name: 'Summit Financial',
    focus: 'Premium Services',
    description: 'Exclusive benefits and high limits. For those aiming for the top.',
  },
  {
    name: 'Apex Bank',
    focus: 'Investment Focus',
    description: 'Market integration and wealth building. Grow your portfolio with us.',
  },
]

const DEFAULT_CARD_TIERS = [
  // Blue Horizon
  {
    bankIndex: 0,
    tier: 'starter' as const,
    name: 'Blue Horizon Starter',
    creditScoreRequired: 500,
    rewardsPercentage: 1.0,
    interestRate: 8.0,
    annualFee: 0,
  },
  {
    bankIndex: 0,
    tier: 'rewards' as const,
    name: 'Blue Horizon Rewards',
    creditScoreRequired: 650,
    rewardsPercentage: 3.0,
    interestRate: 6.0,
    annualFee: 25,
  },
  {
    bankIndex: 0,
    tier: 'elite' as const,
    name: 'Blue Horizon Elite',
    creditScoreRequired: 750,
    rewardsPercentage: 5.0,
    interestRate: 4.0,
    annualFee: 95,
  },
  // Summit Financial
  {
    bankIndex: 1,
    tier: 'starter' as const,
    name: 'Summit Starter',
    creditScoreRequired: 500,
    rewardsPercentage: 1.5,
    interestRate: 7.5,
    annualFee: 0,
  },
  {
    bankIndex: 1,
    tier: 'rewards' as const,
    name: 'Summit Rewards',
    creditScoreRequired: 650,
    rewardsPercentage: 3.5,
    interestRate: 5.5,
    annualFee: 35,
  },
  {
    bankIndex: 1,
    tier: 'elite' as const,
    name: 'Summit Elite',
    creditScoreRequired: 750,
    rewardsPercentage: 6.0,
    interestRate: 3.5,
    annualFee: 125,
  },
  // Apex Bank
  {
    bankIndex: 2,
    tier: 'starter' as const,
    name: 'Apex Starter',
    creditScoreRequired: 500,
    rewardsPercentage: 2.0,
    interestRate: 7.0,
    annualFee: 0,
  },
  {
    bankIndex: 2,
    tier: 'rewards' as const,
    name: 'Apex Rewards',
    creditScoreRequired: 650,
    rewardsPercentage: 4.0,
    interestRate: 5.0,
    annualFee: 45,
  },
  {
    bankIndex: 2,
    tier: 'elite' as const,
    name: 'Apex Elite',
    creditScoreRequired: 750,
    rewardsPercentage: 7.0,
    interestRate: 3.0,
    annualFee: 150,
  },
]

export async function initializeBanksForSchool(schoolCode: string): Promise<void> {
  const db = await getDb()
  if (!db) throw new Error('Database not initialized')

  // Check if banks already exist for this school
  const existingBanks = await db
    .select()
    .from(banks)
    .where(eq(banks.schoolCode, schoolCode))

  if (existingBanks.length > 0) {
    // Banks already initialized for this school
    return
  }

  // Create banks
  const createdBanks = []
  for (const bank of DEFAULT_BANKS) {
    const result = await db.insert(banks).values({
      name: bank.name,
      focus: bank.focus,
      description: bank.description,
      schoolCode,
    })
    createdBanks.push(result[0].insertId)
  }

  // Create credit cards for each bank
  for (const tier of DEFAULT_CARD_TIERS) {
    const bankId = createdBanks[tier.bankIndex]
    await db.insert(creditCards).values({
      bankId: Number(bankId),
      tier: tier.tier,
      name: tier.name,
      creditScoreRequired: tier.creditScoreRequired,
      rewardsPercentage: tier.rewardsPercentage.toString(),
      interestRate: tier.interestRate.toString(),
      annualFee: tier.annualFee.toString(),
      schoolCode,
    })
  }
}

export async function getBanksForSchool(schoolCode: string) {
  const db = await getDb()
  if (!db) throw new Error('Database not initialized')
  
  // Initialize if needed
  await initializeBanksForSchool(schoolCode)
  
  // Fetch banks with their credit cards
  const banksData = await db
    .select()
    .from(banks)
    .where(eq(banks.schoolCode, schoolCode))

  return banksData
}

export async function getCreditCardsForBank(bankId: number) {
  const db = await getDb()
  if (!db) throw new Error('Database not initialized')
  return await db
    .select()
    .from(creditCards)
    .where(eq(creditCards.bankId, bankId))
}
