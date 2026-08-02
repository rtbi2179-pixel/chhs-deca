import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, primaryKey, unique, boolean } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { users } from "./schema";

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

export const piFlashcards = mysqlTable("piFlashcards", {
  id: int("id").autoincrement().primaryKey(),
  sectionId: int("sectionId").notNull().references(() => piModuleSections.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  type: mysqlEnum("type", ["multiple_choice", "true_false", "fill_in_the_blank"]).notNull(),
  options: text("options"), // JSON string for multiple choice options
  correctAnswer: text("correctAnswer"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const piQuizQuestions = mysqlTable("piQuizQuestions", {
  id: int("id").autoincrement().primaryKey(),
  sectionId: int("sectionId").notNull().references(() => piModuleSections.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  options: text("options"), // JSON string for multiple choice options
  correctAnswer: text("correctAnswer").notNull(),
  rationale: text("rationale"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const piScenarioChallenges = mysqlTable("piScenarioChallenges", {
  id: int("id").autoincrement().primaryKey(),
  sectionId: int("sectionId").notNull().references(() => piModuleSections.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  scenarioText: text("scenarioText").notNull(),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).notNull(),
  expectedResponse: text("expectedResponse"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

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

// Relations
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
