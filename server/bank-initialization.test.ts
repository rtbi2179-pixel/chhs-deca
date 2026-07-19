import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { initializeBanksForSchool, getBanksForSchool, getCreditCardsForBank } from './bankInitializer'
import { getDb } from './db'
import { banks, creditCards } from '../drizzle/schema'
import { eq } from 'drizzle-orm'

describe('Bank Initialization', () => {
  const testSchoolCode = 'TEST-SCHOOL-' + Date.now()
  
  afterAll(async () => {
    // Cleanup test data
    const db = await getDb()
    if (db) {
      await db.delete(creditCards).where(eq(creditCards.schoolCode, testSchoolCode))
      await db.delete(banks).where(eq(banks.schoolCode, testSchoolCode))
    }
  })

  it('should initialize banks for a new school code', async () => {
    await initializeBanksForSchool(testSchoolCode)
    const banksData = await getBanksForSchool(testSchoolCode)
    
    expect(banksData).toHaveLength(3)
    expect(banksData[0].name).toBe('Blue Horizon')
    expect(banksData[1].name).toBe('Summit Financial')
    expect(banksData[2].name).toBe('Apex Bank')
  })

  it('should not duplicate banks on multiple initializations', async () => {
    await initializeBanksForSchool(testSchoolCode)
    const firstCall = await getBanksForSchool(testSchoolCode)
    
    await initializeBanksForSchool(testSchoolCode)
    const secondCall = await getBanksForSchool(testSchoolCode)
    
    expect(firstCall).toHaveLength(secondCall.length)
  })

  it('should create credit cards for each bank', async () => {
    await initializeBanksForSchool(testSchoolCode)
    const banksData = await getBanksForSchool(testSchoolCode)
    
    for (const bank of banksData) {
      const cards = await getCreditCardsForBank(bank.id)
      expect(cards.length).toBeGreaterThan(0)
      expect(cards).toContainEqual(
        expect.objectContaining({
          bankId: bank.id,
          tier: expect.stringMatching(/starter|rewards|elite/),
        })
      )
    }
  })

  it('should have correct credit card tiers', async () => {
    await initializeBanksForSchool(testSchoolCode)
    const banksData = await getBanksForSchool(testSchoolCode)
    const firstBank = banksData[0]
    
    const cards = await getCreditCardsForBank(firstBank.id)
    const tiers = cards.map(c => c.tier).sort()
    
    expect(tiers).toEqual(['elite', 'rewards', 'starter'])
  })

  it('should have increasing credit score requirements', async () => {
    await initializeBanksForSchool(testSchoolCode)
    const banksData = await getBanksForSchool(testSchoolCode)
    const firstBank = banksData[0]
    
    const cards = await getCreditCardsForBank(firstBank.id)
    const sorted = cards.sort((a, b) => a.creditScoreRequired - b.creditScoreRequired)
    
    expect(sorted[0].creditScoreRequired).toBe(500)
    expect(sorted[1].creditScoreRequired).toBe(650)
    expect(sorted[2].creditScoreRequired).toBe(750)
  })

  it('should have increasing rewards percentages', async () => {
    await initializeBanksForSchool(testSchoolCode)
    const banksData = await getBanksForSchool(testSchoolCode)
    const firstBank = banksData[0]
    
    const cards = await getCreditCardsForBank(firstBank.id)
    const sorted = cards.sort((a, b) => 
      parseFloat(a.rewardsPercentage as string) - parseFloat(b.rewardsPercentage as string)
    )
    
    expect(parseFloat(sorted[0].rewardsPercentage as string)).toBe(1.0)
    expect(parseFloat(sorted[1].rewardsPercentage as string)).toBe(3.0)
    expect(parseFloat(sorted[2].rewardsPercentage as string)).toBe(5.0)
  })

  it('should have decreasing interest rates', async () => {
    await initializeBanksForSchool(testSchoolCode)
    const banksData = await getBanksForSchool(testSchoolCode)
    const firstBank = banksData[0]
    
    const cards = await getCreditCardsForBank(firstBank.id)
    const sorted = cards.sort((a, b) => 
      parseFloat(b.interestRate as string) - parseFloat(a.interestRate as string)
    )
    
    expect(parseFloat(sorted[0].interestRate as string)).toBe(8.0)
    expect(parseFloat(sorted[1].interestRate as string)).toBe(6.0)
    expect(parseFloat(sorted[2].interestRate as string)).toBe(4.0)
  })

  it('should have correct annual fees', async () => {
    await initializeBanksForSchool(testSchoolCode)
    const banksData = await getBanksForSchool(testSchoolCode)
    const firstBank = banksData[0]
    
    const cards = await getCreditCardsForBank(firstBank.id)
    const starter = cards.find(c => c.tier === 'starter')
    const rewards = cards.find(c => c.tier === 'rewards')
    const elite = cards.find(c => c.tier === 'elite')
    
    expect(parseFloat(starter?.annualFee as string)).toBe(0)
    expect(parseFloat(rewards?.annualFee as string)).toBeGreaterThan(0)
    expect(parseFloat(elite?.annualFee as string)).toBeGreaterThan(parseFloat(rewards?.annualFee as string))
  })

  it('should store schoolCode correctly', async () => {
    await initializeBanksForSchool(testSchoolCode)
    const banksData = await getBanksForSchool(testSchoolCode)
    
    for (const bank of banksData) {
      expect(bank.schoolCode).toBe(testSchoolCode)
      
      const cards = await getCreditCardsForBank(bank.id)
      for (const card of cards) {
        expect(card.schoolCode).toBe(testSchoolCode)
      }
    }
  })
})
