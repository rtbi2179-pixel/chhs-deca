import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, date, unique } from "drizzle-orm/mysql-core";

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
 * Private admin notes about members
 */
export const adminMemberNotes = mysqlTable("adminMemberNotes", {
  id: int("id").autoincrement().primaryKey(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  memberId: int("memberId").notNull().references(() => users.id, { onDelete: "cascade" }),
  adminId: int("adminId").notNull().references(() => users.id, { onDelete: "cascade" }),
  note: text("note").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdminMemberNote = typeof adminMemberNotes.$inferSelect;
export type InsertAdminMemberNote = typeof adminMemberNotes.$inferInsert;

/**
 * Direct messages between admins and members
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
 * Blue Bucks - Point system for user engagement
 */
export const blueBucks = mysqlTable("blueBucks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: int("amount").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BlueBucks = typeof blueBucks.$inferSelect;
export type InsertBlueBucks = typeof blueBucks.$inferInsert;

export const blueBucksTransactions = mysqlTable("blueBucksTransactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: int("amount").notNull(),
  reason: mysqlEnum("reason", ["correct_first_attempt", "discussion_post", "discussion_reply", "admin_award"]).notNull(),
  relatedId: int("relatedId"), // ID of the question, discussion post, etc.
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BlueBucksTransaction = typeof blueBucksTransactions.$inferSelect;
export type InsertBlueBucksTransaction = typeof blueBucksTransactions.$inferInsert;

/**
 * User practice question answers - tracks which questions users have answered
 */
export const userAnswers = mysqlTable("userAnswers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  questionId: varchar("questionId", { length: 50 }).notNull(),
  selectedAnswer: varchar("selectedAnswer", { length: 1 }).notNull(),
  isCorrect: boolean("isCorrect").notNull(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userQuestionUnique: unique().on(table.userId, table.questionId),
}));

export type UserAnswer = typeof userAnswers.$inferSelect;
export type InsertUserAnswer = typeof userAnswers.$inferInsert;


/**
 * User Practice Streak Tracking - tracks daily practice streaks and multipliers
 */
export const userStreaks = mysqlTable("userStreaks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  currentStreak: int("currentStreak").notNull().default(0),
  longestStreak: int("longestStreak").notNull().default(0),
  currentMultiplier: decimal("currentMultiplier", { precision: 3, scale: 1 }).notNull().default("1.0"),
  maxMultiplier: decimal("maxMultiplier", { precision: 3, scale: 1 }).notNull().default("2.0"),
  lastPracticeDate: timestamp("lastPracticeDate"),
  streakStartDate: timestamp("streakStartDate"),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserStreak = typeof userStreaks.$inferSelect;
export type InsertUserStreak = typeof userStreaks.$inferInsert;

/**
 * Daily Practice Stats - tracks daily practice activity for streak calculations
 */
export const dailyPracticeStats = mysqlTable("dailyPracticeStats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  practiceDate: date("practiceDate").notNull(),
  questionsCompleted: int("questionsCompleted").notNull().default(0),
  correctAnswers: int("correctAnswers").notNull().default(0),
  totalAnswered: int("totalAnswered").notNull().default(0),
  accuracy: decimal("accuracy", { precision: 5, scale: 2 }).notNull().default("0"),
  blueBucksEarned: int("blueBucksEarned").notNull().default(0),
  streakQualified: boolean("streakQualified").notNull().default(false),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DailyPracticeStat = typeof dailyPracticeStats.$inferSelect;
export type InsertDailyPracticeStat = typeof dailyPracticeStats.$inferInsert;

/**
 * Economic Settings - super admin controlled economy parameters
 */
export const economicSettings = mysqlTable("economicSettings", {
  id: int("id").autoincrement().primaryKey(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull().unique(),
  easyQuestionReward: int("easyQuestionReward").notNull().default(5),
  mediumQuestionReward: int("mediumQuestionReward").notNull().default(10),
  hardQuestionReward: int("hardQuestionReward").notNull().default(15),
  dailyQuestionLimit: int("dailyQuestionLimit").notNull().default(100),
  streakMinQuestionsPerDay: int("streakMinQuestionsPerDay").notNull().default(10),
  streakMinAccuracy: decimal("streakMinAccuracy", { precision: 5, scale: 2 }).notNull().default("70"),
  maxMultiplier: decimal("maxMultiplier", { precision: 3, scale: 1 }).notNull().default("2.0"),
  multiplierIncreaseInterval: int("multiplierIncreaseInterval").notNull().default(10),
  multiplierIncreaseAmount: decimal("multiplierIncreaseAmount", { precision: 3, scale: 1 }).notNull().default("0.1"),
  newUserStartingBalance: int("newUserStartingBalance").notNull().default(1000),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EconomicSettings = typeof economicSettings.$inferSelect;
export type InsertEconomicSettings = typeof economicSettings.$inferInsert;

/**
 * Economic Audit Log - tracks all economic changes made by super admins
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
 * Blue Blazer Market - Stock simulation using Blue Bucks
 */

/**
 * Available stocks in the market
 */
export const stocks = mysqlTable("stocks", {
  id: int("id").autoincrement().primaryKey(),
  ticker: varchar("ticker", { length: 10 }).notNull().unique(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(), // Stock available for specific school
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Stock = typeof stocks.$inferSelect;
export type InsertStock = typeof stocks.$inferInsert;

/**
 * Market price history - stores delayed stock prices
 */
export const marketPriceHistory = mysqlTable("marketPriceHistory", {
  id: int("id").autoincrement().primaryKey(),
  stockId: int("stockId").notNull().references(() => stocks.id, { onDelete: "cascade" }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  priceTimestamp: timestamp("priceTimestamp").notNull(), // When the price was recorded (15-min delayed)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MarketPriceHistory = typeof marketPriceHistory.$inferSelect;
export type InsertMarketPriceHistory = typeof marketPriceHistory.$inferInsert;

/**
 * User portfolio holdings
 */
export const portfolioHoldings = mysqlTable("portfolioHoldings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  stockId: int("stockId").notNull().references(() => stocks.id, { onDelete: "cascade" }),
  shares: decimal("shares", { precision: 15, scale: 6 }).notNull(), // Support fractional shares
  averageBuyPrice: decimal("averageBuyPrice", { precision: 10, scale: 2 }).notNull(),
  totalInvested: decimal("totalInvested", { precision: 15, scale: 2 }).notNull(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PortfolioHolding = typeof portfolioHoldings.$inferSelect;
export type InsertPortfolioHolding = typeof portfolioHoldings.$inferInsert;

/**
 * Buy/sell transactions
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
 * Pending orders for when market is closed
 */
export const pendingOrders = mysqlTable("pendingOrders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  stockId: int("stockId").notNull().references(() => stocks.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", ["buy", "sell"]).notNull(),
  blueBucksAmount: decimal("blueBucksAmount", { precision: 15, scale: 2 }).notNull(), // For buy orders
  shares: decimal("shares", { precision: 15, scale: 6 }), // For sell orders
  status: mysqlEnum("status", ["pending", "executed", "cancelled"]).default("pending").notNull(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  executedAt: timestamp("executedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PendingOrder = typeof pendingOrders.$inferSelect;
export type InsertPendingOrder = typeof pendingOrders.$inferInsert;

/**
 * User portfolio cash balance
 */
export const portfolioCash = mysqlTable("portfolioCash", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  cashBalance: decimal("cashBalance", { precision: 15, scale: 2 }).notNull().default("0"),
  initialAllocation: decimal("initialAllocation", { precision: 15, scale: 2 }).notNull().default("10000"), // Starting Blue Bucks for market
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PortfolioCash = typeof portfolioCash.$inferSelect;
export type InsertPortfolioCash = typeof portfolioCash.$inferInsert;

/**
 * Portfolio snapshots for leaderboard history
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
 * User portfolio uploads - for DECA competition portfolios
 */
export const portfolioUploads = mysqlTable("portfolioUploads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(), // S3 URL
  fileKey: text("fileKey").notNull(), // S3 key for deletion
  fileSize: int("fileSize").notNull(), // in bytes
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PortfolioUpload = typeof portfolioUploads.$inferSelect;
export type InsertPortfolioUpload = typeof portfolioUploads.$inferInsert;


/**
 * Virtual Banks
 */
export const banks = mysqlTable("banks", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  focus: varchar("focus", { length: 100 }).notNull(), // "Beginner friendly", "Rewards and growth", "Premium users"
  description: text("description"),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Bank = typeof banks.$inferSelect;
export type InsertBank = typeof banks.$inferInsert;

/**
 * Credit Card Tiers
 */
export const creditCards = mysqlTable("creditCards", {
  id: int("id").autoincrement().primaryKey(),
  bankId: int("bankId").notNull().references(() => banks.id, { onDelete: "cascade" }),
  tier: mysqlEnum("tier", ["starter", "rewards", "elite"]).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  creditScoreRequired: int("creditScoreRequired").notNull(), // e.g., 500, 650, 750
  rewardsPercentage: decimal("rewardsPercentage", { precision: 5, scale: 2 }).notNull(), // e.g., 1.00, 3.00, 5.00
  interestRate: decimal("interestRate", { precision: 5, scale: 2 }).notNull(), // e.g., 8.00, 6.00, 4.00
  annualFee: decimal("annualFee", { precision: 10, scale: 2 }).default("0"), // Optional annual fee
  benefits: text("benefits"), // JSON or text description of benefits
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CreditCard = typeof creditCards.$inferSelect;
export type InsertCreditCard = typeof creditCards.$inferInsert;

/**
 * User Bank Accounts
 */
export const userBankAccounts = mysqlTable("userBankAccounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  checkingBalance: decimal("checkingBalance", { precision: 15, scale: 2 }).notNull().default("0"),
  savingsBalance: decimal("savingsBalance", { precision: 15, scale: 2 }).notNull().default("0"),
  investmentBalance: decimal("investmentBalance", { precision: 15, scale: 2 }).notNull().default("0"), // Connected to Blue Market
  totalDebt: decimal("totalDebt", { precision: 15, scale: 2 }).notNull().default("0"),
  accountOpenDate: timestamp("accountOpenDate").defaultNow().notNull(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserBankAccount = typeof userBankAccounts.$inferSelect;
export type InsertUserBankAccount = typeof userBankAccounts.$inferInsert;

/**
 * User Credit Scores
 */
export const creditScores = mysqlTable("creditScores", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  score: int("score").notNull().default(500), // Range: 300-850
  lastCalculatedDate: timestamp("lastCalculatedDate").defaultNow().notNull(),
  paymentReliabilityScore: decimal("paymentReliabilityScore", { precision: 5, scale: 2 }).default("0"), // 0-100
  accountHistoryScore: decimal("accountHistoryScore", { precision: 5, scale: 2 }).default("0"), // 0-100
  practiceConsistencyScore: decimal("practiceConsistencyScore", { precision: 5, scale: 2 }).default("0"), // 0-100
  netWorthScore: decimal("netWorthScore", { precision: 5, scale: 2 }).default("0"), // 0-100
  spendingBehaviorScore: decimal("spendingBehaviorScore", { precision: 5, scale: 2 }).default("0"), // 0-100
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CreditScore = typeof creditScores.$inferSelect;
export type InsertCreditScore = typeof creditScores.$inferInsert;

/**
 * Credit History - Monthly credit score changes
 */
export const creditHistory = mysqlTable("creditHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  previousScore: int("previousScore").notNull(),
  newScore: int("newScore").notNull(),
  scoreChange: int("scoreChange").notNull(), // Can be negative
  factors: text("factors"), // JSON with factor breakdown
  reason: varchar("reason", { length: 255 }), // e.g., "Monthly update", "Payment made", "Missed payment"
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
});
export type CreditHistory = typeof creditHistory.$inferSelect;
export type InsertCreditHistory = typeof creditHistory.$inferInsert;

/**
 * User Credit Card Holdings
 */
export const userCreditCards = mysqlTable("userCreditCards", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  creditCardId: int("creditCardId").notNull().references(() => creditCards.id, { onDelete: "cascade" }),
  creditLimit: decimal("creditLimit", { precision: 15, scale: 2 }).notNull(),
  currentBalance: decimal("currentBalance", { precision: 15, scale: 2 }).notNull().default("0"),
  availableCredit: decimal("availableCredit", { precision: 15, scale: 2 }).notNull(),
  utilizationRate: decimal("utilizationRate", { precision: 5, scale: 2 }).notNull().default("0"), // 0-100%
  approvedDate: timestamp("approvedDate").defaultNow().notNull(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserCreditCard = typeof userCreditCards.$inferSelect;
export type InsertUserCreditCard = typeof userCreditCards.$inferInsert;

/**
 * Credit Card Payments
 */
export const creditCardPayments = mysqlTable("creditCardPayments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  userCreditCardId: int("userCreditCardId").notNull().references(() => userCreditCards.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "missed", "late"]).notNull(),
  dueDate: timestamp("dueDate").notNull(),
  paidDate: timestamp("paidDate"),
  daysLate: int("daysLate").default(0), // 0 if on time
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CreditCardPayment = typeof creditCardPayments.$inferSelect;
export type InsertCreditCardPayment = typeof creditCardPayments.$inferInsert;

/**
 * Rewards Earned
 */
export const rewards = mysqlTable("rewards", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  userCreditCardId: int("userCreditCardId").notNull().references(() => userCreditCards.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(), // Blue Bucks earned
  source: varchar("source", { length: 100 }).notNull(), // "Cashback", "Bonus", "Store discount"
  transactionAmount: decimal("transactionAmount", { precision: 15, scale: 2 }).notNull(), // Amount spent to earn reward
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
});
export type Reward = typeof rewards.$inferSelect;
export type InsertReward = typeof rewards.$inferInsert;

/**
 * Financial Profiles - Aggregated user financial data
 */
export const financialProfiles = mysqlTable("financialProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  netWorth: decimal("netWorth", { precision: 15, scale: 2 }).notNull().default("0"), // Assets - Debt
  totalAssets: decimal("totalAssets", { precision: 15, scale: 2 }).notNull().default("0"), // Cash + Savings + Investments
  totalDebt: decimal("totalDebt", { precision: 15, scale: 2 }).notNull().default("0"),
  totalRewardsEarned: decimal("totalRewardsEarned", { precision: 15, scale: 2 }).notNull().default("0"),
  totalPurchases: decimal("totalPurchases", { precision: 15, scale: 2 }).notNull().default("0"),
  missedPayments: int("missedPayments").notNull().default(0),
  latePayments: int("latePayments").notNull().default(0),
  onTimePayments: int("onTimePayments").notNull().default(0),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type FinancialProfile = typeof financialProfiles.$inferSelect;
export type InsertFinancialProfile = typeof financialProfiles.$inferInsert;

/**
 * Economic Configuration - Super admin settings
 */
export const economicConfig = mysqlTable("economicConfig", {
  id: int("id").autoincrement().primaryKey(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull().unique(),
  paymentReliabilityWeight: decimal("paymentReliabilityWeight", { precision: 5, scale: 2 }).notNull().default("25"), // 25%
  accountHistoryWeight: decimal("accountHistoryWeight", { precision: 5, scale: 2 }).notNull().default("25"), // 25%
  practiceConsistencyWeight: decimal("practiceConsistencyWeight", { precision: 5, scale: 2 }).notNull().default("20"), // 20%
  netWorthWeight: decimal("netWorthWeight", { precision: 5, scale: 2 }).notNull().default("20"), // 20%
  spendingBehaviorWeight: decimal("spendingBehaviorWeight", { precision: 5, scale: 2 }).notNull().default("10"), // 10%
  onTimePaymentPoints: int("onTimePaymentPoints").notNull().default(2), // +1 to +3 points
  missedPaymentPenalty: int("missedPaymentPenalty").notNull().default(15), // -10 to -20 points
  savingsInterestRate: decimal("savingsInterestRate", { precision: 5, scale: 2 }).notNull().default("0.5"), // Annual %
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EconomicConfig = typeof economicConfig.$inferSelect;
export type InsertEconomicConfig = typeof economicConfig.$inferInsert;

/**
 * Economic Changes Log - Audit trail for admin changes
 */
export const economicChangesLog = mysqlTable("economicChangesLog", {
  id: int("id").autoincrement().primaryKey(),
  adminId: int("adminId").notNull().references(() => users.id, { onDelete: "cascade" }),
  changeType: varchar("changeType", { length: 100 }).notNull(), // "Credit score formula", "Card tier", "Interest rate", etc.
  oldValue: text("oldValue"), // JSON
  newValue: text("newValue"), // JSON
  reason: text("reason"),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  changedAt: timestamp("changedAt").defaultNow().notNull(),
});
export type EconomicChangesLog = typeof economicChangesLog.$inferSelect;
export type InsertEconomicChangesLog = typeof economicChangesLog.$inferInsert;

/**
 * Cosmetics - Gacha system cosmetics
 */
export const cosmetics = mysqlTable("cosmetics", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["profile_frame", "banner", "avatar_effect", "title"]).notNull(),
  rarity: mysqlEnum("rarity", ["common", "rare", "epic", "legendary"]).notNull(),
  cost: int("cost").notNull(), // Cost in points
  imageUrl: text("imageUrl"), // URL to cosmetic image
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Cosmetic = typeof cosmetics.$inferSelect;
export type InsertCosmetic = typeof cosmetics.$inferInsert;

/**
 * User Cosmetics - User's cosmetic inventory
 */
export const userCosmetics = mysqlTable("userCosmetics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  cosmeticId: int("cosmeticId").notNull().references(() => cosmetics.id, { onDelete: "cascade" }),
  acquiredAt: timestamp("acquiredAt").defaultNow().notNull(),
  isEquipped: boolean("isEquipped").default(false).notNull(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
});
export type UserCosmetic = typeof userCosmetics.$inferSelect;
export type InsertUserCosmetic = typeof userCosmetics.$inferInsert;

/**
 * Gacha Pulls - History of gacha pulls
 */
export const gachaPulls = mysqlTable("gachaPulls", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  cosmeticId: int("cosmeticId").notNull().references(() => cosmetics.id, { onDelete: "cascade" }),
  rarityObtained: mysqlEnum("rarityObtained", ["common", "rare", "epic", "legendary"]).notNull(),
  pointsSpent: int("pointsSpent").notNull(),
  pulledAt: timestamp("pulledAt").defaultNow().notNull(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
});
export type GachaPull = typeof gachaPulls.$inferSelect;
export type InsertGachaPull = typeof gachaPulls.$inferInsert;
