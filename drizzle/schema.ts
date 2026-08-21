import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, date, unique, uniqueIndex, primaryKey, index } from "drizzle-orm/mysql-core";
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
  primaryEventCode: varchar("primaryEventCode", { length: 20 }),
  eventSelectedAt: timestamp("eventSelectedAt"),
  onboardingCompletedAt: timestamp("onboardingCompletedAt"),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Only structured, source-linked rule data needed to power the AI Judge is
 * stored here. It is intentionally not a copy of DECA's full publications.
 */
export const decaAiJudgeRuleSets = mysqlTable("decaAiJudgeRuleSets", {
  id: int("id").autoincrement().primaryKey(),
  competitionYear: varchar("competitionYear", { length: 20 }).notNull(),
  eventCode: varchar("eventCode", { length: 20 }).notNull(),
  version: varchar("version", { length: 80 }).notNull(),
  eventName: varchar("eventName", { length: 160 }).notNull(),
  sourceUrl: varchar("sourceUrl", { length: 1024 }).notNull(),
  sourceVersion: varchar("sourceVersion", { length: 255 }).notNull(),
  verified: boolean("verified").default(false).notNull(),
  verifiedAt: timestamp("verifiedAt"),
  rulesJson: json("rulesJson").$type<Record<string, unknown>>().notNull(),
  rubricJson: json("rubricJson").$type<unknown[]>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  yearEventVersionUnique: unique("deca_ai_judge_rule_set_year_event_version_unique").on(table.competitionYear, table.eventCode, table.version),
  verifiedEventIndex: index("deca_ai_judge_rule_set_verified_event_idx").on(table.verified, table.competitionYear, table.eventCode),
}));
export type DecaAiJudgeRuleSetRecord = typeof decaAiJudgeRuleSets.$inferSelect;

export const decaAiJudgeSessions = mysqlTable("decaAiJudgeSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  ruleSetId: int("ruleSetId").notNull().references(() => decaAiJudgeRuleSets.id, { onDelete: "restrict" }),
  competitionYear: varchar("competitionYear", { length: 20 }).notNull(),
  eventCode: varchar("eventCode", { length: 20 }).notNull(),
  ruleSetVersion: varchar("ruleSetVersion", { length: 80 }).notNull(),
  groupSize: int("groupSize").notNull(),
  submissionMode: mysqlEnum("submissionMode", ["reviewed_transcript"]).default("reviewed_transcript").notNull(),
  rawTranscript: text("rawTranscript").notNull(),
  correctedTranscript: text("correctedTranscript").notNull(),
  durationSeconds: int("durationSeconds"),
  status: mysqlEnum("status", ["analyzing", "completed", "failed"]).default("analyzing").notNull(),
  observableScore: int("observableScore"),
  observableMaximumPoints: int("observableMaximumPoints"),
  fullEstimatedScore: int("fullEstimatedScore"),
  confidence: decimal("confidence", { precision: 4, scale: 2 }),
  resultJson: json("resultJson").$type<Record<string, unknown>>(),
  modelMetadataJson: json("modelMetadataJson").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userCreatedIndex: index("deca_ai_judge_session_user_created_idx").on(table.userId, table.createdAt),
  ruleSetIndex: index("deca_ai_judge_session_rule_set_idx").on(table.ruleSetId, table.createdAt),
}));
export type DecaAiJudgeSession = typeof decaAiJudgeSessions.$inferSelect;

/**
 * Versioned simulator configuration. The rubric JSON contains the active,
 * database-configurable preparation/interview timing and Blue Blazer practice
 * score configuration for a season and event.
 */
export const decaEventRubrics = mysqlTable("decaEventRubrics", {
  id: int("id").autoincrement().primaryKey(),
  eventCode: varchar("eventCode", { length: 20 }).notNull(),
  season: varchar("season", { length: 20 }).notNull(),
  version: varchar("version", { length: 80 }).notNull(),
  rubricType: mysqlEnum("rubricType", ["roleplay_practice"]).default("roleplay_practice").notNull(),
  rubricJson: json("rubricJson").$type<Record<string, unknown>>().notNull(),
  sourceUrl: varchar("sourceUrl", { length: 1024 }).notNull(),
  sourceVersion: varchar("sourceVersion", { length: 255 }).notNull(),
  verificationStatus: mysqlEnum("verificationStatus", ["verified", "unverified"]).default("unverified").notNull(),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  eventSeasonVersionUnique: unique("deca_event_rubric_event_season_version_unique").on(table.eventCode, table.season, table.version),
  eventSeasonIndex: index("deca_event_rubric_event_season_idx").on(table.eventCode, table.season),
}));
export type DecaEventRubric = typeof decaEventRubrics.$inferSelect;

/** Original or user-authorized simulator scenario content. */
export const roleplayScenarios = mysqlTable("roleplayScenarios", {
  id: int("id").autoincrement().primaryKey(),
  eventCode: varchar("eventCode", { length: 20 }).notNull(),
  careerCluster: varchar("careerCluster", { length: 80 }).notNull(),
  instructionalArea: varchar("instructionalArea", { length: 255 }).notNull(),
  difficulty: mysqlEnum("difficulty", ["foundational", "competition", "stretch"]).default("competition").notNull(),
  participantRole: varchar("participantRole", { length: 255 }).notNull(),
  judgeRole: varchar("judgeRole", { length: 255 }).notNull(),
  companyContext: text("companyContext").notNull(),
  situation: text("situation").notNull(),
  task: text("task").notNull(),
  performanceIndicators: json("performanceIndicators").$type<Array<{ moduleId: number; piId: string; performanceIndicator: string; instructionalArea: string }>>().notNull(),
  judgeContext: text("judgeContext").notNull(),
  judgeQuestions: json("judgeQuestions").$type<string[]>().notNull(),
  expectedBusinessConcepts: json("expectedBusinessConcepts").$type<string[]>().notNull(),
  scenarioData: json("scenarioData").$type<Record<string, unknown>>(),
  sourceType: mysqlEnum("sourceType", ["official_public_sample", "blue_blazer_original", "ai_generated"]).notNull(),
  sourceYear: varchar("sourceYear", { length: 20 }).notNull(),
  sourceAttribution: varchar("sourceAttribution", { length: 1024 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  eventSourceCreatedIndex: index("roleplay_scenario_event_source_created_idx").on(table.eventCode, table.sourceType, table.createdAt),
}));
export type RoleplayScenario = typeof roleplayScenarios.$inferSelect;

/** A resumable, user-owned simulator run. */
export const roleplayAttempts = mysqlTable("roleplayAttempts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventCode: varchar("eventCode", { length: 20 }).notNull(),
  scenarioId: int("scenarioId").notNull().references(() => roleplayScenarios.id, { onDelete: "restrict" }),
  rubricId: int("rubricId").notNull().references(() => decaEventRubrics.id, { onDelete: "restrict" }),
  trainingMode: mysqlEnum("trainingMode", ["competition", "practice", "coach"]).notNull(),
  status: mysqlEnum("status", ["briefing", "preparing", "judge_intro", "interview", "follow_up", "submitted", "transcribing", "evaluating", "completed", "failed", "abandoned"]).default("briefing").notNull(),
  prepStartedAt: timestamp("prepStartedAt"),
  interviewStartedAt: timestamp("interviewStartedAt"),
  submittedAt: timestamp("submittedAt"),
  completedAt: timestamp("completedAt"),
  prepDurationSeconds: int("prepDurationSeconds").notNull(),
  interviewDurationSeconds: int("interviewDurationSeconds").notNull(),
  scratchpad: text("scratchpad"),
  activeState: json("activeState").$type<Record<string, unknown>>(),
  totalScore: int("totalScore"),
  performanceLevel: varchar("performanceLevel", { length: 50 }),
  rubricVersion: varchar("rubricVersion", { length: 80 }).notNull(),
  failureReason: varchar("failureReason", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userCreatedIndex: index("roleplay_attempt_user_created_idx").on(table.userId, table.createdAt),
  userStatusIndex: index("roleplay_attempt_user_status_idx").on(table.userId, table.status),
  scenarioIndex: index("roleplay_attempt_scenario_idx").on(table.scenarioId),
}));
export type RoleplayAttempt = typeof roleplayAttempts.$inferSelect;

/** Private object-storage metadata. API procedures never return a storage URL without ownership checks. */
export const roleplayRecordings = mysqlTable("roleplayRecordings", {
  id: int("id").autoincrement().primaryKey(),
  attemptId: int("attemptId").notNull().references(() => roleplayAttempts.id, { onDelete: "cascade" }),
  phase: mysqlEnum("phase", ["interview"]).default("interview").notNull(),
  audioStorageKey: varchar("audioStorageKey", { length: 1024 }).notNull(),
  contentType: varchar("contentType", { length: 100 }).notNull(),
  durationSeconds: int("durationSeconds").notNull(),
  fileSizeBytes: int("fileSizeBytes").notNull(),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
}, (table) => ({
  attemptPhaseUnique: unique("roleplay_recording_attempt_phase_unique").on(table.attemptId, table.phase),
}));
export type RoleplayRecording = typeof roleplayRecordings.$inferSelect;

export const roleplayTranscripts = mysqlTable("roleplayTranscripts", {
  id: int("id").autoincrement().primaryKey(),
  attemptId: int("attemptId").notNull().references(() => roleplayAttempts.id, { onDelete: "cascade" }),
  phase: mysqlEnum("phase", ["interview"]).default("interview").notNull(),
  rawText: text("rawText").notNull(),
  cleanedText: text("cleanedText").notNull(),
  segments: json("segments").$type<unknown[]>(),
  whisperModel: varchar("whisperModel", { length: 100 }),
  transcribedAt: timestamp("transcribedAt").defaultNow().notNull(),
}, (table) => ({
  attemptPhaseUnique: unique("roleplay_transcript_attempt_phase_unique").on(table.attemptId, table.phase),
}));
export type RoleplayTranscript = typeof roleplayTranscripts.$inferSelect;

/** Preserves judge-turn state for scenario-relevant, recoverable follow-up questions. */
export const roleplayJudgeTurns = mysqlTable("roleplayJudgeTurns", {
  id: int("id").autoincrement().primaryKey(),
  attemptId: int("attemptId").notNull().references(() => roleplayAttempts.id, { onDelete: "cascade" }),
  sequence: int("sequence").notNull(),
  turnType: mysqlEnum("turnType", ["introduction", "follow_up"]).notNull(),
  question: text("question").notNull(),
  basis: text("basis").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  attemptSequenceUnique: unique("roleplay_judge_turn_attempt_sequence_unique").on(table.attemptId, table.sequence),
}));
export type RoleplayJudgeTurn = typeof roleplayJudgeTurns.$inferSelect;

export const roleplayEvaluations = mysqlTable("roleplayEvaluations", {
  id: int("id").autoincrement().primaryKey(),
  attemptId: int("attemptId").notNull().references(() => roleplayAttempts.id, { onDelete: "cascade" }),
  piScores: json("piScores").$type<unknown[]>().notNull(),
  deliveryAnalysis: json("deliveryAnalysis").$type<Record<string, unknown>>().notNull(),
  overallScore: int("overallScore").notNull(),
  performanceLevel: varchar("performanceLevel", { length: 50 }).notNull(),
  strengths: json("strengths").$type<string[]>().notNull(),
  improvements: json("improvements").$type<string[]>().notNull(),
  trainingRecommendations: json("trainingRecommendations").$type<unknown[]>().notNull(),
  modelMetadata: json("modelMetadata").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  attemptUnique: unique("roleplay_evaluation_attempt_unique").on(table.attemptId),
}));
export type RoleplayEvaluation = typeof roleplayEvaluations.$inferSelect;

/**
 * Password reset requests are deliberately separate from the user record so
 * chapter admins can approve a request without ever seeing or setting a password.
 */
export const passwordResetRequests = mysqlTable("passwordResetRequests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "completed", "expired", "cancelled"]).default("pending").notNull(),
  approvedByUserId: int("approvedByUserId").references(() => users.id, { onDelete: "set null" }),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  approvedAt: timestamp("approvedAt"),
  resetTokenHash: varchar("resetTokenHash", { length: 64 }).unique(),
  resetExpiresAt: timestamp("resetExpiresAt"),
  completedAt: timestamp("completedAt"),
}, (table) => ({
  schoolStatusRequestedIndex: index("password_reset_request_school_status_requested_idx").on(table.schoolCode, table.status, table.requestedAt),
  userStatusRequestedIndex: index("password_reset_request_user_status_requested_idx").on(table.userId, table.status, table.requestedAt),
}));
export type PasswordResetRequest = typeof passwordResetRequests.$inferSelect;
export type InsertPasswordResetRequest = typeof passwordResetRequests.$inferInsert;

export const eventPerformanceIndicators = mysqlTable("eventPerformanceIndicators", {
  id: int("id").autoincrement().primaryKey(),
  eventCode: varchar("eventCode", { length: 20 }).notNull(),
  moduleId: int("moduleId").notNull(),
  mappingBasis: varchar("mappingBasis", { length: 50 }).notNull().default("cluster_instructional_area"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  uniqueEventModule: unique("event_pi_unique").on(table.eventCode, table.moduleId),
}));

export const userEventQuizResults = mysqlTable("userEventQuizResults", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  traitScores: json("traitScores").$type<Record<string, number>>().notNull(),
  recommendedEventCodes: json("recommendedEventCodes").$type<string[]>().notNull(),
  selectedEventCode: varchar("selectedEventCode", { length: 20 }),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  uniqueUserEventQuiz: unique("user_event_quiz_user_unique").on(table.userId),
}));

/**
 * Volunteer opportunities and sign-ups
 */
export const volunteerOpportunities = mysqlTable("volunteerOpportunities", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  spotsAvailable: int("spotsAvailable").default(10).notNull(),
  hoursOffered: int("hoursOffered").default(0).notNull(),
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
 * One administrator-managed chapter-exam policy per chapter. Individual mock
 * exams remain independent of this table and are always available to members.
 */
export const chapterExamConfigs = mysqlTable("chapterExamConfigs", {
  id: int("id").autoincrement().primaryKey(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  isEnabled: boolean("isEnabled").default(false).notNull(),
  cluster: varchar("cluster", { length: 255 }).notNull().default("Marketing"),
  questionCount: int("questionCount").default(100).notNull(),
  extraTimeMinutes: int("extraTimeMinutes").default(0).notNull(),
  scoreVisible: boolean("scoreVisible").default(true).notNull(),
  availableFrom: timestamp("availableFrom"),
  availableUntil: timestamp("availableUntil"),
  createdBy: int("createdBy"),
  updatedBy: int("updatedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  oneConfigPerSchool: uniqueIndex("chapter_exam_config_school_unique").on(table.schoolCode),
}));
export type ChapterExamConfig = typeof chapterExamConfigs.$inferSelect;
export type InsertChapterExamConfig = typeof chapterExamConfigs.$inferInsert;

/**
 * A scored, time-bounded member attempt attached to a specific chapter-exam
 * configuration. Score visibility is snapshotted to preserve the policy that
 * applied when the member began the assessment.
 */
export const chapterExamAttempts = mysqlTable("chapterExamAttempts", {
  id: int("id").autoincrement().primaryKey(),
  configId: int("configId").notNull(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  userId: int("userId").notNull(),
  sessionId: int("sessionId").notNull(),
  cluster: varchar("cluster", { length: 255 }).notNull(),
  questionCount: int("questionCount").notNull(),
  scoreVisible: boolean("scoreVisible").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  completedAt: timestamp("completedAt"),
  score: int("score"),
  accuracy: int("accuracy"),
  suspiciousActivityCount: int("suspiciousActivityCount").default(0).notNull(),
}, (table) => ({
  oneAttemptPerMemberExam: uniqueIndex("chapter_exam_attempt_member_config_unique").on(table.configId, table.userId),
  memberRecords: index("chapter_exam_attempt_member_idx").on(table.schoolCode, table.userId, table.completedAt),
}));
export type ChapterExamAttempt = typeof chapterExamAttempts.$inferSelect;
export type InsertChapterExamAttempt = typeof chapterExamAttempts.$inferInsert;

/**
 * Audit events help chapter staff review potentially irregular behavior. A
 * flag is evidence for review, not an automatic misconduct determination.
 */
export const chapterExamActivity = mysqlTable("chapterExamActivity", {
  id: int("id").autoincrement().primaryKey(),
  attemptId: int("attemptId").notNull(),
  userId: int("userId").notNull(),
  eventType: mysqlEnum("eventType", ["rapid_answer", "tab_hidden"]).notNull(),
  questionId: varchar("questionId", { length: 50 }),
  elapsedSeconds: int("elapsedSeconds"),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
}, (table) => ({
  attemptActivity: index("chapter_exam_activity_attempt_idx").on(table.attemptId, table.occurredAt),
}));
export type ChapterExamActivity = typeof chapterExamActivity.$inferSelect;
export type InsertChapterExamActivity = typeof chapterExamActivity.$inferInsert;
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

/** Chapter-managed competition deadlines that power personalized DECA timelines. */
export const eventTimelineCalendarEvents = mysqlTable("eventTimelineCalendarEvents", {
  id: int("id").autoincrement().primaryKey(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  competitionYear: varchar("competitionYear", { length: 20 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  eventType: mysqlEnum("eventType", ["meeting", "mock_competition", "testing", "written_deadline", "pitchdeck_deadline", "district_conference", "state_conference", "icdc_conference", "campaign_deadline", "leadership_conference", "other"]).notNull(),
  startDate: varchar("startDate", { length: 10 }),
  endDate: varchar("endDate", { length: 10 }),
  isTbd: boolean("isTbd").default(false).notNull(),
  description: text("description"),
  priority: mysqlEnum("priority", ["low", "normal", "high", "critical"]).default("normal").notNull(),
  color: varchar("color", { length: 30 }).default("blue").notNull(),
  applicableEventTypes: json("applicableEventTypes").$type<string[] | null>(),
  hardDeadline: boolean("hardDeadline").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ schoolYearIndex: index("timeline_calendar_school_year_idx").on(table.schoolCode, table.competitionYear), schoolDateIndex: index("timeline_calendar_school_date_idx").on(table.schoolCode, table.startDate) }));

export const userEventTimelines = mysqlTable("userEventTimelines", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  eventCode: varchar("eventCode", { length: 20 }).notNull(),
  competitionYear: varchar("competitionYear", { length: 20 }).notNull(),
  startDate: varchar("startDate", { length: 10 }).notNull(),
  targetDate: varchar("targetDate", { length: 10 }).notNull(),
  timelineMode: mysqlEnum("timelineMode", ["gradual", "accelerated", "emergency"]).notNull(),
  trainingIntensity: mysqlEnum("trainingIntensity", ["essential", "competitive", "all_in"]).default("competitive").notNull(),
  status: mysqlEnum("status", ["active", "archived"]).default("active").notNull(),
  readinessScore: int("readinessScore").default(0).notNull(),
  currentPhase: varchar("currentPhase", { length: 100 }).notNull(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ userEventStatusIndex: index("timeline_user_event_status_idx").on(table.userId, table.eventCode, table.status), schoolIndex: index("timeline_school_idx").on(table.schoolCode) }));

export const timelineItems = mysqlTable("timelineItems", {
  id: int("id").autoincrement().primaryKey(),
  timelineId: int("timelineId").notNull().references(() => userEventTimelines.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  itemType: mysqlEnum("itemType", ["pi_learning", "practice_questions", "practice_exam", "roleplay", "written_project", "pitch_deck", "presentation", "review", "mock_competition", "testing", "conference", "meeting", "deadline", "general"]).notNull(),
  dueDate: varchar("dueDate", { length: 10 }),
  weekStartDate: varchar("weekStartDate", { length: 10 }),
  weekTitle: varchar("weekTitle", { length: 120 }),
  priority: mysqlEnum("priority", ["low", "normal", "high", "critical"]).default("normal").notNull(),
  status: mysqlEnum("status", ["upcoming", "current", "completed", "overdue", "skipped", "rescheduled"]).default("upcoming").notNull(),
  estimatedMinutes: int("estimatedMinutes").default(30).notNull(),
  deepLink: varchar("deepLink", { length: 500 }),
  completionMetric: varchar("completionMetric", { length: 40 }).default("manual").notNull(),
  completionTarget: int("completionTarget").default(0).notNull(),
  completionBaseline: int("completionBaseline").default(0).notNull(),
  successCriteria: text("successCriteria"),
  hardDeadline: boolean("hardDeadline").default(false).notNull(),
  generatedReason: text("generatedReason").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ timelineDueIndex: index("timeline_items_due_idx").on(table.timelineId, table.dueDate), timelineStatusIndex: index("timeline_items_status_idx").on(table.timelineId, table.status) }));
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

export const savingsInterestSchedule = mysqlTable("savingsInterestSchedule", {
  id: int("id").primaryKey(),
  taskUid: varchar("taskUid", { length: 65 }),
  lastRunAt: timestamp("lastRunAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ taskUidIndex: index("savings_interest_schedule_task_uid_idx").on(table.taskUid) }));
export type SavingsInterestSchedule = typeof savingsInterestSchedule.$inferSelect;

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
 * Durable system-assistant conversation for the guided Blazer Buddy.
 * Kept separate from member-to-member messages so the assistant never
 * impersonates a chapter member or gains member account permissions.
 */
export const blazerBuddyMessages = mysqlTable("blazerBuddyMessages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  speaker: mysqlEnum("speaker", ["member", "buddy"]).notNull(),
  body: text("body").notNull(),
  notificationKey: varchar("notificationKey", { length: 100 }),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  uniqueUserNotification: unique("blazer_buddy_user_notification").on(table.userId, table.notificationKey),
  userSchoolCreatedIdx: index("blazer_buddy_user_school_created").on(table.userId, table.schoolCode, table.createdAt),
}));
export type BlazerBuddyMessage = typeof blazerBuddyMessages.$inferSelect;

/**
 * Server-verified achievement tiers. The uniqueness constraint prevents a
 * previously unlocked tier from notifying a member more than once.
 */
export const achievementUnlocks = mysqlTable("achievementUnlocks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  achievementId: varchar("achievementId", { length: 50 }).notNull(),
  tier: mysqlEnum("tier", ["bronze", "silver", "gold"]).notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
}, (table) => ({
  uniqueUserAchievementTier: unique("achievement_unlock_user_tier").on(table.userId, table.achievementId, table.tier),
  userUnlockedIndex: index("achievement_unlock_user_time_idx").on(table.userId, table.unlockedAt),
}));
export type AchievementUnlock = typeof achievementUnlocks.$inferSelect;
export type InsertAchievementUnlock = typeof achievementUnlocks.$inferInsert;

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
  reason: mysqlEnum("reason", ["correct_first_attempt", "discussion_post", "discussion_reply", "admin_award", "bank_deposit"]).notNull(),
  relatedId: int("relatedId"),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});
export type BlueBucksTransaction = typeof blueBucksTransactions.$inferSelect;
export type InsertBlueBucksTransaction = typeof blueBucksTransactions.$inferInsert;

/**
 * Active virtual learning specialization. This is distinct from all banking and
 * credit-card simulation products and has no real-world cash or wagering value.
 */
export const userStudyCards = mysqlTable("userStudyCards", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  cardKey: mysqlEnum("cardKey", ["scholar", "scholar_pro", "investor", "entrepreneur", "social", "leader", "competitor", "blazer", "maverick"]).notNull().default("blazer"),
  level: int("level").notNull().default(1),
  practiceProgress: int("practiceProgress").notNull().default(0),
  bonusBlueBucks: int("bonusBlueBucks").notNull().default(0),
  selectedAt: timestamp("selectedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserStudyCard = typeof userStudyCards.$inferSelect;
export type InsertUserStudyCard = typeof userStudyCards.$inferInsert;

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
  practiceDate: date("practiceDate").notNull(),
  questionsCompleted: int("questionsCompleted").default(0).notNull(),
  correctAnswers: int("correctAnswers").default(0).notNull(),
  totalAnswered: int("totalAnswered").default(0).notNull(),
  accuracy: decimal("accuracy", { precision: 5, scale: 2 }).default("0").notNull(),
  blueBucksEarned: int("blueBucksEarned").default(0).notNull(),
  streakQualified: boolean("streakQualified").default(false).notNull(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DailyPracticeStat = typeof dailyPracticeStats.$inferSelect;
export type InsertDailyPracticeStat = typeof dailyPracticeStats.$inferInsert;

/**
 * First-party, authenticated website diagnostics. Events intentionally capture
 * only route and control labels—never form inputs, messages, question answers,
 * or other member-entered content.
 */
export const websiteInteractionEvents = mysqlTable("websiteInteractionEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  eventType: mysqlEnum("eventType", ["page_view", "control_click"]).notNull(),
  path: varchar("path", { length: 255 }).notNull(),
  label: varchar("label", { length: 120 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  schoolTimeIndex: index("website_interaction_school_time_idx").on(table.schoolCode, table.createdAt),
  userTimeIndex: index("website_interaction_user_time_idx").on(table.userId, table.createdAt),
}));
export type WebsiteInteractionEvent = typeof websiteInteractionEvents.$inferSelect;
export type InsertWebsiteInteractionEvent = typeof websiteInteractionEvents.$inferInsert;

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
  websiteTheme: mysqlEnum("websiteTheme", ["glass", "blazer", "light-blazer"]).default("glass").notNull(),
  avatarKey: mysqlEnum("avatarKey", ["deca-compass", "deca-trophy", "deca-presentation", "mountain", "orbit", "botanical"]).default("deca-compass").notNull(),
  bannerKey: mysqlEnum("bannerKey", ["deca-strategy", "deca-stage", "aurora", "city", "studio"]).default("deca-strategy").notNull(),
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

export const blueBucksInflationSnapshots = mysqlTable("blueBucksInflationSnapshots", {
  id: int("id").autoincrement().primaryKey(),
  schoolCode: varchar("schoolCode", { length: 50 }).notNull(),
  periodKey: varchar("periodKey", { length: 20 }).notNull(),
  issuedBlueBucks: decimal("issuedBlueBucks", { precision: 15, scale: 2 }).notNull(),
  sinkBlueBucks: decimal("sinkBlueBucks", { precision: 15, scale: 2 }).notNull(),
  activeUsers: int("activeUsers").notNull(),
  netUnitsPerActiveUser: decimal("netUnitsPerActiveUser", { precision: 15, scale: 2 }).notNull(),
  inflationIndex: decimal("inflationIndex", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  schoolPeriodUnique: uniqueIndex("blue_bucks_inflation_school_period_unique").on(table.schoolCode, table.periodKey),
}));

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
 * BlueBlazer Exchange (BBX) — a fully fictional, ring-fenced educational
 * market simulation. These tables do not alter the canonical Blue Bucks wallet.
 */
export const bbxCompanies = mysqlTable("bbxCompanies", {
  id: int("id").autoincrement().primaryKey(),
  ticker: varchar("ticker", { length: 16 }).notNull().unique(),
  symbol: varchar("symbol", { length: 8 }).notNull(),
  companyName: varchar("companyName", { length: 120 }).notNull(),
  sector: varchar("sector", { length: 64 }).notNull(),
  description: text("description").notNull(),
  startingPrice: decimal("startingPrice", { precision: 18, scale: 6 }).notNull(),
  currentPrice: decimal("currentPrice", { precision: 18, scale: 6 }).notNull(),
  previousClose: decimal("previousClose", { precision: 18, scale: 6 }).notNull(),
  fundamentalValue: decimal("fundamentalValue", { precision: 18, scale: 6 }).notNull(),
  sharesOutstanding: decimal("sharesOutstanding", { precision: 24, scale: 0 }).notNull(),
  revenue: decimal("revenue", { precision: 24, scale: 2 }).notNull(),
  netIncome: decimal("netIncome", { precision: 24, scale: 2 }).notNull(),
  eps: decimal("eps", { precision: 18, scale: 6 }).notNull(),
  debt: decimal("debt", { precision: 24, scale: 2 }).notNull(),
  cash: decimal("cash", { precision: 24, scale: 2 }).notNull(),
  revenueGrowth: decimal("revenueGrowth", { precision: 10, scale: 6 }).notNull(),
  profitMargin: decimal("profitMargin", { precision: 10, scale: 6 }).notNull(),
  baseVolatility: decimal("baseVolatility", { precision: 10, scale: 6 }).notNull(),
  beta: decimal("beta", { precision: 10, scale: 6 }).notNull(),
  liquidityScore: decimal("liquidityScore", { precision: 10, scale: 6 }).notNull(),
  sentiment: decimal("sentiment", { precision: 10, scale: 6 }).notNull().default("0"),
  temporaryOrderImpact: decimal("temporaryOrderImpact", { precision: 10, scale: 8 }).notNull().default("0"),
  status: mysqlEnum("status", ["active", "halted", "inactive"]).notNull().default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ sectorIndex: index("bbx_companies_sector_idx").on(table.sector) }));
export type BbxCompany = typeof bbxCompanies.$inferSelect;

export const bbxMarketState = mysqlTable("bbxMarketState", {
  id: int("id").primaryKey(),
  marketRegime: mysqlEnum("marketRegime", ["bull", "neutral", "bear", "high_volatility"]).notNull().default("neutral"),
  benchmarkLevel: decimal("benchmarkLevel", { precision: 18, scale: 6 }).notNull().default("100"),
  previousBenchmarkLevel: decimal("previousBenchmarkLevel", { precision: 18, scale: 6 }).notNull().default("100"),
  baseInterestRate: decimal("baseInterestRate", { precision: 10, scale: 6 }).notNull().default("0.04"),
  inflationRate: decimal("inflationRate", { precision: 10, scale: 6 }).notNull().default("0.025"),
  gdpGrowth: decimal("gdpGrowth", { precision: 10, scale: 6 }).notNull().default("0.02"),
  oilPriceIndex: decimal("oilPriceIndex", { precision: 18, scale: 6 }).notNull().default("100"),
  consumerConfidence: decimal("consumerConfidence", { precision: 18, scale: 6 }).notNull().default("100"),
  volatilityIndex: decimal("volatilityIndex", { precision: 18, scale: 6 }).notNull().default("20"),
  simulationSpeed: decimal("simulationSpeed", { precision: 10, scale: 4 }).notNull().default("5"),
  marketOpen: boolean("marketOpen").notNull().default(true),
  tickNumber: int("tickNumber").notNull().default(0),
  simulationTimestamp: timestamp("simulationTimestamp").defaultNow().notNull(),
  lastTickAt: timestamp("lastTickAt"),
  lastBlueNewsScheduleKey: varchar("lastBlueNewsScheduleKey", { length: 32 }),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ scheduleTaskIndex: index("bbx_market_state_schedule_task_idx").on(table.scheduleCronTaskUid) }));

export const bbxEvents = mysqlTable("bbxEvents", {
  id: int("id").autoincrement().primaryKey(),
  templateId: varchar("templateId", { length: 32 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  subtype: varchar("subtype", { length: 64 }).notNull(),
  scope: mysqlEnum("scope", ["company", "sector", "market"]).notNull(),
  companyId: int("companyId").references(() => bbxCompanies.id, { onDelete: "set null" }),
  sector: varchar("sector", { length: 64 }),
  severity: mysqlEnum("severity", ["low", "medium", "high", "severe"]).notNull(),
  directCompanyTargetReturn: decimal("directCompanyTargetReturn", { precision: 10, scale: 6 }).notNull().default("0"),
  sectorTargetMagnitude: decimal("sectorTargetMagnitude", { precision: 10, scale: 6 }).notNull().default("0"),
  marketTargetReturn: decimal("marketTargetReturn", { precision: 10, scale: 6 }).notNull().default("0"),
  fundamentalTargetChange: decimal("fundamentalTargetChange", { precision: 10, scale: 6 }).notNull().default("0"),
  sentimentImpact: decimal("sentimentImpact", { precision: 10, scale: 6 }).notNull().default("0"),
  volatilityMultiplier: decimal("volatilityMultiplier", { precision: 10, scale: 6 }).notNull().default("1"),
  durationTicks: int("durationTicks").notNull(),
  decayRate: decimal("decayRate", { precision: 10, scale: 6 }).notNull(),
  sectorBias: json("sectorBias"),
  facts: json("facts"),
  expectedValue: decimal("expectedValue", { precision: 24, scale: 6 }),
  actualValue: decimal("actualValue", { precision: 24, scale: 6 }),
  surprisePercent: decimal("surprisePercent", { precision: 10, scale: 6 }),
  startTick: int("startTick").notNull(),
  status: mysqlEnum("status", ["active", "expired", "cancelled"]).notNull().default("active"),
  createdBy: mysqlEnum("createdBy", ["system", "admin"]).notNull().default("system"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ statusTickIndex: index("bbx_events_status_tick_idx").on(table.status, table.startTick), companyIndex: index("bbx_events_company_idx").on(table.companyId) }));

export const bbxNews = mysqlTable("bbxNews", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull().references(() => bbxEvents.id, { onDelete: "cascade" }).unique(),
  headline: varchar("headline", { length: 220 }).notNull(),
  body: text("body").notNull(),
  whyItMatters: text("whyItMatters").notNull(),
  scopeLabel: varchar("scopeLabel", { length: 16 }).notNull(),
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
  isSimulated: boolean("isSimulated").notNull().default(true),
}, (table) => ({ publishedIndex: index("bbx_news_published_idx").on(table.publishedAt) }));

export const bbxNewsReads = mysqlTable("bbxNewsReads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  newsId: int("newsId").notNull().references(() => bbxNews.id, { onDelete: "cascade" }),
  readAt: timestamp("readAt").defaultNow().notNull(),
  rewardedAt: timestamp("rewardedAt"),
}, (table) => ({
  userNewsUnique: uniqueIndex("bbx_news_read_user_news_unique").on(table.userId, table.newsId),
  userReadIndex: index("bbx_news_read_user_read_idx").on(table.userId, table.readAt),
}));

export const bbxPriceHistory = mysqlTable("bbxPriceHistory", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().references(() => bbxCompanies.id, { onDelete: "cascade" }),
  tickNumber: int("tickNumber").notNull(),
  simulationTimestamp: timestamp("simulationTimestamp").notNull(),
  price: decimal("price", { precision: 18, scale: 6 }).notNull(),
  benchmarkFactor: decimal("benchmarkFactor", { precision: 12, scale: 8 }).notNull().default("0"),
  sectorFactor: decimal("sectorFactor", { precision: 12, scale: 8 }).notNull().default("0"),
  eventFactor: decimal("eventFactor", { precision: 12, scale: 8 }).notNull().default("0"),
  userImpactFactor: decimal("userImpactFactor", { precision: 12, scale: 8 }).notNull().default("0"),
  meanReversionFactor: decimal("meanReversionFactor", { precision: 12, scale: 8 }).notNull().default("0"),
  noiseFactor: decimal("noiseFactor", { precision: 12, scale: 8 }).notNull().default("0"),
  volume: int("volume").notNull().default(0),
}, (table) => ({ companyTickUnique: uniqueIndex("bbx_price_company_tick_unique").on(table.companyId, table.tickNumber), timeIndex: index("bbx_price_time_idx").on(table.simulationTimestamp) }));

export const bbxAccounts = mysqlTable("bbxAccounts", {
  userId: int("userId").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  cashBalance: decimal("cashBalance", { precision: 20, scale: 4 }).notNull().default("10000"),
  startingBalance: decimal("startingBalance", { precision: 20, scale: 4 }).notNull().default("10000"),
  realizedPnl: decimal("realizedPnl", { precision: 20, scale: 4 }).notNull().default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const bbxPositions = mysqlTable("bbxPositions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  companyId: int("companyId").notNull().references(() => bbxCompanies.id, { onDelete: "cascade" }),
  quantity: decimal("quantity", { precision: 20, scale: 6 }).notNull().default("0"),
  averageCost: decimal("averageCost", { precision: 20, scale: 6 }).notNull().default("0"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ userCompanyUnique: uniqueIndex("bbx_position_user_company_unique").on(table.userId, table.companyId), userIndex: index("bbx_positions_user_idx").on(table.userId) }));

export const bbxOrders = mysqlTable("bbxOrders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  companyId: int("companyId").notNull().references(() => bbxCompanies.id, { onDelete: "cascade" }),
  side: mysqlEnum("side", ["buy", "sell"]).notNull(),
  requestedQuantity: decimal("requestedQuantity", { precision: 20, scale: 6 }).notNull(),
  filledQuantity: decimal("filledQuantity", { precision: 20, scale: 6 }).notNull(),
  fillPrice: decimal("fillPrice", { precision: 20, scale: 6 }).notNull(),
  grossAmount: decimal("grossAmount", { precision: 20, scale: 4 }).notNull(),
  spreadCost: decimal("spreadCost", { precision: 20, scale: 4 }).notNull(),
  slippageCost: decimal("slippageCost", { precision: 20, scale: 4 }).notNull(),
  status: mysqlEnum("status", ["filled", "rejected"]).notNull(),
  idempotencyKey: varchar("idempotencyKey", { length: 80 }).notNull(),
  rejectionReason: varchar("rejectionReason", { length: 255 }),
  tickNumber: int("tickNumber").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ userKeyUnique: uniqueIndex("bbx_order_user_key_unique").on(table.userId, table.idempotencyKey), userTimeIndex: index("bbx_order_user_time_idx").on(table.userId, table.createdAt) }));

export const bbxLedger = mysqlTable("bbxLedger", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  orderId: int("orderId").references(() => bbxOrders.id, { onDelete: "set null" }),
  amount: decimal("amount", { precision: 20, scale: 4 }).notNull(),
  balanceAfter: decimal("balanceAfter", { precision: 20, scale: 4 }).notNull(),
  reason: mysqlEnum("reason", ["initial_grant", "trade_buy", "trade_sell", "news_read_reward", "reset"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ userTimeIndex: index("bbx_ledger_user_time_idx").on(table.userId, table.createdAt) }));

export const bbxAdminAudit = mysqlTable("bbxAdminAudit", {
  id: int("id").autoincrement().primaryKey(),
  adminUserId: int("adminUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 80 }).notNull(),
  payload: json("payload"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ createdIndex: index("bbx_admin_audit_created_idx").on(table.createdAt) }));

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
 * Project-level Heartbeat ownership for daily, deterministic credit-score refreshes.
 */
export const creditScoreUpdateSchedule = mysqlTable("creditScoreUpdateSchedule", {
  id: int("id").autoincrement().primaryKey(),
  taskUid: varchar("taskUid", { length: 65 }).notNull(),
  lastRunAt: timestamp("lastRunAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ taskUidUnique: uniqueIndex("credit_score_schedule_task_uid_unique").on(table.taskUid) }));

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
  paymentReliabilityWeight: decimal("paymentReliabilityWeight", { precision: 5, scale: 2 }).default("30").notNull(),
  accountHistoryWeight: decimal("accountHistoryWeight", { precision: 5, scale: 2 }).default("20").notNull(),
  practiceConsistencyWeight: decimal("practiceConsistencyWeight", { precision: 5, scale: 2 }).default("25").notNull(),
  netWorthWeight: decimal("netWorthWeight", { precision: 5, scale: 2 }).default("15").notNull(),
  spendingBehaviorWeight: decimal("spendingBehaviorWeight", { precision: 5, scale: 2 }).default("10").notNull(),
  onTimePaymentPoints: int("onTimePaymentPoints").default(2).notNull(),
  missedPaymentPenalty: int("missedPaymentPenalty").default(15).notNull(),
  savingsInterestRate: decimal("savingsInterestRate", { precision: 5, scale: 2 }).default("7.0").notNull(),
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
