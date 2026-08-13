import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, date, unique, uniqueIndex, primaryKey } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(),
  username: varchar("username", { length: 255 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  schoolCode: varchar("schoolCode", { length: 50 }),
  firstName: varchar("firstName", { length: 100 }),
  lastName: varchar("lastName", { length: 100 }),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }).default("custom"),
  role: mysqlEnum("role", ["user", "admin", "super_admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  emailVerificationToken: varchar("emailVerificationToken", { length: 255 }),
  emailVerificationExpiresAt: timestamp("emailVerificationExpiresAt"),
  twoFactorEnabled: boolean("twoFactorEnabled").default(false).notNull(),
  twoFactorCode: varchar("twoFactorCode", { length: 6 }),
  twoFactorExpiresAt: timestamp("twoFactorExpiresAt"),
  passwordResetToken: varchar("passwordResetToken", { length: 255 }),
  passwordResetExpiresAt: timestamp("passwordResetExpiresAt"),
  adminPromotedAt: timestamp("adminPromotedAt"),
  selectedSchoolCode: varchar("selectedSchoolCode", { length: 50 }), // For super admins to select which school they're managing
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Volunteer opportunities and sign-ups
 */
export const volunteerOpportunities = mysqlTable("volunteerOpportunities", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  spotsAvailable: int("spotsAvailable").default(10).notNull(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type VolunteerOpportunity = typeof volunteerOpportunities.$inferSelect;
export type InsertVolunteerOpportunity = typeof volunteerOpportunities.$inferInsert;
export const volunteerSignups = mysqlTable("volunteerSignups", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  opportunityId: int("opportunityId").notNull(),
  status: mysqlEnum("status", ["signed_up", "confirmed", "completed", "cancelled"]).default("signed_up").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type VolunteerSignup = typeof volunteerSignups.$inferSelect;
export type InsertVolunteerSignup = typeof volunteerSignups.$inferInsert;
/**
 * Discussion threads and replies
 */
export const discussionThreads = mysqlTable("discussionThreads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 50 }).default("general").notNull(),
  discussionType: mysqlEnum("discussionType", ["universal", "chapter"]).default("universal").notNull(),
  schoolCode: varchar("schoolCode", { length: 50 }),
  views: int("views").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DiscussionThread = typeof discussionThreads.$inferSelect;
export type InsertDiscussionThread = typeof discussionThreads.$inferInsert;
export const discussionReplies = mysqlTable("discussionReplies", {
  id: int("id").autoincrement().primaryKey(),
  threadId: int("threadId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  likes: int("likes").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DiscussionReply = typeof discussionReplies.$inferSelect;
export type InsertDiscussionReply = typeof discussionReplies.$inferInsert;
export const questions = mysqlTable("questions", {
  id: varchar("id", { length: 50 }).primaryKey(),
  cluster: varchar("cluster", { length: 255 }).notNull(),
  instructionalArea: varchar("instructional_area", { length: 255 }).notNull(),
  performanceIndicatorFocus: varchar("performance_indicator_focus", { length: 500 }),
  cognitiveLevel: varchar("cognitive_level", { length: 100 }),
  difficulty: varchar("difficulty", { length: 50 }).notNull(),
  stem: text("stem").notNull(),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(),
  optionC: text("option_c").notNull(),
  optionD: text("option_d").notNull(),
  correctAnswer: varchar("correct_answer", { length: 1 }).notNull(),
  rationale: text("rationale"),
  distractorRationaleA: text("distractor_rationale_a"),
  distractorRationaleB: text("distractor_rationale_b"),
  distractorRationaleC: text("distractor_rationale_c"),
  distractorRationaleD: text("distractor_rationale_d"),
  conceptTag: varchar("concept_tag", { length: 255 }),
  sourceStatus: text("source_status"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = typeof questions.$inferInsert;
/**
 * Bookmarked questions for study
 */
export const bookmarks = mysqlTable("bookmarks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  questionId: varchar("questionId", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = typeof bookmarks.$inferInsert;
/**
 * Study sessions created from bookmarks
 */
export const studySessions = mysqlTable("studySessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  cluster: varchar("cluster", { length: 255 }),
  difficulty: varchar("difficulty", { length: 50 }),
  totalQuestions: int("totalQuestions").notNull(),
  questionsAnswered: int("questionsAnswered").default(0).notNull(),
  correctAnswers: int("correctAnswers").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type StudySession = typeof studySessions.$inferSelect;
export type InsertStudySession = typeof studySessions.$inferInsert;
/**
 * Questions included in study sessions
 */
export const sessionQuestions = mysqlTable("sessionQuestions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  questionId: varchar("questionId", { length: 50 }).notNull(),
  userAnswer: varchar("userAnswer", { length: 1 }),
  isCorrect: int("isCorrect").default(0).notNull(), // 0 or 1 (boolean)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SessionQuestion = typeof sessionQuestions.$inferSelect;
export type InsertSessionQuestion = typeof sessionQuestions.$inferInsert;
/**
 * Leaderboard data (aggregated performance metrics)
 */
export const leaderboard = mysqlTable("leaderboard", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  totalQuestionsAnswered: int("totalQuestionsAnswered").default(0).notNull(),
  totalCorrectAnswers: int("totalCorrectAnswers").default(0).notNull(),
  accuracyPercentage: int("accuracyPercentage").default(0).notNull(), // 0-100
  marketingScore: int("marketingScore").default(0).notNull(),
  businessManagementScore: int("businessManagementScore").default(0).notNull(),
  financeScore: int("financeScore").default(0).notNull(),
  hospitalityScore: int("hospitalityScore").default(0).notNull(),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
});
export type Leaderboard = typeof leaderboard.$inferSelect;
export type InsertLeaderboard = typeof leaderboard.$inferInsert;
/**
 * School codes whitelist for signup validation
 */
export const schoolCodes = mysqlTable("schoolCodes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  schoolName: varchar("schoolName", { length: 255 }).notNull(),
  isActive: int("isActive").default(1).notNull(), // 0 or 1 (boolean)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SchoolCode = typeof schoolCodes.$inferSelect;
export type InsertSchoolCode = typeof schoolCodes.$inferInsert;
/**
 * Email blacklist for failed signup attempts
 */
export const emailBlacklist = mysqlTable("emailBlacklist", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  reason: varchar("reason", { length: 255 }).notNull(), // "school_code_attempts_exceeded"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type EmailBlacklist = typeof emailBlacklist.$inferSelect;
export type InsertEmailBlacklist = typeof emailBlacklist.$inferInsert;
/**
 * School code attempt tracking
 */
export const schoolCodeAttempts = mysqlTable("schoolCodeAttempts", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  attemptCount: int("attemptCount").default(0).notNull(),
  lastAttemptAt: timestamp("lastAttemptAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SchoolCodeAttempt = typeof schoolCodeAttempts.$inferSelect;
export type InsertSchoolCodeAttempt = typeof schoolCodeAttempts.$inferInsert;
/**
 * Rate limiting for IP addresses
 */
export const ipRateLimits = mysqlTable("ipRateLimits", {
  id: int("id").autoincrement().primaryKey(),
  ipAddress: varchar("ipAddress", { length: 45 }).notNull(), // IPv4 or IPv6
  endpoint: varchar("endpoint", { length: 255 }).notNull(), // e.g., "signup", "school-code"
  attemptCount: int("attemptCount").default(0).notNull(),
  lastAttemptAt: timestamp("lastAttemptAt").defaultNow().onUpdateNow().notNull(),
  blockedUntil: timestamp("blockedUntil"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type IpRateLimit = typeof ipRateLimits.$inferSelect;
export type InsertIpRateLimit = typeof ipRateLimits.$inferInsert;
// Announcements
export const announcements = mysqlTable("announcements", {
  id: int("id").autoincrement().primaryKey(),
  schoolCode: varchar("schoolCode", { length: 255 }).notNull(),
  authorId: int("authorId").notNull().references(() => users.id),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  imageUrl: varchar("imageUrl", { length: 1024 }),
  fileUrl: varchar("fileUrl", { length: 1024 }),
  fileName: varchar("fileName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;
export const announcementLikes = mysqlTable("announcementLikes", {
  id: int("id").autoincrement().primaryKey(),
  announcementId: int("announcementId").notNull().references(() => announcements.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AnnouncementLike = typeof announcementLikes.$inferSelect;
export type InsertAnnouncementLike = typeof announcementLikes.$inferInsert;
export const announcementComments = mysqlTable("announcementComments", {
  id: int("id").autoincrement().primaryKey(),
  announcementId: int("announcementId").notNull().references(() => announcements.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AnnouncementComment = typeof announcementComments.$inferSelect;
export type InsertAnnouncementComment = typeof announcementComments.$inferInsert;

/**
 * Calendar events for competitions and deadlines
 */
export const calendarEvents = mysqlTable("calendarEvents", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  time: varchar("time", { length: 5 }), // HH:MM format
  location: varchar("location", { length: 255 }),
  link: varchar("link", { length: 500 }),
  type: mysqlEnum("type", ["district", "state", "icdc", "chapter", "deadline"]).notNull(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  createdBy: int("createdBy").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;
/**
 * Portfolio items for member portfolios
 */
export const portfolioItems = mysqlTable("portfolioItems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // Written Event, Roleplay, Exam Preparation, etc.
  description: text("description"),
  fileUrl: varchar("fileUrl", { length: 1024 }),
  externalUrl: varchar("externalUrl", { length: 1024 }),
  status: mysqlEnum("status", ["not_started", "in_progress", "ready_for_review", "needs_revision", "completed"]).default("not_started").notNull(),
  memberProgressNotes: text("memberProgressNotes"),
  adminFeedback: text("adminFeedback"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PortfolioItem = typeof portfolioItems.$inferSelect;
export type InsertPortfolioItem = typeof portfolioItems.$inferInsert;
/**
 * Financial transactions for banking system
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", ["deposit", "withdrawal", "transfer", "interest", "fee"]).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: varchar("description", { length: 500 }),
  balanceBefore: decimal("balanceBefore", { precision: 10, scale: 2 }),
  balanceAfter: decimal("balanceAfter", { precision: 10, scale: 2 }),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Bank accounts for users
 */
export const bankAccounts = mysqlTable("bankAccounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountType: mysqlEnum("accountType", ["checking", "savings"]).notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0.00").notNull(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertBankAccount = typeof bankAccounts.$inferInsert;

/**
 * Credit cards for users
 */
export const creditCards = mysqlTable("creditCards", {
  id: int("id").autoincrement().primaryKey(),
  bankId: int("bankId").notNull().references(() => banks.id, { onDelete: "cascade" }),
  tier: mysqlEnum("tier", ["starter", "rewards", "elite"]).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  creditScoreRequired: int("creditScoreRequired").notNull(),
  rewardsPercentage: decimal("rewardsPercentage", { precision: 5, scale: 2 }).notNull(),
  interestRate: decimal("interestRate", { precision: 5, scale: 2 }).notNull(),
  annualFee: decimal("annualFee", { precision: 10, scale: 2 }).default("0"),
  benefits: text("benefits"),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CreditCard = typeof creditCards.$inferSelect;
export type InsertCreditCard = typeof creditCards.$inferInsert;

/**
 * Credit card accounts issued to users from the card catalog.
 */
export const userCreditCards = mysqlTable("userCreditCards", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  creditCardId: int("creditCardId").notNull().references(() => creditCards.id, { onDelete: "cascade" }),
  creditLimit: decimal("creditLimit", { precision: 15, scale: 2 }).notNull(),
  currentBalance: decimal("currentBalance", { precision: 15, scale: 2 }).default("0").notNull(),
  availableCredit: decimal("availableCredit", { precision: 15, scale: 2 }).notNull(),
  utilizationRate: decimal("utilizationRate", { precision: 5, scale: 2 }).default("0").notNull(),
  approvedDate: timestamp("approvedDate").defaultNow(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});
export type UserCreditCard = typeof userCreditCards.$inferSelect;
export type InsertUserCreditCard = typeof userCreditCards.$inferInsert;

/**
 * Stock portfolio for users
 */
export const stockPortfolio = mysqlTable("stockPortfolio", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  ticker: varchar("ticker", { length: 10 }).notNull(),
  quantity: int("quantity").notNull(),
  purchasePrice: decimal("purchasePrice", { precision: 10, scale: 2 }).notNull(),
  currentPrice: decimal("currentPrice", { precision: 10, scale: 2 }).notNull(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type StockPortfolio = typeof stockPortfolio.$inferSelect;
export type InsertStockPortfolio = typeof stockPortfolio.$inferInsert;

/**
 * Stock price cache for market data
 */
export const stockPriceCache = mysqlTable("stockPriceCache", {
  id: int("id").autoincrement().primaryKey(),
  ticker: varchar("ticker", { length: 10 }).notNull().unique(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type StockPriceCache = typeof stockPriceCache.$inferSelect;
export type InsertStockPriceCache = typeof stockPriceCache.$inferInsert;

/**
 * Payments for credit cards
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  cardId: int("cardId").notNull().references(() => creditCards.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: mysqlEnum("type", ["credit_card_payment", "credit_card_charge"]).notNull(),
  description: varchar("description", { length: 500 }),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * User Bank Accounts (checking/savings)
 */
export const userBankAccounts = mysqlTable("userBankAccounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  checkingBalance: decimal("checkingBalance", { precision: 15, scale: 2 }).default("0").notNull(),
  savingsBalance: decimal("savingsBalance", { precision: 15, scale: 2 }).default("0").notNull(),
  investmentBalance: decimal("investmentBalance", { precision: 15, scale: 2 }).default("0").notNull(),
  totalDebt: decimal("totalDebt", { precision: 15, scale: 2 }).default("0").notNull(),
  accountOpenDate: timestamp("accountOpenDate").defaultNow(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});
export type UserBankAccount = typeof userBankAccounts.$inferSelect;
export type InsertUserBankAccount = typeof userBankAccounts.$inferInsert;

export const savingsInterestAccruals = mysqlTable("savingsInterestAccruals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  periodKey: varchar("periodKey", { length: 7 }).notNull(),
  apy: decimal("apy", { precision: 5, scale: 4 }).notNull(),
  balanceBefore: decimal("balanceBefore", { precision: 15, scale: 2 }).notNull(),
  interestAmount: decimal("interestAmount", { precision: 15, scale: 2 }).notNull(),
  balanceAfter: decimal("balanceAfter", { precision: 15, scale: 2 }).notNull(),
  accruedAt: timestamp("accruedAt").defaultNow().notNull(),
}, (table) => ({
  userPeriodUnique: uniqueIndex("savingsInterest_user_period_unique").on(table.userId, table.periodKey),
}));
export type SavingsInterestAccrual = typeof savingsInterestAccruals.$inferSelect;

export const adminActivityLogs = mysqlTable("adminActivityLogs", {
  id: int("id").autoincrement().primaryKey(),
  actorUserId: int("actorUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  targetType: varchar("targetType", { length: 60 }).notNull(),
  targetId: varchar("targetId", { length: 100 }),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Card Usage Tracking
 */
export const cardUsageTracking = mysqlTable("cardUsageTracking", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  cardId: int("cardId").notNull().references(() => creditCards.id, { onDelete: "cascade" }),
  transactionAmount: decimal("transactionAmount", { precision: 10, scale: 2 }).notNull(),
  merchantCategory: varchar("merchantCategory", { length: 50 }).notNull(),
  transactionDate: timestamp("transactionDate").notNull(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});
export type CardUsageTracking = typeof cardUsageTracking.$inferSelect;
export type InsertCardUsageTracking = typeof cardUsageTracking.$inferInsert;

/**
 * Cashback Rewards
 */
export const cashbackRewards = mysqlTable("cashbackRewards", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  cardId: int("cardId").notNull().references(() => creditCards.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  source: varchar("source", { length: 100 }).notNull(),
  earnedDate: timestamp("earnedDate").notNull(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});
export type CashbackReward = typeof cashbackRewards.$inferSelect;
export type InsertCashbackReward = typeof cashbackRewards.$inferInsert;

/**
 * Spending Patterns
 */
export const spendingPatterns = mysqlTable("spendingPatterns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  merchantCategory: varchar("merchantCategory", { length: 50 }).notNull(),
  monthlySpending: decimal("monthlySpending", { precision: 10, scale: 2 }).notNull(),
  averageTransactionAmount: decimal("averageTransactionAmount", { precision: 10, scale: 2 }).notNull(),
  transactionCount: int("transactionCount").notNull(),
  month: int("month").notNull(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SpendingPattern = typeof spendingPatterns.$inferSelect;
export type InsertSpendingPattern = typeof spendingPatterns.$inferInsert;

/**
 * Cashback and other rewards earned from user credit-card activity.
 */
export const rewards = mysqlTable("rewards", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  userCreditCardId: int("userCreditCardId").notNull().references(() => userCreditCards.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  source: varchar("source", { length: 100 }).notNull(),
  transactionAmount: decimal("transactionAmount", { precision: 15, scale: 2 }).notNull(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  earnedAt: timestamp("earnedAt").defaultNow(),
});
export type Reward = typeof rewards.$inferSelect;
export type InsertReward = typeof rewards.$inferInsert;

/**
 * Admin Member Notes
 */
export const adminMemberNotes = mysqlTable("adminMemberNotes", {
  id: int("id").autoincrement().primaryKey(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  memberId: int("memberId").notNull(),
  adminId: int("adminId").notNull(),
  note: text("note").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AdminMemberNote = typeof adminMemberNotes.$inferSelect;
export type InsertAdminMemberNote = typeof adminMemberNotes.$inferInsert;

/**
 * Direct Messages
 */
export const directMessages = mysqlTable("directMessages", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId").notNull().references(() => users.id, { onDelete: "cascade" }),
  recipientId: int("recipientId").notNull().references(() => users.id, { onDelete: "cascade" }),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  body: text("body").notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type DirectMessage = typeof directMessages.$inferSelect;
export type InsertDirectMessage = typeof directMessages.$inferInsert;

/**
 * PI Learning Modules - Performance Indicator mastery system
 */
export const piLearningModules = mysqlTable("piLearningModules", {
  id: int("id").autoincrement().primaryKey(),
  piId: varchar("piId", { length: 255 }).notNull().unique(), // e.g., BL:001
  cluster: varchar("cluster", { length: 255 }).notNull(),
  instructionalArea: varchar("instructionalArea", { length: 255 }).notNull(),
  performanceIndicator: text("performanceIndicator").notNull(),
  level: varchar("level", { length: 50 }), // SP, CS, PQ
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PiLearningModule = typeof piLearningModules.$inferSelect;
export type InsertPiLearningModule = typeof piLearningModules.$inferInsert;

export const piModuleSections = mysqlTable("piModuleSections", {
  id: int("id").autoincrement().primaryKey(),
  moduleId: int("moduleId").notNull().references(() => piLearningModules.id, { onDelete: "cascade" }),
  sectionType: mysqlEnum("sectionType", [
    "theory",
    "vocabulary",
    "examples",
    "flashcards",
    "quiz",
    "scenario_challenge",
    "ai_coach_feedback",
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  order: int("order").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => {
  return {
    unq: unique("pi_module_section_unq").on(table.moduleId, table.sectionType, table.order),
  };
});
export type PiModuleSection = typeof piModuleSections.$inferSelect;
export type InsertPiModuleSection = typeof piModuleSections.$inferInsert;

export const piFlashcards = mysqlTable("piFlashcards", {
  id: int("id").autoincrement().primaryKey(),
  sectionId: int("sectionId").notNull().references(() => piModuleSections.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  // The complete PI source uses definition, application, scenario, and comparison cards.
  // Keep this extensible rather than discarding source-card classifications at import time.
  type: varchar("type", { length: 50 }),
  options: text("options"), // JSON string for multiple choice options
  correctAnswer: text("correctAnswer"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PiFlashcard = typeof piFlashcards.$inferSelect;
export type InsertPiFlashcard = typeof piFlashcards.$inferInsert;

export const piQuizQuestions = mysqlTable("piQuizQuestions", {
  id: int("id").autoincrement().primaryKey(),
  sectionId: int("sectionId").notNull().references(() => piModuleSections.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  options: json("options"), // JSON for multiple choice options
  correctAnswer: varchar("correctAnswer", { length: 255 }).notNull(),
  rationale: text("rationale"),
  explanation: text("explanation"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PiQuizQuestion = typeof piQuizQuestions.$inferSelect;
export type InsertPiQuizQuestion = typeof piQuizQuestions.$inferInsert;

export const piScenarioChallenges = mysqlTable("piScenarioChallenges", {
  id: int("id").autoincrement().primaryKey(),
  sectionId: int("sectionId").notNull().references(() => piModuleSections.id, { onDelete: "cascade" }),
  scenario: text("scenario").notNull(),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).notNull(),
  expectedAnswer: text("expectedAnswer"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PiScenarioChallenge = typeof piScenarioChallenges.$inferSelect;
export type InsertPiScenarioChallenge = typeof piScenarioChallenges.$inferInsert;

export const userPiProgress = mysqlTable("userPiProgress", {
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  moduleId: int("moduleId").notNull().references(() => piLearningModules.id, { onDelete: "cascade" }),
  masteryScore: int("masteryScore").default(0).notNull(), // 0-100
  reviewStatus: mysqlEnum("reviewStatus", ["fresh", "rusty", "needs_review"]).default("fresh").notNull(),
  lastReviewedAt: timestamp("lastReviewedAt").defaultNow().notNull(),
  nextReviewAt: timestamp("nextReviewAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => {
  return {
    pk: primaryKey(table.userId, table.moduleId),
  };
});
export type UserPiProgress = typeof userPiProgress.$inferSelect;
export type InsertUserPiProgress = typeof userPiProgress.$inferInsert;

export const userPiSectionProgress = mysqlTable("userPiSectionProgress", {
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  sectionId: int("sectionId").notNull().references(() => piModuleSections.id, { onDelete: "cascade" }),
  isCompleted: boolean("isCompleted").default(false).notNull(),
  score: int("score").default(0).notNull(), // for quizzes/challenges
  lastAttemptAt: timestamp("lastAttemptAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => {
  return {
    pk: primaryKey(table.userId, table.sectionId),
  };
});
export type UserPiSectionProgress = typeof userPiSectionProgress.$inferSelect;
export type InsertUserPiSectionProgress = typeof userPiSectionProgress.$inferInsert;

/**
 * Relations
 */
export const piLearningModuleRelations = relations(piLearningModules, ({ many }) => ({
  sections: many(piModuleSections),
  userProgress: many(userPiProgress),
}));

export const piModuleSectionRelations = relations(piModuleSections, ({ one, many }) => ({
  module: one(piLearningModules, { fields: [piModuleSections.moduleId], references: [piLearningModules.id] }),
  flashcards: many(piFlashcards),
  quizQuestions: many(piQuizQuestions),
  scenarioChallenges: many(piScenarioChallenges),
  userSectionProgress: many(userPiSectionProgress),
}));

export const piFlashcardRelations = relations(piFlashcards, ({ one }) => ({
  section: one(piModuleSections, { fields: [piFlashcards.sectionId], references: [piModuleSections.id] }),
}));

export const piQuizQuestionRelations = relations(piQuizQuestions, ({ one }) => ({
  section: one(piModuleSections, { fields: [piQuizQuestions.sectionId], references: [piModuleSections.id] }),
}));

export const piScenarioChallengeRelations = relations(piScenarioChallenges, ({ one }) => ({
  section: one(piModuleSections, { fields: [piScenarioChallenges.sectionId], references: [piModuleSections.id] }),
}));

export const userPiProgressRelations = relations(userPiProgress, ({ one }) => ({
  user: one(users, { fields: [userPiProgress.userId], references: [users.id] }),
  module: one(piLearningModules, { fields: [userPiProgress.moduleId], references: [piLearningModules.id] }),
}));

export const userPiSectionProgressRelations = relations(userPiSectionProgress, ({ one }) => ({
  user: one(users, { fields: [userPiSectionProgress.userId], references: [users.id] }),
  section: one(piModuleSections, { fields: [userPiSectionProgress.sectionId], references: [piModuleSections.id] }),
}));

/**
 * Blue Bucks - Virtual currency system
 */
export const blueBucks = mysqlTable("blueBucks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: int("amount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});
export type BlueBucks = typeof blueBucks.$inferSelect;
export type InsertBlueBucks = typeof blueBucks.$inferInsert;

/**
 * Blue Bucks Transactions
 */
export const blueBucksTransactions = mysqlTable("blueBucksTransactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: int("amount").notNull(),
  reason: mysqlEnum("reason", ["correct_first_attempt", "discussion_post", "discussion_reply", "admin_award"]).notNull(),
  relatedId: int("relatedId"),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});
export type BlueBucksTransaction = typeof blueBucksTransactions.$inferSelect;
export type InsertBlueBucksTransaction = typeof blueBucksTransactions.$inferInsert;

/**
 * User Answers - Practice question responses
 */
export const userAnswers = mysqlTable("userAnswers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  questionId: varchar("questionId", { length: 50 }).notNull(),
  selectedAnswer: varchar("selectedAnswer", { length: 1 }).notNull(),
  isCorrect: boolean("isCorrect").notNull(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});
export type UserAnswer = typeof userAnswers.$inferSelect;
export type InsertUserAnswer = typeof userAnswers.$inferInsert;

/**
 * User Streaks - Tracking practice streaks
 */
export const userStreaks = mysqlTable("userStreaks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  currentStreak: int("currentStreak").default(0).notNull(),
  longestStreak: int("longestStreak").default(0).notNull(),
  lastPracticeDate: timestamp("lastPracticeDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserStreak = typeof userStreaks.$inferSelect;
export type InsertUserStreak = typeof userStreaks.$inferInsert;

/**
 * Daily Practice Stats
 */
export const dailyPracticeStats = mysqlTable("dailyPracticeStats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  questionsAnswered: int("questionsAnswered").default(0).notNull(),
  correctAnswers: int("correctAnswers").default(0).notNull(),
  blueBucksEarned: decimal("blueBucksEarned", { precision: 10, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type DailyPracticeStat = typeof dailyPracticeStats.$inferSelect;
export type InsertDailyPracticeStat = typeof dailyPracticeStats.$inferInsert;

/**
 * Economic Settings - Game economy configuration
 */
export const economicSettings = mysqlTable("economicSettings", {
  id: int("id").autoincrement().primaryKey(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  baseBlueBucksPerQuestion: decimal("baseBlueBucksPerQuestion", { precision: 10, scale: 2 }).default("10").notNull(),
  bonusMultiplier: decimal("bonusMultiplier", { precision: 5, scale: 2 }).default("1.5").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EconomicSetting = typeof economicSettings.$inferSelect;
export type InsertEconomicSetting = typeof economicSettings.$inferInsert;

/**
 * Economic Audit Log
 */
export const economicAuditLog = mysqlTable("economicAuditLog", {
  id: int("id").autoincrement().primaryKey(),
  superAdminId: int("superAdminId").notNull().references(() => users.id, { onDelete: "cascade" }),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  changeType: varchar("changeType", { length: 100 }).notNull(),
  fieldChanged: varchar("fieldChanged", { length: 100 }).notNull(),
  oldValue: text("oldValue"),
  newValue: text("newValue"),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type EconomicAuditLog = typeof economicAuditLog.$inferSelect;
export type InsertEconomicAuditLog = typeof economicAuditLog.$inferInsert;

/**
 * User feedback submitted for chapter-specific review by administrators.
 */
export const userFeedback = mysqlTable("userFeedback", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  category: mysqlEnum("category", ["bug", "feature", "content", "other"]).notNull(),
  subject: varchar("subject", { length: 160 }).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["new", "reviewing", "resolved", "dismissed"]).default("new").notNull(),
  adminResponse: text("adminResponse"),
  reviewedBy: int("reviewedBy").references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserFeedback = typeof userFeedback.$inferSelect;
export type InsertUserFeedback = typeof userFeedback.$inferInsert;

/**
 * User-controlled in-app notification preferences.
 */
export const notificationPreferences = mysqlTable("notificationPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  announcementsEnabled: boolean("announcementsEnabled").default(true).notNull(),
  feedbackResponsesEnabled: boolean("feedbackResponsesEnabled").default(true).notNull(),
  systemUpdatesEnabled: boolean("systemUpdatesEnabled").default(true).notNull(),
  studyRemindersEnabled: boolean("studyRemindersEnabled").default(false).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userUnique: uniqueIndex("notificationPreferences_user_unique").on(table.userId),
}));
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

/**
 * Optional visual and privacy customizations shown on a member's profile.
 */
export const userProfileSettings = mysqlTable("userProfileSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  displayName: varchar("displayName", { length: 60 }),
  bio: varchar("bio", { length: 280 }),
  accentColor: mysqlEnum("accentColor", ["blue", "violet", "emerald", "rose"]).default("blue").notNull(),
  showOnLeaderboard: boolean("showOnLeaderboard").default(true).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userUnique: uniqueIndex("userProfileSettings_user_unique").on(table.userId),
}));
export type UserProfileSetting = typeof userProfileSettings.$inferSelect;
export type InsertUserProfileSetting = typeof userProfileSettings.$inferInsert;

/**
 * Stocks - Stock market simulation
 */
export const stocks = mysqlTable("stocks", {
  id: int("id").autoincrement().primaryKey(),
  ticker: varchar("ticker", { length: 10 }).notNull(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Stock = typeof stocks.$inferSelect;
export type InsertStock = typeof stocks.$inferInsert;

/**
 * Portfolio Cash - User cash holdings
 */
export const portfolioCash = mysqlTable("portfolioCash", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  cashBalance: decimal("cashBalance", { precision: 15, scale: 2 }).default("0").notNull(),
  initialAllocation: decimal("initialAllocation", { precision: 15, scale: 2 }).default("10000").notNull(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PortfolioCash = typeof portfolioCash.$inferSelect;
export type InsertPortfolioCash = typeof portfolioCash.$inferInsert;

/**
 * Market Transactions - Buy/sell transactions
 */
export const marketTransactions = mysqlTable("marketTransactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  stockId: int("stockId").notNull().references(() => stocks.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", ["buy", "sell"]).notNull(),
  shares: decimal("shares", { precision: 15, scale: 6 }).notNull(),
  pricePerShare: decimal("pricePerShare", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("totalAmount", { precision: 15, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "executed", "cancelled"]).default("executed").notNull(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  executedAt: timestamp("executedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MarketTransaction = typeof marketTransactions.$inferSelect;
export type InsertMarketTransaction = typeof marketTransactions.$inferInsert;

/**
 * After-hours orders queued for market-open execution.
 */
export const pendingOrders = mysqlTable("pendingOrders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  stockId: int("stockId").notNull().references(() => stocks.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", ["buy", "sell"]).notNull(),
  blueBucksAmount: decimal("blueBucksAmount", { precision: 15, scale: 2 }).notNull(),
  shares: decimal("shares", { precision: 15, scale: 6 }),
  status: mysqlEnum("status", ["pending", "executed", "cancelled"]).default("pending").notNull(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  executedAt: timestamp("executedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PendingOrder = typeof pendingOrders.$inferSelect;
export type InsertPendingOrder = typeof pendingOrders.$inferInsert;

/**
 * Portfolio Holdings - User stock holdings
 */
export const portfolioHoldings = mysqlTable("portfolioHoldings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  stockId: int("stockId").notNull().references(() => stocks.id, { onDelete: "cascade" }),
  shares: decimal("shares", { precision: 15, scale: 6 }).notNull(),
  averageBuyPrice: decimal("averageBuyPrice", { precision: 10, scale: 2 }).notNull(),
  totalInvested: decimal("totalInvested", { precision: 15, scale: 2 }).notNull(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PortfolioHolding = typeof portfolioHoldings.$inferSelect;
export type InsertPortfolioHolding = typeof portfolioHoldings.$inferInsert;

/**
 * Market Price History - Historical stock prices
 */
export const marketPriceHistory = mysqlTable("marketPriceHistory", {
  id: int("id").autoincrement().primaryKey(),
  stockId: int("stockId").notNull().references(() => stocks.id, { onDelete: "cascade" }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  priceTimestamp: timestamp("priceTimestamp").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MarketPriceHistory = typeof marketPriceHistory.$inferSelect;
export type InsertMarketPriceHistory = typeof marketPriceHistory.$inferInsert;

/**
 * Portfolio Snapshots - Portfolio value snapshots
 */
export const portfolioSnapshots = mysqlTable("portfolioSnapshots", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  totalValue: decimal("totalValue", { precision: 15, scale: 2 }).notNull(),
  cashBalance: decimal("cashBalance", { precision: 15, scale: 2 }).notNull(),
  totalProfit: decimal("totalProfit", { precision: 15, scale: 2 }).notNull(),
  percentageReturn: decimal("percentageReturn", { precision: 8, scale: 2 }).notNull(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  snapshotDate: timestamp("snapshotDate").defaultNow().notNull(),
});
export type PortfolioSnapshot = typeof portfolioSnapshots.$inferSelect;
export type InsertPortfolioSnapshot = typeof portfolioSnapshots.$inferInsert;

/**
 * Portfolio Uploads - User portfolio submissions
 */
export const portfolioUploads = mysqlTable("portfolioUploads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: text("fileKey").notNull(),
  fileSize: int("fileSize").notNull(),
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  uploadedAt: timestamp("uploadedAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});
export type PortfolioUpload = typeof portfolioUploads.$inferSelect;
export type InsertPortfolioUpload = typeof portfolioUploads.$inferInsert;

/**
 * Banks - Banking system
 */
export const banks = mysqlTable("banks", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  focus: varchar("focus", { length: 100 }).notNull(),
  description: text("description"),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});
export type Bank = typeof banks.$inferSelect;
export type InsertBank = typeof banks.$inferInsert;

/**
 * Credit Scores - User credit scores
 */
export const creditScores = mysqlTable("creditScores", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  score: int("score").default(500).notNull(),
  lastCalculatedDate: timestamp("lastCalculatedDate").defaultNow(),
  paymentReliabilityScore: decimal("paymentReliabilityScore", { precision: 5, scale: 2 }).default("0"),
  accountHistoryScore: decimal("accountHistoryScore", { precision: 5, scale: 2 }).default("0"),
  practiceConsistencyScore: decimal("practiceConsistencyScore", { precision: 5, scale: 2 }).default("0"),
  netWorthScore: decimal("netWorthScore", { precision: 5, scale: 2 }).default("0"),
  spendingBehaviorScore: decimal("spendingBehaviorScore", { precision: 5, scale: 2 }).default("0"),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});
export type CreditScore = typeof creditScores.$inferSelect;
export type InsertCreditScore = typeof creditScores.$inferInsert;

/**
 * Credit History - User credit history
 */
export const creditHistory = mysqlTable("creditHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  previousScore: int("previousScore").notNull(),
  newScore: int("newScore").notNull(),
  scoreChange: int("scoreChange").notNull(),
  factors: text("factors"),
  reason: varchar("reason", { length: 255 }),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  calculatedAt: timestamp("calculatedAt").defaultNow(),
});
export type CreditHistory = typeof creditHistory.$inferSelect;
export type InsertCreditHistory = typeof creditHistory.$inferInsert;

/**
 * Credit Card Products - Available credit card products
 */
export const creditCardProducts = mysqlTable("creditCardProducts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  annualFee: decimal("annualFee", { precision: 10, scale: 2 }).default("0").notNull(),
  creditLimitMin: decimal("creditLimitMin", { precision: 10, scale: 2 }).notNull(),
  creditLimitMax: decimal("creditLimitMax", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CreditCardProduct = typeof creditCardProducts.$inferSelect;
export type InsertCreditCardProduct = typeof creditCardProducts.$inferInsert;

/**
 * Credit Card Payments - Payment records
 */
export const creditCardPayments = mysqlTable("creditCardPayments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  userCreditCardId: int("userCreditCardId").notNull().references(() => userCreditCards.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "missed", "late"]).notNull(),
  dueDate: timestamp("dueDate").notNull(),
  paidDate: timestamp("paidDate"),
  daysLate: int("daysLate").default(0),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});
export type CreditCardPayment = typeof creditCardPayments.$inferSelect;
export type InsertCreditCardPayment = typeof creditCardPayments.$inferInsert;

/**
 * Financial Profiles - User financial profiles
 */
export const financialProfiles = mysqlTable("financialProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  netWorth: decimal("netWorth", { precision: 15, scale: 2 }).default("0").notNull(),
  totalAssets: decimal("totalAssets", { precision: 15, scale: 2 }).default("0").notNull(),
  totalDebt: decimal("totalDebt", { precision: 15, scale: 2 }).default("0").notNull(),
  totalRewardsEarned: decimal("totalRewardsEarned", { precision: 15, scale: 2 }).default("0").notNull(),
  totalPurchases: decimal("totalPurchases", { precision: 15, scale: 2 }).default("0").notNull(),
  missedPayments: int("missedPayments").default(0).notNull(),
  latePayments: int("latePayments").default(0).notNull(),
  onTimePayments: int("onTimePayments").default(0).notNull(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});
export type FinancialProfile = typeof financialProfiles.$inferSelect;
export type InsertFinancialProfile = typeof financialProfiles.$inferInsert;

/**
 * Economic Config - Game economy configuration
 */
export const economicConfig = mysqlTable("economicConfig", {
  id: int("id").autoincrement().primaryKey(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  paymentReliabilityWeight: decimal("paymentReliabilityWeight", { precision: 5, scale: 2 }).default("25").notNull(),
  accountHistoryWeight: decimal("accountHistoryWeight", { precision: 5, scale: 2 }).default("25").notNull(),
  practiceConsistencyWeight: decimal("practiceConsistencyWeight", { precision: 5, scale: 2 }).default("20").notNull(),
  netWorthWeight: decimal("netWorthWeight", { precision: 5, scale: 2 }).default("20").notNull(),
  spendingBehaviorWeight: decimal("spendingBehaviorWeight", { precision: 5, scale: 2 }).default("10").notNull(),
  onTimePaymentPoints: int("onTimePaymentPoints").default(2).notNull(),
  missedPaymentPenalty: int("missedPaymentPenalty").default(15).notNull(),
  savingsInterestRate: decimal("savingsInterestRate", { precision: 5, scale: 2 }).default("0.5").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});
export type EconomicConfig = typeof economicConfig.$inferSelect;
export type InsertEconomicConfig = typeof economicConfig.$inferInsert;

/**
 * Cosmetics - Cosmetic items (skins, avatars, etc.)
 */
export const cosmetics = mysqlTable("cosmetics", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["profile_frame", "banner", "avatar_effect", "title"]).notNull(),
  rarity: mysqlEnum("rarity", ["common", "rare", "epic", "legendary"]).notNull(),
  cost: int("cost").notNull(),
  imageUrl: text("imageUrl"),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});
export type Cosmetic = typeof cosmetics.$inferSelect;
export type InsertCosmetic = typeof cosmetics.$inferInsert;

/**
 * User Cosmetics - User cosmetic ownership
 */
export const userCosmetics = mysqlTable("userCosmetics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  cosmeticId: int("cosmeticId").notNull().references(() => cosmetics.id, { onDelete: "cascade" }),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  acquiredAt: timestamp("acquiredAt").defaultNow(),
  isEquipped: boolean("isEquipped").default(false).notNull(),
});
export type UserCosmetic = typeof userCosmetics.$inferSelect;
export type InsertUserCosmetic = typeof userCosmetics.$inferInsert;

/**
 * Gacha Pulls - Gacha system pulls
 */
export const gachaPulls = mysqlTable("gachaPulls", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  cosmeticId: int("cosmeticId").notNull().references(() => cosmetics.id, { onDelete: "cascade" }),
  rarityObtained: mysqlEnum("rarityObtained", ["common", "rare", "epic", "legendary"]).notNull(),
  pointsSpent: int("pointsSpent").notNull(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  pulledAt: timestamp("pulledAt").defaultNow().notNull(),
});
export type GachaPull = typeof gachaPulls.$inferSelect;
export type InsertGachaPull = typeof gachaPulls.$inferInsert;
