import { eq, and, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, volunteerOpportunities, volunteerSignups, discussionThreads, discussionReplies, VolunteerSignup, DiscussionThread, DiscussionReply, bookmarks, leaderboard, questions, studySessions, sessionQuestions, schoolCodes, emailBlacklist, schoolCodeAttempts } from "../drizzle/schema";
import { ENV } from './_core/env';
import bcrypt from 'bcryptjs';

const ADMIN_EMAILS = ['rtbi2179@gmail.com', 'sahan.mallampati@gmail.com'];

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId || (user.email && ADMIN_EMAILS.includes(user.email))) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Volunteer queries
export async function createVolunteerSignup(userId: number, opportunityId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(volunteerSignups).values({
    userId,
    opportunityId,
    status: "signed_up",
  });
  return result;
}

export async function getVolunteersByOpportunity(opportunityId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const signups = await db.select({
    signup: volunteerSignups,
    user: users,
  }).from(volunteerSignups)
    .innerJoin(users, eq(volunteerSignups.userId, users.id))
    .where(eq(volunteerSignups.opportunityId, opportunityId));
  
  return signups;
}

export async function getUserVolunteerSignups(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(volunteerSignups)
    .where(eq(volunteerSignups.userId, userId));
}

export async function getAllVolunteerSignups() {
  const db = await getDb();
  if (!db) return [];
  
  const signups = await db.select({
    signup: volunteerSignups,
    user: users,
  }).from(volunteerSignups)
    .innerJoin(users, eq(volunteerSignups.userId, users.id));
  
  return signups;
}

// Discussion queries
export async function createDiscussionThread(userId: number, title: string, content: string, category: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(discussionThreads).values({
    userId,
    title,
    content,
    category,
  });
  return result;
}

export async function getDiscussionThreads(category?: string) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select({
    thread: discussionThreads,
    author: users,
  }).from(discussionThreads)
    .innerJoin(users, eq(discussionThreads.userId, users.id));
  
  if (category) {
    query = query.where(eq(discussionThreads.category, category)) as any;
  }
  
  return query;
}

export async function createDiscussionReply(threadId: number, userId: number, content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(discussionReplies).values({
    threadId,
    userId,
    content,
  });
  return result;
}

export async function getDiscussionReplies(threadId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    reply: discussionReplies,
    author: users,
  }).from(discussionReplies)
    .innerJoin(users, eq(discussionReplies.userId, users.id))
    .where(eq(discussionReplies.threadId, threadId));
}

// Delete discussion thread (only owner or admin)
export async function deleteDiscussionThread(threadId: number, userId: number, userRole: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const thread = await db.select().from(discussionThreads).where(eq(discussionThreads.id, threadId)).limit(1);
    if (thread.length === 0) return false;

    // Only owner or admin can delete
    if (thread[0].userId !== userId && userRole !== 'admin') return false;

    // Delete replies first
    await db.delete(discussionReplies).where(eq(discussionReplies.threadId, threadId));
    // Then delete thread
    await db.delete(discussionThreads).where(eq(discussionThreads.id, threadId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete thread:", error);
    return false;
  }
}

// Delete discussion reply (only owner or admin)
export async function deleteDiscussionReply(replyId: number, userId: number, userRole: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const reply = await db.select().from(discussionReplies).where(eq(discussionReplies.id, replyId)).limit(1);
    if (reply.length === 0) return false;

    // Only owner or admin can delete
    if (reply[0].userId !== userId && userRole !== 'admin') return false;

    await db.delete(discussionReplies).where(eq(discussionReplies.id, replyId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete reply:", error);
    return false;
  }
}

// Bookmark queries
export async function addBookmark(userId: number, questionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(bookmarks).values({
    userId,
    questionId,
  });
  return result;
}

export async function removeBookmark(userId: number, questionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.delete(bookmarks).where(
    and(eq(bookmarks.userId, userId), eq(bookmarks.questionId, questionId))
  );
}

export async function getUserBookmarks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(bookmarks).where(eq(bookmarks.userId, userId));
}

export async function isQuestionBookmarked(userId: number, questionId: number) {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db.select().from(bookmarks).where(
    and(eq(bookmarks.userId, userId), eq(bookmarks.questionId, questionId))
  ).limit(1);
  
  return result.length > 0;
}

// Leaderboard queries
export async function getLeaderboard(limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    leaderboard: leaderboard,
    user: users,
  }).from(leaderboard)
    .innerJoin(users, eq(leaderboard.userId, users.id))
    .orderBy((t) => t.leaderboard.accuracyPercentage)
    .limit(limit);
}

export async function getLeaderboardByCluster(cluster: string, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(leaderboard)
    .innerJoin(users, eq(leaderboard.userId, users.id))
    .orderBy((t) => t.leaderboard.accuracyPercentage)
    .limit(limit);
}

export async function updateLeaderboard(userId: number, correctAnswers: number, totalAnswered: number, cluster: string) {
  const db = await getDb();
  if (!db) return;
  
  const accuracy = Math.round((correctAnswers / totalAnswered) * 100);
  const existing = await db.select().from(leaderboard).where(eq(leaderboard.userId, userId)).limit(1);
  
  if (existing.length === 0) {
    await db.insert(leaderboard).values({
      userId,
      totalQuestionsAnswered: totalAnswered,
      totalCorrectAnswers: correctAnswers,
      accuracyPercentage: accuracy,
    });
  } else {
    await db.update(leaderboard).set({
      totalQuestionsAnswered: existing[0].totalQuestionsAnswered + totalAnswered,
      totalCorrectAnswers: existing[0].totalCorrectAnswers + correctAnswers,
      accuracyPercentage: accuracy,
      lastUpdated: new Date(),
    }).where(eq(leaderboard.userId, userId));
  }
}

// Study Sessions
export async function getBookmarkedQuestionsWithDetails(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const bookmarkedIds = await db.select({ questionId: bookmarks.questionId })
    .from(bookmarks)
    .where(eq(bookmarks.userId, userId));
  
  if (bookmarkedIds.length === 0) return [];
  
  const questionIds = bookmarkedIds.map(b => b.questionId);
  const questionsData = await db.select()
    .from(questions)
    .where(inArray(questions.id, questionIds));
  
  return questionsData;
}

export async function createStudySession(userId: number, name: string, questionIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const session = await db.insert(studySessions).values({
    userId,
    title: name,
    totalQuestions: questionIds.length,
  });
  
  if (questionIds.length > 0) {
    await db.insert(sessionQuestions).values(
      questionIds.map(qId => ({
        sessionId: session[0].insertId,
        questionId: qId,
      }))
    );
  }
  
  return session;
}


// Custom Authentication Functions

/**
 * Validate school code against whitelist
 */
export async function validateSchoolCode(code: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db.select()
    .from(schoolCodes)
    .where(and(eq(schoolCodes.code, code), eq(schoolCodes.isActive, 1)))
    .limit(1);

  return result.length > 0;
}

/**
 * Create a new user with custom auth (username/password/school code)
 */
export async function createCustomAuthUser(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  schoolCode: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Validate school code
  const isValidCode = await validateSchoolCode(schoolCode);
  if (!isValidCode) {
    throw new Error("Invalid or inactive school code");
  }

  // Check if email already exists
  const existingUser = await db.select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new Error("Email already exists");
  }

  // Hash password
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create user
  const result = await db.insert(users).values({
    firstName,
    lastName,
    email,
    passwordHash,
    schoolCode,
    name: `${firstName} ${lastName}`,
    loginMethod: "custom",
    role: "user",
  });

  return result;
}

/**
 * Authenticate user with username and password
 */
export async function authenticateUser(email: string, password: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const user = await db.select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (user.length === 0) {
    throw new Error("Invalid email or password");
  }

  const foundUser = user[0];
  if (!foundUser.passwordHash) {
    throw new Error("Invalid email or password");
  }

  // Compare password
  const isPasswordValid = await bcrypt.compare(password, foundUser.passwordHash);
  if (!isPasswordValid) {
    throw new Error("Invalid username or password");
  }

  // Update last signed in
  await db.update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, foundUser.id));

  return foundUser;
}

/**
 * Get user by username
 */
export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Get all active school codes
 */
export async function getActiveSchoolCodes() {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(schoolCodes)
    .where(eq(schoolCodes.isActive, 1));
}


/**
 * Get user by ID (for custom auth)
 */
export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}


/**
 * Request password reset
 */
export async function requestPasswordReset(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const user = await db.select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (user.length === 0) {
    throw new Error("Email not found");
  }

  const token = require('crypto').randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.update(users)
    .set({
      passwordResetToken: token,
      passwordResetExpiresAt: expiresAt,
    })
    .where(eq(users.id, user[0].id));

  return { token, email: user[0].email };
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const user = await db.select()
    .from(users)
    .where(eq(users.passwordResetToken, token))
    .limit(1);

  if (user.length === 0) {
    throw new Error("Invalid or expired reset token");
  }

  const foundUser = user[0];
  if (!foundUser.passwordResetExpiresAt || new Date() > foundUser.passwordResetExpiresAt) {
    throw new Error("Reset token has expired");
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);

  await db.update(users)
    .set({
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    })
    .where(eq(users.id, foundUser.id));

  return { success: true };
}

/**
 * Send email verification
 */
export async function sendEmailVerification(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const token = require('crypto').randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await db.update(users)
    .set({
      emailVerificationToken: token,
      emailVerificationExpiresAt: expiresAt,
    })
    .where(eq(users.id, userId));

  const user = await getUserById(userId);
  return { token, email: user?.email };
}

/**
 * Verify email with token
 */
export async function verifyEmail(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const user = await db.select()
    .from(users)
    .where(eq(users.emailVerificationToken, token))
    .limit(1);

  if (user.length === 0) {
    throw new Error("Invalid verification token");
  }

  const foundUser = user[0];
  if (!foundUser.emailVerificationExpiresAt || new Date() > foundUser.emailVerificationExpiresAt) {
    throw new Error("Verification token has expired");
  }

  await db.update(users)
    .set({
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiresAt: null,
    })
    .where(eq(users.id, foundUser.id));

  return { success: true };
}

/**
 * Generate and send 2FA code
 */
export async function generateTwoFactorCode(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await db.update(users)
    .set({
      twoFactorCode: code,
      twoFactorExpiresAt: expiresAt,
    })
    .where(eq(users.id, userId));

  const user = await getUserById(userId);
  return { code, email: user?.email };
}

/**
 * Verify 2FA code
 */
export async function verifyTwoFactorCode(userId: number, code: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");

  if (user.twoFactorCode !== code) {
    throw new Error("Invalid verification code");
  }

  if (!user.twoFactorExpiresAt || new Date() > user.twoFactorExpiresAt) {
    throw new Error("Verification code has expired");
  }

  await db.update(users)
    .set({
      twoFactorCode: null,
      twoFactorExpiresAt: null,
    })
    .where(eq(users.id, userId));

  return { success: true };
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return result[0] || null;
}

/**
 * Check if email is blacklisted
 */
export async function isEmailBlacklisted(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select()
    .from(emailBlacklist)
    .where(eq(emailBlacklist.email, email))
    .limit(1);
  return result.length > 0;
}

/**
 * Blacklist an email
 */
export async function blacklistEmail(email: string, reason: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(emailBlacklist)
    .values({ email, reason })
    .onDuplicateKeyUpdate({ set: { reason } });
}

/**
 * Track school code attempt
 */
export async function trackSchoolCodeAttempt(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db.select()
    .from(schoolCodeAttempts)
    .where(eq(schoolCodeAttempts.email, email))
    .limit(1);
  
  if (existing.length > 0) {
    await db.update(schoolCodeAttempts)
      .set({ attemptCount: existing[0].attemptCount + 1 })
      .where(eq(schoolCodeAttempts.email, email));
  } else {
    await db.insert(schoolCodeAttempts)
      .values({ email, attemptCount: 1 });
  }
  
  const updated = await db.select()
    .from(schoolCodeAttempts)
    .where(eq(schoolCodeAttempts.email, email))
    .limit(1);
  
  return updated[0]?.attemptCount || 0;
}

/**
 * Get school code attempts for email
 */
export async function getSchoolCodeAttempts(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select()
    .from(schoolCodeAttempts)
    .where(eq(schoolCodeAttempts.email, email))
    .limit(1);
  return result[0]?.attemptCount || 0;
}

/**
 * Reset school code attempts
 */
export async function resetSchoolCodeAttempts(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(schoolCodeAttempts)
    .where(eq(schoolCodeAttempts.email, email));
}
