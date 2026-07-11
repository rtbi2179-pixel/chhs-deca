import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

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

/**
 * DECA Practice Questions
 */
export const questions = mysqlTable("questions", {
  id: int("id").autoincrement().primaryKey(),
  cluster: varchar("cluster", { length: 255 }).notNull(),
  instructionalArea: varchar("instructional_area", { length: 255 }).notNull(),
  questionText: text("question_text").notNull(),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(),
  optionC: text("option_c").notNull(),
  optionD: text("option_d").notNull(),
  correctAnswer: varchar("correct_answer", { length: 1 }).notNull(), // A, B, C, or D
  explanation: text("explanation"),
  difficulty: varchar("difficulty", { length: 50 }).notNull(), // Easy, Medium, Hard
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
  questionId: int("questionId").notNull(),
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
  questionId: int("questionId").notNull(),
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
