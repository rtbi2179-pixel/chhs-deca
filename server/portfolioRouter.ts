import { TRPCError } from "@trpc/server";
import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import {
  decaTeamMembers,
  decaTeams,
  decaAiJudgeRuleSets,
  eventPerformanceIndicators,
  piLearningModules,
  portfolioCheckpointAssignments,
  portfolioCheckpointTimelineLinks,
  portfolioCheckpoints,
  portfolioEvaluations,
  portfolioIntegrityFindings,
  portfolioReviewComments,
  portfolioSubmissionVersions,
  portfolioSubmissions,
  portfolioVersionFiles,
  timelineItems,
  users,
} from "../drizzle/schema";
import { extractWrittenDocument } from "./mediaAnalysis";
import {
  PORTFOLIO_SEASON,
  assertChapterMember,
  canUserAccessSubmission,
  ensureCheckpointSubmissions,
  findAccessibleCheckpointSubjects,
  getCheckpointForSchool,
  getTeamForSchool,
  getTeamMembers,
  postPortfolioNotification,
  removeCheckpointTimelineItems,
  requireMemberSchool,
  requirePortfolioAdminSchool,
  requirePortfolioDatabase,
  resolveCheckpointSubjects,
  syncCheckpointTimelineItems,
  writePortfolioAudit,
  type CheckpointAssignmentInput,
} from "./portfolioEngine";
import { protectedProcedure, router } from "./_core/trpc";
import { storageGet, storagePut } from "./storage";
import { evaluatePortfolioEvidence } from "./portfolioAiEngine";

const MAX_PORTFOLIO_FILE_BYTES = 12 * 1024 * 1024;
const MAX_FILE_BASE64_LENGTH = 16_800_000;

const checkpointInput = z.object({
  schoolCode: z.string().trim().min(1).max(50).optional(),
  title: z.string().trim().min(3).max(255),
  description: z.string().trim().max(4_000).optional(),
  dueAt: z.coerce.date().nullable().optional(),
  season: z.string().trim().min(4).max(20).default(PORTFOLIO_SEASON),
  submissionType: z.enum(["pdf", "document", "presentation", "image_evidence", "spreadsheet", "any_file", "multiple_files", "completion_check"]),
  required: z.boolean().default(true),
  allowLate: z.boolean().default(false),
  allowMultipleVersions: z.boolean().default(true),
  aiEvaluationMode: z.enum(["automatic", "advisor_launch", "disabled"]).default("advisor_launch"),
  manualReviewRequired: z.boolean().default(true),
  assignments: z.array(z.discriminatedUnion("assignmentType", [
    z.object({ assignmentType: z.literal("chapter") }),
    z.object({ assignmentType: z.literal("event"), eventCode: z.string().trim().min(2).max(20) }),
    z.object({ assignmentType: z.literal("team"), teamId: z.number().int().positive() }),
    z.object({ assignmentType: z.literal("member"), memberId: z.number().int().positive() }),
  ])).min(1).max(100),
});

type SubmissionType = z.infer<typeof checkpointInput>["submissionType"];

function fileExtension(mimeType: string, fileName: string) {
  const existing = fileName.split(".").pop()?.toLowerCase();
  if (existing && /^[a-z0-9]{1,10}$/.test(existing)) return existing;
  const extensions: Record<string, string> = {
    "application/pdf": "pdf",
    "text/plain": "txt",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.ms-excel": "xls",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  return extensions[mimeType] ?? "bin";
}

function enforceSubmissionFileType(submissionType: SubmissionType, mimeType: string) {
  const isImage = mimeType === "image/jpeg" || mimeType === "image/png" || mimeType === "image/webp";
  const isSpreadsheet = mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || mimeType === "application/vnd.ms-excel" || mimeType === "text/csv";
  const isDocument = mimeType === "application/pdf" || mimeType === "text/plain" || mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const isPresentation = mimeType === "application/pdf" || mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  if (submissionType === "pdf" && mimeType !== "application/pdf") throw new TRPCError({ code: "BAD_REQUEST", message: "This checkpoint requires a PDF upload." });
  if (submissionType === "document" && !isDocument) throw new TRPCError({ code: "BAD_REQUEST", message: "This checkpoint requires a supported document upload." });
  if (submissionType === "presentation" && !isPresentation) throw new TRPCError({ code: "BAD_REQUEST", message: "This checkpoint requires a PDF or presentation-deck upload." });
  if (submissionType === "image_evidence" && !isImage) throw new TRPCError({ code: "BAD_REQUEST", message: "This checkpoint requires JPEG, PNG, or WebP evidence." });
  if (submissionType === "spreadsheet" && !isSpreadsheet) throw new TRPCError({ code: "BAD_REQUEST", message: "This checkpoint requires a spreadsheet or CSV upload." });
}

function statusLabel(status: string) {
  return status.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

async function validateAssignments(database: Awaited<ReturnType<typeof requirePortfolioDatabase>>, schoolCode: string, assignments: CheckpointAssignmentInput[]) {
  const normalized: CheckpointAssignmentInput[] = [];
  const seen = new Set<string>();
  for (const assignment of assignments) {
    const key = assignment.assignmentType === "chapter" ? "chapter" : assignment.assignmentType === "event" ? `event:${assignment.eventCode.toUpperCase()}` : assignment.assignmentType === "team" ? `team:${assignment.teamId}` : `member:${assignment.memberId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (assignment.assignmentType === "team") await getTeamForSchool(database, assignment.teamId, schoolCode);
    if (assignment.assignmentType === "member") await assertChapterMember(database, assignment.memberId, schoolCode);
    normalized.push(assignment.assignmentType === "event" ? { ...assignment, eventCode: assignment.eventCode.toUpperCase() } : assignment);
  }
  return normalized;
}

async function replaceAssignments(database: Awaited<ReturnType<typeof requirePortfolioDatabase>>, checkpointId: number, assignments: CheckpointAssignmentInput[]) {
  await database.delete(portfolioCheckpointAssignments).where(eq(portfolioCheckpointAssignments.checkpointId, checkpointId));
  await database.insert(portfolioCheckpointAssignments).values(assignments.map((assignment) => ({
    checkpointId,
    assignmentType: assignment.assignmentType,
    eventCode: assignment.assignmentType === "event" ? assignment.eventCode : null,
    teamId: assignment.assignmentType === "team" ? assignment.teamId : null,
    memberId: assignment.assignmentType === "member" ? assignment.memberId : null,
  })));
}

async function checkpointDetail(database: Awaited<ReturnType<typeof requirePortfolioDatabase>>, checkpointId: number, schoolCode: string) {
  const checkpoint = await getCheckpointForSchool(database, checkpointId, schoolCode);
  const [assignments, submissions] = await Promise.all([
    database.select().from(portfolioCheckpointAssignments).where(eq(portfolioCheckpointAssignments.checkpointId, checkpointId)),
    database.select({
      id: portfolioSubmissions.id,
      subjectType: portfolioSubmissions.subjectType,
      memberId: portfolioSubmissions.memberId,
      teamId: portfolioSubmissions.teamId,
      status: portfolioSubmissions.status,
      submittedAt: portfolioSubmissions.submittedAt,
      isLate: portfolioSubmissions.isLate,
      eventCode: portfolioSubmissions.eventCode,
    }).from(portfolioSubmissions).where(eq(portfolioSubmissions.checkpointId, checkpointId)),
  ]);
  return { checkpoint, assignments, submissions };
}

async function markCheckpointTimelineComplete(database: Awaited<ReturnType<typeof requirePortfolioDatabase>>, checkpointId: number, userIds: number[]) {
  if (!userIds.length) return;
  const links = await database.select({ timelineItemId: portfolioCheckpointTimelineLinks.timelineItemId })
    .from(portfolioCheckpointTimelineLinks)
    .where(and(eq(portfolioCheckpointTimelineLinks.checkpointId, checkpointId), inArray(portfolioCheckpointTimelineLinks.userId, userIds)));
  if (links.length) await database.update(timelineItems).set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
    .where(inArray(timelineItems.id, links.map((link) => link.timelineItemId)));
}

export const portfolioRouter = router({
  listTeams: protectedProcedure.input(z.object({ schoolCode: z.string().trim().min(1).max(50).optional(), season: z.string().trim().min(4).max(20).default(PORTFOLIO_SEASON) }).optional())
    .query(async ({ ctx, input }) => {
      const schoolCode = requirePortfolioAdminSchool(ctx.user, input?.schoolCode);
      const database = await requirePortfolioDatabase();
      const teams = await database.select().from(decaTeams)
        .where(and(eq(decaTeams.schoolCode, schoolCode), eq(decaTeams.season, input?.season ?? PORTFOLIO_SEASON)))
        .orderBy(asc(decaTeams.eventCode), asc(decaTeams.teamName));
      const membersByTeam = await Promise.all(teams.map(async (team) => ({ teamId: team.id, members: await getTeamMembers(database, team.id) })));
      const memberLookup = new Map(membersByTeam.map((entry) => [entry.teamId, entry.members]));
      return teams.map((team) => ({ ...team, members: memberLookup.get(team.id) ?? [] }));
    }),

  createTeam: protectedProcedure.input(z.object({ schoolCode: z.string().trim().min(1).max(50).optional(), eventCode: z.string().trim().min(2).max(20), teamName: z.string().trim().min(2).max(160), season: z.string().trim().min(4).max(20).default(PORTFOLIO_SEASON), memberIds: z.array(z.number().int().positive()).min(1).max(4), leadMemberId: z.number().int().positive().optional() }))
    .mutation(async ({ ctx, input }) => {
      const schoolCode = requirePortfolioAdminSchool(ctx.user, input.schoolCode);
      const database = await requirePortfolioDatabase();
      const members = Array.from(new Set(input.memberIds));
      for (const memberId of members) await assertChapterMember(database, memberId, schoolCode);
      if (input.leadMemberId && !members.includes(input.leadMemberId)) throw new TRPCError({ code: "BAD_REQUEST", message: "The team lead must be included in the team roster." });
      const inserted = await database.insert(decaTeams).values({ schoolCode, eventCode: input.eventCode.toUpperCase(), teamName: input.teamName, season: input.season, createdByUserId: ctx.user.id });
      const teamId = Number((inserted as any)[0]?.insertId);
      await database.insert(decaTeamMembers).values(members.map((userId, index) => ({ teamId, userId, memberRole: input.leadMemberId === userId || (!input.leadMemberId && index === 0) ? "lead" as const : "member" as const })));
      await writePortfolioAudit(database, { schoolCode, entityType: "team", entityId: teamId, action: "team_created", actorUserId: ctx.user.id, metadata: { eventCode: input.eventCode.toUpperCase(), memberCount: members.length } });
      return { team: await getTeamForSchool(database, teamId, schoolCode), members: await getTeamMembers(database, teamId) };
    }),

  addTeamMember: protectedProcedure.input(z.object({ schoolCode: z.string().trim().min(1).max(50).optional(), teamId: z.number().int().positive(), memberId: z.number().int().positive(), memberRole: z.enum(["lead", "member"]).default("member") }))
    .mutation(async ({ ctx, input }) => {
      const schoolCode = requirePortfolioAdminSchool(ctx.user, input.schoolCode);
      const database = await requirePortfolioDatabase();
      await Promise.all([getTeamForSchool(database, input.teamId, schoolCode), assertChapterMember(database, input.memberId, schoolCode)]);
      await database.insert(decaTeamMembers).values({ teamId: input.teamId, userId: input.memberId, memberRole: input.memberRole })
        .onDuplicateKeyUpdate({ set: { memberRole: input.memberRole, leftAt: null } });
      await writePortfolioAudit(database, { schoolCode, entityType: "team", entityId: input.teamId, action: "team_member_added", actorUserId: ctx.user.id, metadata: { memberId: input.memberId, memberRole: input.memberRole } });
      return getTeamMembers(database, input.teamId);
    }),

  removeTeamMember: protectedProcedure.input(z.object({ schoolCode: z.string().trim().min(1).max(50).optional(), teamId: z.number().int().positive(), memberId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const schoolCode = requirePortfolioAdminSchool(ctx.user, input.schoolCode);
      const database = await requirePortfolioDatabase();
      await getTeamForSchool(database, input.teamId, schoolCode);
      await database.update(decaTeamMembers).set({ leftAt: new Date() })
        .where(and(eq(decaTeamMembers.teamId, input.teamId), eq(decaTeamMembers.userId, input.memberId)));
      await writePortfolioAudit(database, { schoolCode, entityType: "team", entityId: input.teamId, action: "team_member_removed", actorUserId: ctx.user.id, metadata: { memberId: input.memberId } });
      return { success: true };
    }),

  listCheckpoints: protectedProcedure.input(z.object({ schoolCode: z.string().trim().min(1).max(50).optional(), includeArchived: z.boolean().default(false) }).optional())
    .query(async ({ ctx, input }) => {
      const schoolCode = requirePortfolioAdminSchool(ctx.user, input?.schoolCode);
      const database = await requirePortfolioDatabase();
      const conditions = [eq(portfolioCheckpoints.schoolCode, schoolCode)];
      if (!input?.includeArchived) conditions.push(sql`${portfolioCheckpoints.status} != 'archived'`);
      const checkpoints = await database.select().from(portfolioCheckpoints).where(and(...conditions)).orderBy(asc(portfolioCheckpoints.dueAt), desc(portfolioCheckpoints.createdAt));
      return Promise.all(checkpoints.map((checkpoint) => checkpointDetail(database, checkpoint.id, schoolCode)));
    }),

  createCheckpoint: protectedProcedure.input(checkpointInput)
    .mutation(async ({ ctx, input }) => {
      const schoolCode = requirePortfolioAdminSchool(ctx.user, input.schoolCode);
      const database = await requirePortfolioDatabase();
      const assignments = await validateAssignments(database, schoolCode, input.assignments as CheckpointAssignmentInput[]);
      const inserted = await database.insert(portfolioCheckpoints).values({
        schoolCode,
        season: input.season,
        title: input.title,
        description: input.description || null,
        dueAt: input.dueAt ?? null,
        submissionType: input.submissionType,
        required: input.required,
        allowLate: input.allowLate,
        allowMultipleVersions: input.allowMultipleVersions,
        aiEvaluationMode: input.aiEvaluationMode,
        manualReviewRequired: input.manualReviewRequired,
        createdByUserId: ctx.user.id,
      });
      const checkpointId = Number((inserted as any)[0]?.insertId);
      await replaceAssignments(database, checkpointId, assignments);
      await writePortfolioAudit(database, { schoolCode, entityType: "checkpoint", entityId: checkpointId, action: "checkpoint_created", actorUserId: ctx.user.id, metadata: { status: "draft", assignmentCount: assignments.length } });
      return checkpointDetail(database, checkpointId, schoolCode);
    }),

  previewCheckpoint: protectedProcedure.input(z.object({ checkpointId: z.number().int().positive(), schoolCode: z.string().trim().min(1).max(50).optional() }))
    .query(async ({ ctx, input }) => {
      const schoolCode = requirePortfolioAdminSchool(ctx.user, input.schoolCode);
      const database = await requirePortfolioDatabase();
      const [checkpoint, subjects] = await Promise.all([getCheckpointForSchool(database, input.checkpointId, schoolCode), resolveCheckpointSubjects(database, input.checkpointId, schoolCode)]);
      const memberIds = Array.from(new Set(subjects.flatMap((subject) => subject.memberIds)));
      const teamIds = Array.from(new Set(subjects.filter((subject) => subject.subjectType === "team").map((subject) => subject.teamId).filter((id): id is number => id !== null)));
      return { checkpoint, affectedMembers: memberIds.length, affectedTeams: teamIds.length, expectedSubmissions: subjects.length, dueAt: checkpoint.dueAt };
    }),

  publishCheckpoint: protectedProcedure.input(z.object({ checkpointId: z.number().int().positive(), schoolCode: z.string().trim().min(1).max(50).optional() }))
    .mutation(async ({ ctx, input }) => {
      const schoolCode = requirePortfolioAdminSchool(ctx.user, input.schoolCode);
      const database = await requirePortfolioDatabase();
      const checkpoint = await getCheckpointForSchool(database, input.checkpointId, schoolCode);
      if (!checkpoint.dueAt) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Add a due date before publishing a portfolio checkpoint." });
      await database.update(portfolioCheckpoints).set({ status: "published", publishedAt: checkpoint.publishedAt ?? new Date(), archivedAt: null, updatedAt: new Date() }).where(eq(portfolioCheckpoints.id, checkpoint.id));
      const subjects = await ensureCheckpointSubmissions(database, checkpoint.id, schoolCode);
      const timeline = await syncCheckpointTimelineItems(database, checkpoint.id, schoolCode);
      const memberIds = Array.from(new Set(subjects.flatMap((subject) => subject.memberIds)));
      const dueLabel = checkpoint.dueAt.toLocaleString();
      await postPortfolioNotification(database, { userIds: memberIds, schoolCode, notificationKey: `portfolio-checkpoint-published-${checkpoint.id}`, body: `New chapter portfolio checkpoint: ${checkpoint.title}. Due ${dueLabel}. Open your timeline to upload the required work.` });
      await writePortfolioAudit(database, { schoolCode, entityType: "checkpoint", entityId: checkpoint.id, action: "checkpoint_published", actorUserId: ctx.user.id, metadata: { affectedMembers: memberIds.length, expectedSubmissions: subjects.length, timelineCreated: timeline.created, timelineUpdated: timeline.updated } });
      return { ...(await checkpointDetail(database, checkpoint.id, schoolCode)), preview: { affectedMembers: memberIds.length, expectedSubmissions: subjects.length, timelineItemsCreated: timeline.created, timelineItemsUpdated: timeline.updated, timelinesAwaitingCreation: timeline.skipped } };
    }),

  updateCheckpoint: protectedProcedure.input(checkpointInput.extend({ checkpointId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const schoolCode = requirePortfolioAdminSchool(ctx.user, input.schoolCode);
      const database = await requirePortfolioDatabase();
      const checkpoint = await getCheckpointForSchool(database, input.checkpointId, schoolCode);
      if (checkpoint.status === "archived") throw new TRPCError({ code: "CONFLICT", message: "Archived checkpoints cannot be edited." });
      const assignments = await validateAssignments(database, schoolCode, input.assignments as CheckpointAssignmentInput[]);
      await database.update(portfolioCheckpoints).set({
        title: input.title,
        description: input.description || null,
        dueAt: input.dueAt ?? null,
        season: input.season,
        submissionType: input.submissionType,
        required: input.required,
        allowLate: input.allowLate,
        allowMultipleVersions: input.allowMultipleVersions,
        aiEvaluationMode: input.aiEvaluationMode,
        manualReviewRequired: input.manualReviewRequired,
        updatedAt: new Date(),
      }).where(eq(portfolioCheckpoints.id, checkpoint.id));
      await replaceAssignments(database, checkpoint.id, assignments);
      let timeline = { created: 0, updated: 0, skipped: 0 };
      if (checkpoint.status === "published") {
        await ensureCheckpointSubmissions(database, checkpoint.id, schoolCode);
        timeline = await syncCheckpointTimelineItems(database, checkpoint.id, schoolCode);
      }
      await writePortfolioAudit(database, { schoolCode, entityType: "checkpoint", entityId: checkpoint.id, action: "checkpoint_updated", actorUserId: ctx.user.id, metadata: { assignmentCount: assignments.length, timelineCreated: timeline.created, timelineUpdated: timeline.updated } });
      return { ...(await checkpointDetail(database, checkpoint.id, schoolCode)), timeline };
    }),

  archiveCheckpoint: protectedProcedure.input(z.object({ checkpointId: z.number().int().positive(), schoolCode: z.string().trim().min(1).max(50).optional() }))
    .mutation(async ({ ctx, input }) => {
      const schoolCode = requirePortfolioAdminSchool(ctx.user, input.schoolCode);
      const database = await requirePortfolioDatabase();
      const checkpoint = await getCheckpointForSchool(database, input.checkpointId, schoolCode);
      const removedTimelineItems = await removeCheckpointTimelineItems(database, checkpoint.id);
      await database.update(portfolioSubmissions).set({ status: "archived", archivedAt: new Date(), updatedAt: new Date() }).where(eq(portfolioSubmissions.checkpointId, checkpoint.id));
      await database.update(portfolioCheckpoints).set({ status: "archived", archivedAt: new Date(), updatedAt: new Date() }).where(eq(portfolioCheckpoints.id, checkpoint.id));
      await writePortfolioAudit(database, { schoolCode, entityType: "checkpoint", entityId: checkpoint.id, action: "checkpoint_archived", actorUserId: ctx.user.id, metadata: { removedTimelineItems } });
      return { success: true, removedTimelineItems };
    }),

  listMyCheckpoints: protectedProcedure.query(async ({ ctx }) => {
    const schoolCode = requireMemberSchool(ctx.user);
    const database = await requirePortfolioDatabase();
    const checkpoints = await database.select().from(portfolioCheckpoints)
      .where(and(eq(portfolioCheckpoints.schoolCode, schoolCode), eq(portfolioCheckpoints.status, "published")))
      .orderBy(asc(portfolioCheckpoints.dueAt));
    const accessible = [] as Array<{ checkpoint: typeof checkpoints[number]; submission: typeof portfolioSubmissions.$inferSelect | null; subject: Awaited<ReturnType<typeof findAccessibleCheckpointSubjects>>[number] }>;
    for (const checkpoint of checkpoints) {
      const subjects = await findAccessibleCheckpointSubjects(database, checkpoint.id, schoolCode, ctx.user.id);
      for (const subject of subjects) {
        const [submission] = await database.select().from(portfolioSubmissions).where(and(eq(portfolioSubmissions.checkpointId, checkpoint.id), eq(portfolioSubmissions.subjectKey, subject.subjectKey))).limit(1);
        accessible.push({ checkpoint, subject, submission: submission ?? null });
      }
    }
    return accessible;
  }),

  uploadVersion: protectedProcedure.input(z.object({ checkpointId: z.number().int().positive(), fileName: z.string().trim().min(1).max(512), mimeType: z.string().trim().min(3).max(120), fileBase64: z.string().min(4).max(MAX_FILE_BASE64_LENGTH), notes: z.string().trim().max(2_000).optional() }))
    .mutation(async ({ ctx, input }) => {
      const schoolCode = requireMemberSchool(ctx.user);
      const database = await requirePortfolioDatabase();
      const checkpoint = await getCheckpointForSchool(database, input.checkpointId, schoolCode);
      if (checkpoint.status !== "published") throw new TRPCError({ code: "CONFLICT", message: "This portfolio checkpoint is not accepting submissions." });
      if (checkpoint.submissionType === "completion_check") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This checkpoint is a completion check and does not accept a file upload." });
      enforceSubmissionFileType(checkpoint.submissionType as SubmissionType, input.mimeType);
      const [subject] = await findAccessibleCheckpointSubjects(database, checkpoint.id, schoolCode, ctx.user.id);
      if (!subject) throw new TRPCError({ code: "FORBIDDEN", message: "This checkpoint is not assigned to you or your current team." });
      await ensureCheckpointSubmissions(database, checkpoint.id, schoolCode);
      const [submission] = await database.select().from(portfolioSubmissions).where(and(eq(portfolioSubmissions.checkpointId, checkpoint.id), eq(portfolioSubmissions.subjectKey, subject.subjectKey))).limit(1);
      if (!submission) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Your checkpoint submission could not be prepared." });
      const existingVersions = await database.select({ id: portfolioSubmissionVersions.id, versionNumber: portfolioSubmissionVersions.versionNumber }).from(portfolioSubmissionVersions).where(eq(portfolioSubmissionVersions.submissionId, submission.id)).orderBy(desc(portfolioSubmissionVersions.versionNumber));
      if (existingVersions.length && !checkpoint.allowMultipleVersions) throw new TRPCError({ code: "CONFLICT", message: "This checkpoint allows one submission version only." });
      const file = Buffer.from(input.fileBase64, "base64");
      if (!file.length || file.length > MAX_PORTFOLIO_FILE_BYTES) throw new TRPCError({ code: "BAD_REQUEST", message: "Upload a file smaller than 12 MB." });
      const versionNumber = (existingVersions[0]?.versionNumber ?? 0) + 1;
      const versionInserted = await database.insert(portfolioSubmissionVersions).values({ submissionId: submission.id, versionNumber, notes: input.notes || null, uploadedByUserId: ctx.user.id, processingStatus: "uploading" });
      const versionId = Number((versionInserted as any)[0]?.insertId);
      await database.update(portfolioSubmissions).set({ status: "uploading", updatedAt: new Date() }).where(eq(portfolioSubmissions.id, submission.id));
      const storageKey = `portfolio-submissions/${schoolCode}/${subject.subjectKey}/${submission.id}/v${versionNumber}-${randomUUID()}.${fileExtension(input.mimeType, input.fileName)}`;
      try {
        await storagePut(storageKey, file, input.mimeType);
        let parsedContent: string | null = null;
        let pageCount: number | null = null;
        let extractionStatus: "extracted" | "unsupported" | "failed" = "unsupported";
        let extractionError: string | null = null;
        if (input.mimeType === "application/pdf" || input.mimeType === "text/plain") {
          await database.update(portfolioSubmissionVersions).set({ processingStatus: "reading_submission" }).where(eq(portfolioSubmissionVersions.id, versionId));
          try {
            const { url } = await storageGet(storageKey);
            const extracted = await extractWrittenDocument(url, input.mimeType);
            parsedContent = extracted.parsedContent;
            pageCount = extracted.pageCount;
            extractionStatus = "extracted";
          } catch (error) {
            extractionStatus = "failed";
            extractionError = error instanceof Error ? error.message.slice(0, 512) : "Document extraction failed.";
          }
        }
        await database.insert(portfolioVersionFiles).values({ versionId, storageKey, fileName: input.fileName, mimeType: input.mimeType, fileSizeBytes: file.length, parsedContent, pageCount, extractionStatus, extractionError });
        const submittedAt = new Date();
        const isLate = Boolean(checkpoint.dueAt && submittedAt.getTime() > checkpoint.dueAt.getTime());
        if (isLate && !checkpoint.allowLate) {
          await database.update(portfolioSubmissionVersions).set({ processingStatus: "failed", processingError: "The file was preserved, but this checkpoint no longer accepts late submissions." }).where(eq(portfolioSubmissionVersions.id, versionId));
          await database.update(portfolioSubmissions).set({ status: "failed", updatedAt: new Date() }).where(eq(portfolioSubmissions.id, submission.id));
          throw new TRPCError({ code: "CONFLICT", message: "This checkpoint does not accept late submissions. Your file is safely preserved for advisor review." });
        }
        await database.update(portfolioSubmissionVersions).set({ processingStatus: checkpoint.aiEvaluationMode === "automatic" ? "ready" : "ready", processingError: extractionError }).where(eq(portfolioSubmissionVersions.id, versionId));
        await database.update(portfolioSubmissions).set({ activeVersionId: versionId, submittedByUserId: ctx.user.id, submittedAt, isLate, status: checkpoint.manualReviewRequired ? "review_ready" : "submitted", updatedAt: new Date() }).where(eq(portfolioSubmissions.id, submission.id));
        await markCheckpointTimelineComplete(database, checkpoint.id, subject.memberIds);
        await postPortfolioNotification(database, { userIds: subject.memberIds.filter((id) => id !== ctx.user.id), schoolCode, notificationKey: `portfolio-version-${submission.id}-${versionNumber}`, body: `A new version was uploaded for your shared portfolio checkpoint: ${checkpoint.title}.` });
        await writePortfolioAudit(database, { schoolCode, entityType: "version", entityId: versionId, action: "portfolio_version_uploaded", actorUserId: ctx.user.id, metadata: { submissionId: submission.id, checkpointId: checkpoint.id, versionNumber, fileName: input.fileName, fileSizeBytes: file.length, extractionStatus, isLate } });
        return { submissionId: submission.id, versionId, versionNumber, extractionStatus, isLate, aiEvaluationMode: checkpoint.aiEvaluationMode, processingStatus: "ready" as const };
      } catch (error) {
        if (!(error instanceof TRPCError)) {
          const message = error instanceof Error ? error.message.slice(0, 512) : "Upload could not be completed.";
          await database.update(portfolioSubmissionVersions).set({ processingStatus: "failed", processingError: message }).where(eq(portfolioSubmissionVersions.id, versionId));
          await database.update(portfolioSubmissions).set({ status: "failed", updatedAt: new Date() }).where(eq(portfolioSubmissions.id, submission.id));
        }
        throw error;
      }
    }),

  listVersions: protectedProcedure.input(z.object({ submissionId: z.number().int().positive(), schoolCode: z.string().trim().min(1).max(50).optional() }))
    .query(async ({ ctx, input }) => {
      const database = await requirePortfolioDatabase();
      await canUserAccessSubmission(database, ctx.user, input.submissionId, input.schoolCode);
      const versions = await database.select().from(portfolioSubmissionVersions).where(eq(portfolioSubmissionVersions.submissionId, input.submissionId)).orderBy(desc(portfolioSubmissionVersions.versionNumber));
      return Promise.all(versions.map(async (version) => ({ ...version, files: await database.select({ id: portfolioVersionFiles.id, fileName: portfolioVersionFiles.fileName, mimeType: portfolioVersionFiles.mimeType, fileSizeBytes: portfolioVersionFiles.fileSizeBytes, pageCount: portfolioVersionFiles.pageCount, extractionStatus: portfolioVersionFiles.extractionStatus, extractionError: portfolioVersionFiles.extractionError, uploadedAt: portfolioVersionFiles.uploadedAt }).from(portfolioVersionFiles).where(eq(portfolioVersionFiles.versionId, version.id)) })));
    }),

  getVersionDownloadUrl: protectedProcedure.input(z.object({ fileId: z.number().int().positive(), schoolCode: z.string().trim().min(1).max(50).optional() }))
    .query(async ({ ctx, input }) => {
      const database = await requirePortfolioDatabase();
      const [row] = await database.select({ file: portfolioVersionFiles, submissionId: portfolioSubmissionVersions.submissionId }).from(portfolioVersionFiles)
        .innerJoin(portfolioSubmissionVersions, eq(portfolioVersionFiles.versionId, portfolioSubmissionVersions.id))
        .where(eq(portfolioVersionFiles.id, input.fileId)).limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "That portfolio file was not found." });
      await canUserAccessSubmission(database, ctx.user, row.submissionId, input.schoolCode);
      const { url } = await storageGet(row.file.storageKey);
      return { url, fileName: row.file.fileName, mimeType: row.file.mimeType };
    }),

  getSubmission: protectedProcedure.input(z.object({ submissionId: z.number().int().positive(), schoolCode: z.string().trim().min(1).max(50).optional() }))
    .query(async ({ ctx, input }) => {
      const database = await requirePortfolioDatabase();
      const record = await canUserAccessSubmission(database, ctx.user, input.submissionId, input.schoolCode);
      const [latestEvaluation] = await database.select().from(portfolioEvaluations).where(eq(portfolioEvaluations.submissionId, record.submission.id)).orderBy(desc(portfolioEvaluations.createdAt)).limit(1);
      const integrityFindings = latestEvaluation ? await database.select().from(portfolioIntegrityFindings).where(eq(portfolioIntegrityFindings.evaluationId, latestEvaluation.id)) : [];
      const isAdvisor = ctx.user.role === "admin" || ctx.user.role === "super_admin";
      return { ...record, latestEvaluation, integrityFindings: isAdvisor ? integrityFindings : integrityFindings.filter((finding) => Boolean(finding.studentVisibleMessage)) };
    }),

  saveManualReview: protectedProcedure.input(z.object({ submissionId: z.number().int().positive(), schoolCode: z.string().trim().min(1).max(50).optional(), advisorScore: z.number().int().min(0).max(1_000).optional(), advisorNotes: z.string().trim().min(1).max(8_000), status: z.enum(["review_ready", "needs_revision", "approved"]).default("needs_revision"), criterionOverrides: z.array(z.object({ criterionId: z.string().min(1).max(120), score: z.number().int().min(0).max(1_000), note: z.string().trim().max(2_000).optional() })).max(100).optional() }))
    .mutation(async ({ ctx, input }) => {
      const schoolCode = requirePortfolioAdminSchool(ctx.user, input.schoolCode);
      const database = await requirePortfolioDatabase();
      const record = await canUserAccessSubmission(database, ctx.user, input.submissionId, schoolCode);
      const submission = record.submission;
      if (!submission.activeVersionId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A submitted portfolio version is required before advisor review." });
      const inserted = await database.insert(portfolioEvaluations).values({
        submissionId: submission.id,
        versionId: submission.activeVersionId,
        evaluationMode: "manual",
        status: "completed",
        eventCode: submission.eventCode,
        season: PORTFOLIO_SEASON,
        rubricScores: input.criterionOverrides ?? [],
        advisorScore: input.advisorScore ?? null,
        advisorNotes: input.advisorNotes,
        advisorUserId: ctx.user.id,
        advisorCompletedAt: new Date(),
        modelMetadata: { source: "advisor_manual_review" },
        completedAt: new Date(),
      });
      const evaluationId = Number((inserted as any)[0]?.insertId);
      await database.update(portfolioSubmissions).set({ status: input.status, updatedAt: new Date() }).where(eq(portfolioSubmissions.id, submission.id));
      const recipients = submission.teamId ? (await getTeamMembers(database, submission.teamId)).map((member) => member.userId) : submission.memberId ? [submission.memberId] : [];
      await postPortfolioNotification(database, { userIds: recipients, schoolCode, notificationKey: `portfolio-review-complete-${evaluationId}`, body: `Advisor feedback is ready for ${record.checkpoint.title}. Open your portfolio checkpoint to review the requested next steps.` });
      await writePortfolioAudit(database, { schoolCode, entityType: "evaluation", entityId: evaluationId, action: "advisor_review_completed", actorUserId: ctx.user.id, metadata: { submissionId: submission.id, advisorScore: input.advisorScore ?? null, status: input.status } });
      return { evaluationId, status: input.status };
    }),

  runAiEvaluation: protectedProcedure.input(z.object({ submissionId: z.number().int().positive(), schoolCode: z.string().trim().min(1).max(50).optional() }))
    .mutation(async ({ ctx, input }) => {
      const schoolCode = requirePortfolioAdminSchool(ctx.user, input.schoolCode);
      const database = await requirePortfolioDatabase();
      const record = await canUserAccessSubmission(database, ctx.user, input.submissionId, schoolCode);
      const { submission, checkpoint } = record;
      if (checkpoint.aiEvaluationMode === 'disabled') throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'This checkpoint is configured for manual advisor review only.' });
      if (!submission.activeVersionId) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Upload a portfolio version before running evidence-bound evaluation.' });
      const versionId = submission.activeVersionId;
      const files = await database.select().from(portfolioVersionFiles).where(eq(portfolioVersionFiles.versionId, versionId));
      const submissionText = files.map((file) => file.parsedContent || '').filter(Boolean).join('\n\n');
      if (!submissionText.trim()) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'This version does not contain readable PDF or plain-text evidence. It remains available for manual advisor review.' });
      const [ruleSetRecord] = await database.select().from(decaAiJudgeRuleSets).where(and(eq(decaAiJudgeRuleSets.competitionYear, checkpoint.season), eq(decaAiJudgeRuleSets.eventCode, submission.eventCode), eq(decaAiJudgeRuleSets.verified, true))).orderBy(desc(decaAiJudgeRuleSets.updatedAt)).limit(1);
      const inserted = await database.insert(portfolioEvaluations).values({ submissionId: submission.id, versionId, ruleSetId: ruleSetRecord?.id ?? null, evaluationMode: checkpoint.manualReviewRequired ? 'combined' : 'ai', status: 'processing', eventCode: submission.eventCode, season: checkpoint.season, rubricVersion: ruleSetRecord?.version ?? null, modelMetadata: { startedByUserId: ctx.user.id, stage: 'reading_submission' } });
      const evaluationId = Number((inserted as any)[0]?.insertId);
      await database.update(portfolioSubmissions).set({ status: 'processing', updatedAt: new Date() }).where(eq(portfolioSubmissions.id, submission.id));
      await database.update(portfolioSubmissionVersions).set({ processingStatus: 'analyzing_rubric', processingError: null }).where(eq(portfolioSubmissionVersions.id, versionId));
      try {
        const [piRows, priorVersion] = await Promise.all([
          database.select({ piId: piLearningModules.piId, performanceIndicator: piLearningModules.performanceIndicator }).from(eventPerformanceIndicators).innerJoin(piLearningModules, eq(eventPerformanceIndicators.moduleId, piLearningModules.id)).where(eq(eventPerformanceIndicators.eventCode, submission.eventCode)).limit(30),
          database.select({ id: portfolioSubmissionVersions.id, parsedContent: portfolioVersionFiles.parsedContent }).from(portfolioSubmissionVersions).innerJoin(portfolioVersionFiles, eq(portfolioSubmissionVersions.id, portfolioVersionFiles.versionId)).where(and(eq(portfolioSubmissionVersions.submissionId, submission.id), sql`${portfolioSubmissionVersions.id} != ${versionId}`, sql`${portfolioVersionFiles.parsedContent} IS NOT NULL`)).orderBy(desc(portfolioSubmissionVersions.versionNumber)).limit(1),
        ]);
        const [previousEvaluation] = await database.select({ rubricScores: portfolioEvaluations.rubricScores }).from(portfolioEvaluations).where(and(eq(portfolioEvaluations.submissionId, submission.id), sql`${portfolioEvaluations.versionId} != ${versionId}`, eq(portfolioEvaluations.status, 'completed'))).orderBy(desc(portfolioEvaluations.createdAt)).limit(1);
        const evaluation = await evaluatePortfolioEvidence({ eventCode: submission.eventCode, season: checkpoint.season, submissionText, checkpointContext: `${checkpoint.title}; ${checkpoint.description || 'No additional chapter instructions.'}; due ${checkpoint.dueAt?.toISOString() || 'not set'}; submission type ${checkpoint.submissionType}.`, piContext: piRows.map((pi) => `${pi.piId}: ${pi.performanceIndicator}`).join('\n'), previousVersionText: priorVersion[0]?.parsedContent ?? null, previousRubricScores: previousEvaluation?.rubricScores });
        await database.update(portfolioEvaluations).set({ status: 'completed', ruleSetId: ruleSetRecord?.id ?? null, rubricVersion: evaluation.ruleSet.version, rubricScores: evaluation.rubricScores, recommendedScore: evaluation.recommendedScore, observableMaximumPoints: evaluation.observableMaximumPoints, piAnalysis: evaluation.piAnalysis, complianceFindings: evaluation.complianceFindings, sourceReview: evaluation.sourceReview, quantitativeReview: evaluation.quantitativeReview, versionComparison: evaluation.versionComparison, competitiveReadiness: evaluation.competitiveReadiness, topPriorities: evaluation.topPriorities, pointsLeftOnTable: evaluation.pointsLeftOnTable, modelMetadata: evaluation.modelMetadata, completedAt: new Date(), failureReason: null }).where(eq(portfolioEvaluations.id, evaluationId));
        if (evaluation.integrityFindings.length) await database.insert(portfolioIntegrityFindings).values(evaluation.integrityFindings.map((finding) => ({ evaluationId, findingType: finding.findingType, priority: finding.priority, confidence: finding.confidence, description: finding.explanation, evidence: finding.evidence, alternativeExplanations: finding.alternativeExplanations, advisorAction: finding.advisorAction })));
        await database.update(portfolioSubmissionVersions).set({ processingStatus: 'ready', processingError: null }).where(eq(portfolioSubmissionVersions.id, versionId));
        await database.update(portfolioSubmissions).set({ status: checkpoint.manualReviewRequired ? 'review_ready' : 'submitted', updatedAt: new Date() }).where(eq(portfolioSubmissions.id, submission.id));
        const recipients = submission.teamId ? (await getTeamMembers(database, submission.teamId)).map((member) => member.userId) : submission.memberId ? [submission.memberId] : [];
        await postPortfolioNotification(database, { userIds: recipients, schoolCode, notificationKey: `portfolio-ai-review-${evaluationId}`, body: `Evidence-bound AI feedback is ready for ${checkpoint.title}. Your advisor will review any integrity findings separately from rubric scoring.` });
        await writePortfolioAudit(database, { schoolCode, entityType: 'evaluation', entityId: evaluationId, action: 'ai_evaluation_completed', actorUserId: ctx.user.id, metadata: { submissionId: submission.id, versionId, eventCode: submission.eventCode, integrityFindingCount: evaluation.integrityFindings.length } });
        return { evaluationId, status: 'completed' as const, recommendedScore: evaluation.recommendedScore, observableMaximumPoints: evaluation.observableMaximumPoints };
      } catch (error) {
        const failureReason = error instanceof Error ? error.message.slice(0, 512) : 'Portfolio evaluation failed.';
        await database.update(portfolioEvaluations).set({ status: 'failed', failureReason, modelMetadata: { evaluatorPromptVersion: 'blue-blazer-portfolio-evaluator-v1', failureReason }, completedAt: new Date() }).where(eq(portfolioEvaluations.id, evaluationId));
        await database.update(portfolioSubmissionVersions).set({ processingStatus: 'failed', processingError: failureReason }).where(eq(portfolioSubmissionVersions.id, versionId));
        await database.update(portfolioSubmissions).set({ status: 'review_ready', updatedAt: new Date() }).where(eq(portfolioSubmissions.id, submission.id));
        await writePortfolioAudit(database, { schoolCode, entityType: 'evaluation', entityId: evaluationId, action: 'ai_evaluation_failed', actorUserId: ctx.user.id, metadata: { submissionId: submission.id, failureReason } });
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'The original portfolio is preserved, but AI evaluation did not finish. Retry it from the advisor review queue.' });
      }
    }),

  getAiEvaluation: protectedProcedure.input(z.object({ evaluationId: z.number().int().positive(), schoolCode: z.string().trim().min(1).max(50).optional() }))
    .query(async ({ ctx, input }) => {
      const database = await requirePortfolioDatabase();
      const [evaluation] = await database.select().from(portfolioEvaluations).where(eq(portfolioEvaluations.id, input.evaluationId)).limit(1);
      if (!evaluation) throw new TRPCError({ code: 'NOT_FOUND', message: 'That portfolio evaluation was not found.' });
      await canUserAccessSubmission(database, ctx.user, evaluation.submissionId, input.schoolCode);
      const integrityFindings = await database.select().from(portfolioIntegrityFindings).where(eq(portfolioIntegrityFindings.evaluationId, evaluation.id));
      const isAdvisor = ctx.user.role === 'admin' || ctx.user.role === 'super_admin';
      return { evaluation, integrityFindings: isAdvisor ? integrityFindings : integrityFindings.filter((finding) => Boolean(finding.studentVisibleMessage)) };
    }),

  decideIntegrityFinding: protectedProcedure.input(z.object({ findingId: z.number().int().positive(), schoolCode: z.string().trim().min(1).max(50).optional(), decision: z.enum(['accepted', 'rejected']), humanNote: z.string().trim().min(1).max(4_000), studentVisibleMessage: z.string().trim().max(4_000).optional() }))
    .mutation(async ({ ctx, input }) => {
      const schoolCode = requirePortfolioAdminSchool(ctx.user, input.schoolCode);
      const database = await requirePortfolioDatabase();
      const [finding] = await database.select({ finding: portfolioIntegrityFindings, submissionId: portfolioEvaluations.submissionId }).from(portfolioIntegrityFindings).innerJoin(portfolioEvaluations, eq(portfolioIntegrityFindings.evaluationId, portfolioEvaluations.id)).where(eq(portfolioIntegrityFindings.id, input.findingId)).limit(1);
      if (!finding) throw new TRPCError({ code: 'NOT_FOUND', message: 'That integrity finding was not found.' });
      await canUserAccessSubmission(database, ctx.user, finding.submissionId, schoolCode);
      await database.update(portfolioIntegrityFindings).set({ humanDecision: input.decision, humanNote: input.humanNote, studentVisibleMessage: input.studentVisibleMessage || null, decidedByUserId: ctx.user.id, decidedAt: new Date() }).where(eq(portfolioIntegrityFindings.id, finding.finding.id));
      await writePortfolioAudit(database, { schoolCode, entityType: 'integrity_finding', entityId: finding.finding.id, action: `integrity_finding_${input.decision}`, actorUserId: ctx.user.id, metadata: { evaluationId: finding.finding.evaluationId, studentVisible: Boolean(input.studentVisibleMessage) } });
      return { success: true };
    }),

  listReviews: protectedProcedure.input(z.object({ schoolCode: z.string().trim().min(1).max(50).optional(), status: z.enum(["review_ready", "needs_revision", "approved", "submitted", "processing"]).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const schoolCode = requirePortfolioAdminSchool(ctx.user, input?.schoolCode);
      const database = await requirePortfolioDatabase();
      const conditions = [eq(portfolioSubmissions.schoolCode, schoolCode)];
      if (input?.status) conditions.push(eq(portfolioSubmissions.status, input.status));
      return database.select({
        submission: portfolioSubmissions,
        checkpoint: portfolioCheckpoints,
        memberName: users.name,
        teamName: decaTeams.teamName,
      }).from(portfolioSubmissions)
        .innerJoin(portfolioCheckpoints, eq(portfolioSubmissions.checkpointId, portfolioCheckpoints.id))
        .leftJoin(users, eq(portfolioSubmissions.memberId, users.id))
        .leftJoin(decaTeams, eq(portfolioSubmissions.teamId, decaTeams.id))
        .where(and(...conditions)).orderBy(asc(portfolioCheckpoints.dueAt), desc(portfolioSubmissions.updatedAt));
    }),

  getMemberPortfolio: protectedProcedure.input(z.object({ memberId: z.number().int().positive(), schoolCode: z.string().trim().min(1).max(50).optional() }))
    .query(async ({ ctx, input }) => {
      const schoolCode = requirePortfolioAdminSchool(ctx.user, input.schoolCode);
      const database = await requirePortfolioDatabase();
      const member = await assertChapterMember(database, input.memberId, schoolCode);
      const published = await database.select().from(portfolioCheckpoints).where(and(eq(portfolioCheckpoints.schoolCode, schoolCode), eq(portfolioCheckpoints.status, "published"))).orderBy(asc(portfolioCheckpoints.dueAt));
      const entries = [] as Array<{ checkpoint: typeof published[number]; subject: Awaited<ReturnType<typeof findAccessibleCheckpointSubjects>>[number]; submission: typeof portfolioSubmissions.$inferSelect | null }>;
      for (const checkpoint of published) {
        const subjects = await findAccessibleCheckpointSubjects(database, checkpoint.id, schoolCode, member.id);
        for (const subject of subjects) {
          const [submission] = await database.select().from(portfolioSubmissions).where(and(eq(portfolioSubmissions.checkpointId, checkpoint.id), eq(portfolioSubmissions.subjectKey, subject.subjectKey))).limit(1);
          entries.push({ checkpoint, subject, submission: submission ?? null });
        }
      }
      return { member, entries };
    }),

  getMemberSummaries: protectedProcedure.input(z.object({ schoolCode: z.string().trim().min(1).max(50).optional() }))
    .query(async ({ ctx, input }) => {
      const schoolCode = requirePortfolioAdminSchool(ctx.user, input.schoolCode);
      const database = await requirePortfolioDatabase();
      const [roster, checkpoints, submissions, memberships] = await Promise.all([
        database.select({ id: users.id, primaryEventCode: users.primaryEventCode }).from(users).where(and(eq(users.schoolCode, schoolCode), sql`${users.role} != 'super_admin'`)),
        database.select().from(portfolioCheckpoints).where(and(eq(portfolioCheckpoints.schoolCode, schoolCode), eq(portfolioCheckpoints.status, 'published'))).orderBy(asc(portfolioCheckpoints.dueAt)),
        database.select().from(portfolioSubmissions).where(eq(portfolioSubmissions.schoolCode, schoolCode)),
        database.select({ memberId: decaTeamMembers.userId, teamId: decaTeams.id, teamName: decaTeams.teamName, eventCode: decaTeams.eventCode }).from(decaTeamMembers).innerJoin(decaTeams, eq(decaTeamMembers.teamId, decaTeams.id)).where(and(eq(decaTeams.schoolCode, schoolCode), sql`${decaTeams.archivedAt} IS NULL`, sql`${decaTeamMembers.leftAt} IS NULL`)),
      ]);
      const checkpointSubjects = new Map<number, Awaited<ReturnType<typeof resolveCheckpointSubjects>>>();
      for (const checkpoint of checkpoints) checkpointSubjects.set(checkpoint.id, await resolveCheckpointSubjects(database, checkpoint.id, schoolCode));
      const membershipByMember = new Map<number, typeof memberships[number]>();
      for (const membership of memberships) {
        const existing = membershipByMember.get(membership.memberId);
        if (!existing || existing.eventCode === roster.find((member) => member.id === membership.memberId)?.primaryEventCode) membershipByMember.set(membership.memberId, membership);
      }
      return Promise.all(roster.map(async (member) => {
        const assigned = checkpoints.flatMap((checkpoint) => (checkpointSubjects.get(checkpoint.id) ?? []).filter((subject) => subject.memberIds.includes(member.id)).map((subject) => ({ checkpoint, subject })));
        const next = assigned.find((entry) => !entry.checkpoint.dueAt || entry.checkpoint.dueAt.getTime() >= Date.now()) ?? assigned[0];
        const accessibleSubjectKeys = new Set(assigned.map((entry) => entry.subject.subjectKey));
        const relatedSubmissions = submissions.filter((submission) => accessibleSubjectKeys.has(submission.subjectKey));
        const latestSubmission = relatedSubmissions.sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0))[0];
        let lastUploadAt: Date | null = null;
        let aiReviewStatus = 'Not run';
        let advisorScore: number | null = null;
        if (latestSubmission) {
          const [latestVersion] = await database.select({ submittedAt: portfolioSubmissionVersions.submittedAt }).from(portfolioSubmissionVersions).where(eq(portfolioSubmissionVersions.submissionId, latestSubmission.id)).orderBy(desc(portfolioSubmissionVersions.versionNumber)).limit(1);
          lastUploadAt = latestVersion?.submittedAt ?? null;
          const [latestEvaluation] = await database.select({ status: portfolioEvaluations.status, evaluationMode: portfolioEvaluations.evaluationMode, advisorScore: portfolioEvaluations.advisorScore }).from(portfolioEvaluations).where(eq(portfolioEvaluations.submissionId, latestSubmission.id)).orderBy(desc(portfolioEvaluations.createdAt)).limit(1);
          if (latestEvaluation?.evaluationMode === 'ai' || latestEvaluation?.evaluationMode === 'combined') aiReviewStatus = latestEvaluation.status === 'completed' ? 'Complete' : statusLabel(latestEvaluation.status);
          advisorScore = latestEvaluation?.advisorScore ?? null;
        }
        const team = membershipByMember.get(member.id);
        return { memberId: member.id, eventCode: member.primaryEventCode ?? team?.eventCode ?? null, teamName: team?.teamName ?? null, portfolioStatus: latestSubmission ? statusLabel(latestSubmission.status) : next ? 'Not started' : 'No checkpoint', nextCheckpointTitle: next?.checkpoint.title ?? null, nextCheckpointDueAt: next?.checkpoint.dueAt ?? null, lastUploadAt, aiReviewStatus, advisorScore };
      }));
    }),

  getChapterProgress: protectedProcedure.input(z.object({ schoolCode: z.string().trim().min(1).max(50).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const schoolCode = requirePortfolioAdminSchool(ctx.user, input?.schoolCode);
      const database = await requirePortfolioDatabase();
      const [checkpointRows, submissionRows, evaluationRows] = await Promise.all([
        database.select({ status: portfolioCheckpoints.status, id: portfolioCheckpoints.id, dueAt: portfolioCheckpoints.dueAt }).from(portfolioCheckpoints).where(eq(portfolioCheckpoints.schoolCode, schoolCode)),
        database.select({ status: portfolioSubmissions.status, isLate: portfolioSubmissions.isLate, eventCode: portfolioSubmissions.eventCode, checkpointId: portfolioSubmissions.checkpointId }).from(portfolioSubmissions).where(eq(portfolioSubmissions.schoolCode, schoolCode)),
        database.select({ recommendedScore: portfolioEvaluations.recommendedScore, advisorScore: portfolioEvaluations.advisorScore, eventCode: portfolioEvaluations.eventCode, status: portfolioEvaluations.status }).from(portfolioEvaluations)
          .innerJoin(portfolioSubmissions, eq(portfolioEvaluations.submissionId, portfolioSubmissions.id)).where(eq(portfolioSubmissions.schoolCode, schoolCode)),
      ]);
      const now = Date.now();
      const published = checkpointRows.filter((checkpoint) => checkpoint.status === "published");
      const submitted = submissionRows.filter((submission) => ["submitted", "review_ready", "needs_revision", "approved"].includes(submission.status));
      const late = submissionRows.filter((submission) => submission.isLate);
      const overdueCheckpointIds = new Set(published.filter((checkpoint) => checkpoint.dueAt && checkpoint.dueAt.getTime() < now).map((checkpoint) => checkpoint.id));
      const overdue = submissionRows.filter((submission) => overdueCheckpointIds.has(submission.checkpointId) && !["submitted", "review_ready", "needs_revision", "approved"].includes(submission.status));
      const byEvent = new Map<string, { total: number; submitted: number; late: number; scores: number[] }>();
      for (const submission of submissionRows) {
        const current = byEvent.get(submission.eventCode) ?? { total: 0, submitted: 0, late: 0, scores: [] };
        current.total += 1;
        if (["submitted", "review_ready", "needs_revision", "approved"].includes(submission.status)) current.submitted += 1;
        if (submission.isLate) current.late += 1;
        byEvent.set(submission.eventCode, current);
      }
      for (const evaluation of evaluationRows) {
        const current = byEvent.get(evaluation.eventCode) ?? { total: 0, submitted: 0, late: 0, scores: [] };
        const score = evaluation.advisorScore ?? evaluation.recommendedScore;
        if (score !== null && score !== undefined) current.scores.push(score);
        byEvent.set(evaluation.eventCode, current);
      }
      return {
        summary: { publishedCheckpoints: published.length, totalSubmissions: submissionRows.length, submitted: submitted.length, pending: Math.max(0, submissionRows.length - submitted.length), late: late.length, overdue: overdue.length, completionPercent: submissionRows.length ? Math.round((submitted.length / submissionRows.length) * 100) : 0 },
        byEvent: Array.from(byEvent.entries()).map(([eventCode, value]) => ({ eventCode, total: value.total, submitted: value.submitted, late: value.late, averageScore: value.scores.length ? Math.round(value.scores.reduce((sum, score) => sum + score, 0) / value.scores.length) : null })),
      };
    }),

  listAuditLog: protectedProcedure.input(z.object({ schoolCode: z.string().trim().min(1).max(50).optional(), entityType: z.enum(["team", "checkpoint", "submission", "version", "evaluation", "integrity_finding", "comment", "timeline_link"]).optional(), limit: z.number().int().min(1).max(200).default(100) }).optional())
    .query(async ({ ctx, input }) => {
      const schoolCode = requirePortfolioAdminSchool(ctx.user, input?.schoolCode);
      const database = await requirePortfolioDatabase();
      const conditions = [eq((await import("../drizzle/schema")).portfolioAuditLog.schoolCode, schoolCode)];
      if (input?.entityType) conditions.push(eq((await import("../drizzle/schema")).portfolioAuditLog.entityType, input.entityType));
      const { portfolioAuditLog } = await import("../drizzle/schema");
      return database.select({ log: portfolioAuditLog, actorName: users.name }).from(portfolioAuditLog).leftJoin(users, eq(portfolioAuditLog.actorUserId, users.id)).where(and(...conditions)).orderBy(desc(portfolioAuditLog.createdAt)).limit(input?.limit ?? 100);
    }),
});
