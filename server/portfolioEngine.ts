import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, isNull, ne } from "drizzle-orm";
import {
  blazerBuddyMessages,
  decaTeamMembers,
  decaTeams,
  portfolioAuditLog,
  portfolioCheckpointAssignments,
  portfolioCheckpointTimelineLinks,
  portfolioCheckpoints,
  portfolioSubmissions,
  timelineItems,
  userEventTimelines,
  users,
} from "../drizzle/schema";
import { getDb } from "./db";

export const PORTFOLIO_SEASON = "2026-2027";

export type ChapterUser = {
  id: number;
  role: string;
  schoolCode?: string | null;
  selectedSchoolCode?: string | null;
};

export type CheckpointAssignmentInput =
  | { assignmentType: "chapter" }
  | { assignmentType: "event"; eventCode: string }
  | { assignmentType: "team"; teamId: number }
  | { assignmentType: "member"; memberId: number };

export type PortfolioSubject = {
  subjectType: "member" | "team";
  subjectKey: string;
  memberId: number | null;
  teamId: number | null;
  eventCode: string;
  memberIds: number[];
};

type Database = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export function requirePortfolioAdminSchool(user: ChapterUser, requestedSchoolCode?: string | null) {
  if (user.role !== "admin" && user.role !== "super_admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only chapter administrators can manage competition portfolios." });
  }
  const schoolCode = user.role === "super_admin"
    ? requestedSchoolCode || user.selectedSchoolCode || user.schoolCode
    : user.schoolCode;
  if (!schoolCode) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a chapter before managing its portfolios." });
  }
  return schoolCode;
}

export function requireMemberSchool(user: ChapterUser) {
  const schoolCode = user.schoolCode;
  if (!schoolCode) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Your account must be associated with a chapter before using portfolio tools." });
  }
  return schoolCode;
}

export async function requirePortfolioDatabase(): Promise<Database> {
  const database = await getDb();
  if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Portfolio storage is unavailable." });
  return database;
}

export async function assertChapterMember(database: Database, memberId: number, schoolCode: string) {
  const [member] = await database.select({
    id: users.id,
    schoolCode: users.schoolCode,
    primaryEventCode: users.primaryEventCode,
    name: users.name,
  }).from(users).where(and(eq(users.id, memberId), eq(users.schoolCode, schoolCode))).limit(1);
  if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "That member is not part of this chapter." });
  return member;
}

export async function getCheckpointForSchool(database: Database, checkpointId: number, schoolCode: string) {
  const [checkpoint] = await database.select().from(portfolioCheckpoints)
    .where(and(eq(portfolioCheckpoints.id, checkpointId), eq(portfolioCheckpoints.schoolCode, schoolCode)))
    .limit(1);
  if (!checkpoint) throw new TRPCError({ code: "NOT_FOUND", message: "That portfolio checkpoint was not found in this chapter." });
  return checkpoint;
}

export async function getTeamForSchool(database: Database, teamId: number, schoolCode: string) {
  const [team] = await database.select().from(decaTeams)
    .where(and(eq(decaTeams.id, teamId), eq(decaTeams.schoolCode, schoolCode), isNull(decaTeams.archivedAt)))
    .limit(1);
  if (!team) throw new TRPCError({ code: "NOT_FOUND", message: "That active chapter team was not found." });
  return team;
}

export async function getTeamMembers(database: Database, teamId: number) {
  return database.select({
    id: decaTeamMembers.id,
    teamId: decaTeamMembers.teamId,
    userId: users.id,
    memberRole: decaTeamMembers.memberRole,
    joinedAt: decaTeamMembers.joinedAt,
    name: users.name,
    email: users.email,
    primaryEventCode: users.primaryEventCode,
  }).from(decaTeamMembers)
    .innerJoin(users, eq(decaTeamMembers.userId, users.id))
    .where(and(eq(decaTeamMembers.teamId, teamId), isNull(decaTeamMembers.leftAt)))
    .orderBy(desc(decaTeamMembers.memberRole), users.name);
}

async function checkpointAssignments(database: Database, checkpointId: number) {
  return database.select().from(portfolioCheckpointAssignments)
    .where(eq(portfolioCheckpointAssignments.checkpointId, checkpointId));
}

/** Resolves assignment rules into actual individual or shared-team submission subjects. */
export async function resolveCheckpointSubjects(database: Database, checkpointId: number, schoolCode: string): Promise<PortfolioSubject[]> {
  const [assignments, roster, teamRows] = await Promise.all([
    checkpointAssignments(database, checkpointId),
    database.select({ id: users.id, primaryEventCode: users.primaryEventCode })
      .from(users)
      .where(and(eq(users.schoolCode, schoolCode), ne(users.role, "super_admin"))),
    database.select({
      teamId: decaTeams.id,
      eventCode: decaTeams.eventCode,
      memberId: decaTeamMembers.userId,
    }).from(decaTeamMembers)
      .innerJoin(decaTeams, eq(decaTeamMembers.teamId, decaTeams.id))
      .where(and(eq(decaTeams.schoolCode, schoolCode), isNull(decaTeams.archivedAt), isNull(decaTeamMembers.leftAt))),
  ]);

  const rosterById = new Map(roster.map((member) => [member.id, member]));
  const teamMembers = new Map<number, number[]>();
  const teamEvent = new Map<number, string>();
  const teamForMemberEvent = new Map<string, number>();
  for (const row of teamRows) {
    const members = teamMembers.get(row.teamId) ?? [];
    members.push(row.memberId);
    teamMembers.set(row.teamId, members);
    teamEvent.set(row.teamId, row.eventCode);
    teamForMemberEvent.set(`${row.memberId}:${row.eventCode}`, row.teamId);
  }

  const subjects = new Map<string, PortfolioSubject>();
  const addIndividualOrTeam = (memberId: number, forcedIndividual = false) => {
    const member = rosterById.get(memberId);
    if (!member) return;
    const eventCode = member.primaryEventCode ?? "UNASSIGNED";
    const teamId = forcedIndividual ? undefined : teamForMemberEvent.get(`${memberId}:${eventCode}`);
    if (teamId) {
      const subjectKey = `team:${teamId}`;
      subjects.set(subjectKey, {
        subjectType: "team",
        subjectKey,
        memberId: null,
        teamId,
        eventCode: teamEvent.get(teamId) ?? eventCode,
        memberIds: Array.from(new Set(teamMembers.get(teamId) ?? [memberId])),
      });
      return;
    }
    const subjectKey = `member:${memberId}`;
    subjects.set(subjectKey, { subjectType: "member", subjectKey, memberId, teamId: null, eventCode, memberIds: [memberId] });
  };

  for (const assignment of assignments) {
    if (assignment.assignmentType === "chapter") {
      roster.forEach((member) => addIndividualOrTeam(member.id));
      continue;
    }
    if (assignment.assignmentType === "event" && assignment.eventCode) {
      roster.filter((member) => member.primaryEventCode === assignment.eventCode).forEach((member) => addIndividualOrTeam(member.id));
      continue;
    }
    if (assignment.assignmentType === "team" && assignment.teamId) {
      const memberIds = Array.from(new Set(teamMembers.get(assignment.teamId) ?? []));
      if (!memberIds.length) continue;
      const subjectKey = `team:${assignment.teamId}`;
      subjects.set(subjectKey, {
        subjectType: "team",
        subjectKey,
        memberId: null,
        teamId: assignment.teamId,
        eventCode: teamEvent.get(assignment.teamId) ?? "UNASSIGNED",
        memberIds,
      });
      continue;
    }
    if (assignment.assignmentType === "member" && assignment.memberId) addIndividualOrTeam(assignment.memberId, true);
  }
  return Array.from(subjects.values());
}

export async function ensureCheckpointSubmissions(database: Database, checkpointId: number, schoolCode: string) {
  const subjects = await resolveCheckpointSubjects(database, checkpointId, schoolCode);
  for (const subject of subjects) {
    await database.insert(portfolioSubmissions).values({
      checkpointId,
      schoolCode,
      subjectType: subject.subjectType,
      subjectKey: subject.subjectKey,
      memberId: subject.memberId,
      teamId: subject.teamId,
      eventCode: subject.eventCode,
      status: "not_started",
    }).onDuplicateKeyUpdate({ set: { eventCode: subject.eventCode, updatedAt: new Date() } });
  }
  return subjects;
}

function timelineItemType(submissionType: string) {
  if (submissionType === "presentation") return "presentation" as const;
  if (submissionType === "pdf" || submissionType === "document" || submissionType === "spreadsheet") return "written_project" as const;
  return "general" as const;
}

/** Creates or updates only checkpoint-owned items; generated roadmap work stays untouched. */
export async function syncCheckpointTimelineItems(database: Database, checkpointId: number, schoolCode: string, onlyUserId?: number) {
  const checkpoint = await getCheckpointForSchool(database, checkpointId, schoolCode);
  const subjects = await resolveCheckpointSubjects(database, checkpointId, schoolCode);
  if (!checkpoint.dueAt || checkpoint.status !== "published") {
    return { subjects, created: 0, updated: 0, skipped: subjects.reduce((sum, subject) => sum + subject.memberIds.length, 0) };
  }
  const dueDate = checkpoint.dueAt.toISOString().slice(0, 10);
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const subject of subjects) {
    for (const userId of onlyUserId === undefined ? subject.memberIds : subject.memberIds.filter((memberId) => memberId === onlyUserId)) {
      const [timeline] = await database.select().from(userEventTimelines)
        .where(and(
          eq(userEventTimelines.userId, userId),
          eq(userEventTimelines.eventCode, subject.eventCode),
          eq(userEventTimelines.status, "active"),
        )).limit(1);
      if (!timeline) {
        skipped += 1;
        continue;
      }
      const [existingLink] = await database.select().from(portfolioCheckpointTimelineLinks)
        .where(and(eq(portfolioCheckpointTimelineLinks.checkpointId, checkpoint.id), eq(portfolioCheckpointTimelineLinks.userId, userId)))
        .limit(1);
      const itemValues = {
        timelineId: timeline.id,
        title: `${checkpoint.title} due`,
        description: checkpoint.description || "Chapter portfolio checkpoint. Upload the required competition work before the deadline.",
        itemType: timelineItemType(checkpoint.submissionType),
        dueDate,
        priority: checkpoint.required ? "high" as const : "normal" as const,
        estimatedMinutes: 30,
        deepLink: `/portfolio-upload?checkpoint=${checkpoint.id}`,
        completionMetric: "manual",
        completionTarget: 0,
        completionBaseline: 0,
        successCriteria: checkpoint.required ? "Upload the required portfolio version or complete the assigned checkpoint." : "Complete this optional chapter portfolio checkpoint.",
        hardDeadline: checkpoint.required,
        generatedReason: "This deadline was published by your chapter advisor through Member Management.",
        sortOrder: -100,
        updatedAt: new Date(),
      };
      if (existingLink) {
        await database.update(timelineItems).set(itemValues).where(eq(timelineItems.id, existingLink.timelineItemId));
        updated += 1;
        continue;
      }
      const inserted = await database.insert(timelineItems).values({ ...itemValues, status: "upcoming", createdAt: new Date() });
      const timelineItemId = Number((inserted as any)[0]?.insertId);
      await database.insert(portfolioCheckpointTimelineLinks).values({ checkpointId: checkpoint.id, userId, timelineId: timeline.id, timelineItemId });
      created += 1;
    }
  }
  return { subjects, created, updated, skipped };
}

export async function removeCheckpointTimelineItems(database: Database, checkpointId: number) {
  const links = await database.select().from(portfolioCheckpointTimelineLinks)
    .where(eq(portfolioCheckpointTimelineLinks.checkpointId, checkpointId));
  if (links.length) await database.delete(timelineItems).where(inArray(timelineItems.id, links.map((link) => link.timelineItemId)));
  return links.length;
}

export async function writePortfolioAudit(database: Database, input: {
  schoolCode: string;
  entityType: "team" | "checkpoint" | "submission" | "version" | "evaluation" | "integrity_finding" | "comment" | "timeline_link";
  entityId: number;
  action: string;
  actorUserId?: number | null;
  metadata?: Record<string, unknown>;
}) {
  await database.insert(portfolioAuditLog).values({ ...input, actorUserId: input.actorUserId ?? null, metadata: input.metadata ?? null });
}

/** Uses the existing persisted Blazer Buddy channel and an idempotent key. */
export async function postPortfolioNotification(database: Database, input: {
  userIds: number[];
  schoolCode: string;
  notificationKey: string;
  body: string;
}) {
  const recipientIds = Array.from(new Set(input.userIds));
  for (const userId of recipientIds) {
    await database.insert(blazerBuddyMessages).values({
      userId,
      schoolCode: input.schoolCode,
      speaker: "buddy",
      notificationKey: input.notificationKey,
      body: input.body,
    }).onDuplicateKeyUpdate({ set: { body: input.body, schoolCode: input.schoolCode } });
  }
  return recipientIds.length;
}

/** Delivers only deterministic 7-, 3-, 1-, and same-day checkpoint reminders. */
export async function postPortfolioDueDateNotifications(now = new Date()) {
  const database = await requirePortfolioDatabase();
  const checkpoints = await database.select().from(portfolioCheckpoints)
    .where(and(eq(portfolioCheckpoints.status, "published"), isNull(portfolioCheckpoints.archivedAt)));
  let notifications = 0;
  const checkpointIds: number[] = [];
  for (const checkpoint of checkpoints) {
    if (!checkpoint.dueAt) continue;
    const millisecondsRemaining = checkpoint.dueAt.getTime() - now.getTime();
    const daysRemaining = Math.ceil(millisecondsRemaining / 86_400_000);
    if (![7, 3, 1, 0].includes(daysRemaining) || millisecondsRemaining < -86_400_000) continue;
    const subjects = await resolveCheckpointSubjects(database, checkpoint.id, checkpoint.schoolCode);
    const userIds = subjects.flatMap((subject) => subject.memberIds);
    if (!userIds.length) continue;
    const timing = daysRemaining === 0 ? "is due today" : `is due in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`;
    notifications += await postPortfolioNotification(database, {
      userIds,
      schoolCode: checkpoint.schoolCode,
      notificationKey: `portfolio-checkpoint-reminder-${checkpoint.id}-${daysRemaining}-${checkpoint.dueAt.toISOString().slice(0, 10)}`,
      body: `Portfolio checkpoint reminder: ${checkpoint.title} ${timing}. Open your timeline to review the requirement or upload the next version.`,
    });
    checkpointIds.push(checkpoint.id);
  }
  return { notifications, checkpointIds };
}

export async function canUserAccessSubmission(database: Database, user: ChapterUser, submissionId: number, requestedSchoolCode?: string | null) {
  const [submission] = await database.select({
    submission: portfolioSubmissions,
    checkpoint: portfolioCheckpoints,
  }).from(portfolioSubmissions)
    .innerJoin(portfolioCheckpoints, eq(portfolioSubmissions.checkpointId, portfolioCheckpoints.id))
    .where(eq(portfolioSubmissions.id, submissionId)).limit(1);
  if (!submission) throw new TRPCError({ code: "NOT_FOUND", message: "That portfolio submission was not found." });
  const resolved = submission.submission;
  if (user.role === "admin" || user.role === "super_admin") {
    const schoolCode = requirePortfolioAdminSchool(user, requestedSchoolCode);
    if (schoolCode !== resolved.schoolCode) throw new TRPCError({ code: "FORBIDDEN", message: "This submission belongs to a different chapter." });
    return submission;
  }
  if (resolved.schoolCode !== requireMemberSchool(user)) throw new TRPCError({ code: "FORBIDDEN", message: "This submission belongs to a different chapter." });
  if (resolved.memberId === user.id) return submission;
  if (resolved.teamId) {
    const [membership] = await database.select({ id: decaTeamMembers.id }).from(decaTeamMembers)
      .where(and(eq(decaTeamMembers.teamId, resolved.teamId), eq(decaTeamMembers.userId, user.id), isNull(decaTeamMembers.leftAt)))
      .limit(1);
    if (membership) return submission;
  }
  throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this portfolio submission." });
}

export async function findAccessibleCheckpointSubjects(database: Database, checkpointId: number, schoolCode: string, userId: number) {
  const subjects = await resolveCheckpointSubjects(database, checkpointId, schoolCode);
  return subjects.filter((subject) => subject.memberIds.includes(userId));
}
