import { and, asc, eq, isNotNull } from "drizzle-orm";
import { blazerBuddyMessages, creditScores, users } from "../drizzle/schema";
import { getDb } from "./db";

export const BLAZER_BUDDY_CONTACT = {
  id: -1,
  name: "Blazer Buddy",
  firstName: "Blazer",
  lastName: "Buddy",
  email: "",
  role: "assistant",
} as const;

const DAILY_TIP = "Quick tip: answer a short set of practice questions today, then use your accuracy and the explanation notes to choose one PI to review next.";

export function getGuidedBlazerBuddyReply(message: string): string {
  const question = message.trim().toLowerCase();
  if (!question) return "Tell me what you are working on, and I will point you to the right Blue Blazer tool.";
  if (/(credit|score|payment|debt|utilization)/.test(question)) return "Your credit score refreshes once each day. You can review the current score and its history in Banking & Cards. Consistent practice, account history, payment reliability, and financial activity all contribute to the simulation.";
  if (/(blue buck|bank|saving|checking|investment|bbx|stock|market)/.test(question)) return "Blue Bucks earned through Blue Blazer credit Checking automatically. From Banking & Cards, you can move funds to Savings or the Investment Account; the Investment Account is the buying power used in BBX.";
  if (/(pi|performance indicator|study library|flashcard|lesson|teach.?back)/.test(question)) return "Open PI Study Library, choose your event, and start with its mapped Performance Indicators. Each module includes a lesson, vocabulary, flashcards, quick review, quiz, scenarios, related concepts, and teach-back practice.";
  if (/(practice|question|accuracy|mock|exam|test)/.test(question)) return "Use Practice for focused cluster questions and Mock Exams to simulate a longer assessment. After a mock exam, review the study guide for the PIs and larger concepts that need the most attention.";
  if (/(event|roleplay|written|competition|icdc)/.test(question)) return "Visit Events & Community to explore competitive events and their mapped PIs. If you are unsure which event fits, take the Event Match Quiz from your Overview study path.";
  if (/(tip|help|start|what should i|what do i)/.test(question)) return DAILY_TIP;
  return `I am a guided Blue Blazer helper, so I can assist with practice, PIs, events, Banking & Cards, Blue Bucks, BBX, and credit-score updates. ${DAILY_TIP}`;
}

export async function getBlazerBuddyConversation(userId: number, schoolCode: string) {
  const database = await getDb();
  if (!database) throw new Error("Blazer Buddy storage is unavailable");
  let rows = await database.select().from(blazerBuddyMessages).where(and(
    eq(blazerBuddyMessages.userId, userId),
    eq(blazerBuddyMessages.schoolCode, schoolCode),
  )).orderBy(asc(blazerBuddyMessages.createdAt));
  if (rows.length === 0) {
    await database.insert(blazerBuddyMessages).values({
      userId,
      schoolCode,
      speaker: "buddy",
      notificationKey: "welcome",
      body: `Hi, I’m Blazer Buddy. I can help you find the right study tools, understand Blue Bucks and BBX, explore events and PIs, and keep track of credit-score refreshes. ${DAILY_TIP}`,
    }).onDuplicateKeyUpdate({ set: { schoolCode } });
    rows = await database.select().from(blazerBuddyMessages).where(and(
      eq(blazerBuddyMessages.userId, userId),
      eq(blazerBuddyMessages.schoolCode, schoolCode),
    )).orderBy(asc(blazerBuddyMessages.createdAt));
  }
  return rows.map((message) => ({
    id: message.id,
    senderId: message.speaker === "member" ? userId : BLAZER_BUDDY_CONTACT.id,
    recipientId: message.speaker === "member" ? BLAZER_BUDDY_CONTACT.id : userId,
    body: message.body,
    readAt: message.readAt,
    createdAt: message.createdAt,
  }));
}

export async function sendGuidedBlazerBuddyMessage(userId: number, schoolCode: string, body: string) {
  const database = await getDb();
  if (!database) throw new Error("Blazer Buddy storage is unavailable");
  const memberBody = body.trim();
  const buddyBody = getGuidedBlazerBuddyReply(memberBody);
  await database.insert(blazerBuddyMessages).values([
    { userId, schoolCode, speaker: "member", body: memberBody },
    { userId, schoolCode, speaker: "buddy", body: buddyBody },
  ]);
  return getBlazerBuddyConversation(userId, schoolCode);
}

export async function postCreditScoreRefreshNotifications(now = new Date()) {
  const database = await getDb();
  if (!database) throw new Error("Blazer Buddy storage is unavailable");
  const notificationKey = `credit-score-refresh-${now.toISOString().slice(0, 10)}`;
  const members = await database.select({ id: users.id, schoolCode: users.schoolCode })
    .from(users)
    .where(isNotNull(users.schoolCode));
  let posted = 0;
  for (const member of members) {
    if (!member.schoolCode) continue;
    const [existing] = await database.select({ id: blazerBuddyMessages.id }).from(blazerBuddyMessages).where(and(
      eq(blazerBuddyMessages.userId, member.id),
      eq(blazerBuddyMessages.notificationKey, notificationKey),
    )).limit(1);
    if (existing) continue;
    const [score] = await database.select({ score: creditScores.score }).from(creditScores)
      .where(and(eq(creditScores.userId, member.id), eq(creditScores.schoolCode, member.schoolCode)))
      .limit(1);
    const currentScore = score?.score ?? null;
    const body = currentScore === null
      ? "Your daily credit-score refresh is complete. Open Banking & Cards to review your refreshed credit profile."
      : `Your daily credit-score refresh is complete. Your current simulated credit score is ${currentScore}. Open Banking & Cards to review the score history and factors.`;
    await database.insert(blazerBuddyMessages).values({ userId: member.id, schoolCode: member.schoolCode, speaker: "buddy", body, notificationKey });
    posted += 1;
  }
  return { notificationKey, posted };
}
