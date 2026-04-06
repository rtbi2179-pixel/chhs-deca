import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, volunteerOpportunities, volunteerSignups, discussionThreads, discussionReplies, VolunteerSignup, DiscussionThread, DiscussionReply } from "../drizzle/schema";
import { ENV } from './_core/env';

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
