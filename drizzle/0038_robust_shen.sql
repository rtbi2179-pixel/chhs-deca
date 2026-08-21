CREATE TABLE `decaTeamMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`userId` int NOT NULL,
	`memberRole` enum('lead','member') NOT NULL DEFAULT 'member',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`leftAt` timestamp,
	CONSTRAINT `decaTeamMembers_id` PRIMARY KEY(`id`),
	CONSTRAINT `deca_team_members_team_user_unique` UNIQUE(`teamId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `decaTeams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`schoolCode` varchar(50) NOT NULL,
	`eventCode` varchar(20) NOT NULL,
	`teamName` varchar(160) NOT NULL,
	`season` varchar(20) NOT NULL,
	`createdByUserId` int,
	`archivedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `decaTeams_id` PRIMARY KEY(`id`),
	CONSTRAINT `deca_teams_chapter_name_season_unique` UNIQUE(`schoolCode`,`teamName`,`season`)
);
--> statement-breakpoint
CREATE TABLE `portfolioAuditLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`schoolCode` varchar(50) NOT NULL,
	`entityType` enum('team','checkpoint','submission','version','evaluation','integrity_finding','comment','timeline_link') NOT NULL,
	`entityId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`actorUserId` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portfolioAuditLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolioCheckpointAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`checkpointId` int NOT NULL,
	`assignmentType` enum('chapter','event','team','member') NOT NULL,
	`eventCode` varchar(20),
	`teamId` int,
	`memberId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portfolioCheckpointAssignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolioCheckpointTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`schoolCode` varchar(50) NOT NULL,
	`season` varchar(20) NOT NULL,
	`name` varchar(160) NOT NULL,
	`eventCode` varchar(20),
	`templateJson` json NOT NULL,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolioCheckpointTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolioCheckpointTimelineLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`checkpointId` int NOT NULL,
	`userId` int NOT NULL,
	`timelineId` int NOT NULL,
	`timelineItemId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolioCheckpointTimelineLinks_id` PRIMARY KEY(`id`),
	CONSTRAINT `portfolio_checkpoint_timeline_checkpoint_user_unique` UNIQUE(`checkpointId`,`userId`),
	CONSTRAINT `portfolio_checkpoint_timeline_item_unique` UNIQUE(`timelineItemId`)
);
--> statement-breakpoint
CREATE TABLE `portfolioCheckpoints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`schoolCode` varchar(50) NOT NULL,
	`season` varchar(20) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`dueAt` timestamp,
	`submissionType` enum('pdf','document','presentation','image_evidence','spreadsheet','any_file','multiple_files','completion_check') NOT NULL DEFAULT 'any_file',
	`required` boolean NOT NULL DEFAULT true,
	`allowLate` boolean NOT NULL DEFAULT false,
	`allowMultipleVersions` boolean NOT NULL DEFAULT true,
	`aiEvaluationMode` enum('automatic','advisor_launch','disabled') NOT NULL DEFAULT 'advisor_launch',
	`manualReviewRequired` boolean NOT NULL DEFAULT true,
	`createdByUserId` int NOT NULL,
	`publishedAt` timestamp,
	`archivedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolioCheckpoints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolioEvaluationCalibrationFeedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evaluationId` int NOT NULL,
	`advisorUserId` int NOT NULL,
	`aiCalibration` enum('too_high','accurate','too_low') NOT NULL,
	`criterionOverrides` json,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portfolioEvaluationCalibrationFeedback_id` PRIMARY KEY(`id`),
	CONSTRAINT `portfolio_evaluation_calibration_evaluation_advisor_unique` UNIQUE(`evaluationId`,`advisorUserId`)
);
--> statement-breakpoint
CREATE TABLE `portfolioEvaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`submissionId` int NOT NULL,
	`versionId` int NOT NULL,
	`ruleSetId` int,
	`evaluationMode` enum('ai','manual','combined') NOT NULL,
	`status` enum('queued','processing','completed','failed','superseded') NOT NULL DEFAULT 'queued',
	`eventCode` varchar(20) NOT NULL,
	`season` varchar(20) NOT NULL,
	`rubricVersion` varchar(100),
	`rubricScores` json,
	`recommendedScore` int,
	`observableMaximumPoints` int,
	`advisorScore` int,
	`advisorNotes` text,
	`advisorUserId` int,
	`advisorCompletedAt` timestamp,
	`piAnalysis` json,
	`complianceFindings` json,
	`sourceReview` json,
	`quantitativeReview` json,
	`versionComparison` json,
	`competitiveReadiness` json,
	`topPriorities` json,
	`pointsLeftOnTable` json,
	`modelMetadata` json,
	`failureReason` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `portfolioEvaluations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolioIntegrityFindings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evaluationId` int NOT NULL,
	`findingType` enum('possible_ai_authorship','date_inconsistency','unsupported_claim','source_verification','numerical_inconsistency','internal_contradiction','potential_fabrication','format_compliance','possible_penalty') NOT NULL,
	`priority` enum('low','moderate','elevated','high') NOT NULL,
	`confidence` enum('low','medium','high') NOT NULL,
	`description` text NOT NULL,
	`evidence` json NOT NULL,
	`alternativeExplanations` json,
	`advisorAction` text NOT NULL,
	`humanDecision` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
	`humanNote` text,
	`studentVisibleMessage` text,
	`decidedByUserId` int,
	`decidedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portfolioIntegrityFindings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolioReviewComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evaluationId` int NOT NULL,
	`criterionId` varchar(120),
	`authorUserId` int NOT NULL,
	`visibility` enum('advisor_only','member') NOT NULL DEFAULT 'member',
	`comment` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolioReviewComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolioSubmissionVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`submissionId` int NOT NULL,
	`versionNumber` int NOT NULL,
	`notes` text,
	`uploadedByUserId` int NOT NULL,
	`processingStatus` enum('uploading','uploaded','reading_submission','checking_requirements','analyzing_rubric','reviewing_evidence','checking_consistency','building_evaluation','ready','failed') NOT NULL DEFAULT 'uploaded',
	`processingError` varchar(512),
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portfolioSubmissionVersions_id` PRIMARY KEY(`id`),
	CONSTRAINT `portfolio_submission_versions_submission_version_unique` UNIQUE(`submissionId`,`versionNumber`)
);
--> statement-breakpoint
CREATE TABLE `portfolioSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`checkpointId` int NOT NULL,
	`schoolCode` varchar(50) NOT NULL,
	`subjectType` enum('member','team') NOT NULL,
	`subjectKey` varchar(64) NOT NULL,
	`memberId` int,
	`teamId` int,
	`eventCode` varchar(20) NOT NULL,
	`status` enum('not_started','uploading','submitted','processing','review_ready','needs_revision','approved','archived','failed') NOT NULL DEFAULT 'not_started',
	`submittedByUserId` int,
	`submittedAt` timestamp,
	`isLate` boolean NOT NULL DEFAULT false,
	`activeVersionId` int,
	`archivedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolioSubmissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `portfolio_submissions_checkpoint_subject_unique` UNIQUE(`checkpointId`,`subjectKey`)
);
--> statement-breakpoint
CREATE TABLE `portfolioVersionFiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`versionId` int NOT NULL,
	`storageKey` varchar(1024) NOT NULL,
	`fileName` varchar(512) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`fileSizeBytes` int NOT NULL,
	`parsedContent` text,
	`pageCount` int,
	`extractionStatus` enum('pending','extracted','unsupported','failed') NOT NULL DEFAULT 'pending',
	`extractionError` varchar(512),
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portfolioVersionFiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `decaTeamMembers` ADD CONSTRAINT `decaTeamMembers_teamId_decaTeams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `decaTeams`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `decaTeamMembers` ADD CONSTRAINT `decaTeamMembers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `decaTeams` ADD CONSTRAINT `decaTeams_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioAuditLog` ADD CONSTRAINT `portfolioAuditLog_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioCheckpointAssignments` ADD CONSTRAINT `pcpa_checkpoint_fk` FOREIGN KEY (`checkpointId`) REFERENCES `portfolioCheckpoints`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioCheckpointAssignments` ADD CONSTRAINT `pcpa_team_fk` FOREIGN KEY (`teamId`) REFERENCES `decaTeams`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioCheckpointAssignments` ADD CONSTRAINT `pcpa_member_fk` FOREIGN KEY (`memberId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioCheckpointTemplates` ADD CONSTRAINT `pct_creator_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioCheckpointTimelineLinks` ADD CONSTRAINT `pctl_checkpoint_fk` FOREIGN KEY (`checkpointId`) REFERENCES `portfolioCheckpoints`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioCheckpointTimelineLinks` ADD CONSTRAINT `pctl_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioCheckpointTimelineLinks` ADD CONSTRAINT `pctl_timeline_fk` FOREIGN KEY (`timelineId`) REFERENCES `userEventTimelines`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioCheckpointTimelineLinks` ADD CONSTRAINT `pctl_item_fk` FOREIGN KEY (`timelineItemId`) REFERENCES `timelineItems`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioCheckpoints` ADD CONSTRAINT `pc_creator_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioEvaluationCalibrationFeedback` ADD CONSTRAINT `pecf_evaluation_fk` FOREIGN KEY (`evaluationId`) REFERENCES `portfolioEvaluations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioEvaluationCalibrationFeedback` ADD CONSTRAINT `pecf_advisor_fk` FOREIGN KEY (`advisorUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioEvaluations` ADD CONSTRAINT `pe_submission_fk` FOREIGN KEY (`submissionId`) REFERENCES `portfolioSubmissions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioEvaluations` ADD CONSTRAINT `pe_version_fk` FOREIGN KEY (`versionId`) REFERENCES `portfolioSubmissionVersions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioEvaluations` ADD CONSTRAINT `pe_ruleset_fk` FOREIGN KEY (`ruleSetId`) REFERENCES `decaAiJudgeRuleSets`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioEvaluations` ADD CONSTRAINT `pe_advisor_fk` FOREIGN KEY (`advisorUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioIntegrityFindings` ADD CONSTRAINT `pif_evaluation_fk` FOREIGN KEY (`evaluationId`) REFERENCES `portfolioEvaluations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioIntegrityFindings` ADD CONSTRAINT `pif_decider_fk` FOREIGN KEY (`decidedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioReviewComments` ADD CONSTRAINT `prc_evaluation_fk` FOREIGN KEY (`evaluationId`) REFERENCES `portfolioEvaluations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioReviewComments` ADD CONSTRAINT `prc_author_fk` FOREIGN KEY (`authorUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioSubmissionVersions` ADD CONSTRAINT `psv_submission_fk` FOREIGN KEY (`submissionId`) REFERENCES `portfolioSubmissions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioSubmissionVersions` ADD CONSTRAINT `psv_uploader_fk` FOREIGN KEY (`uploadedByUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioSubmissions` ADD CONSTRAINT `ps_checkpoint_fk` FOREIGN KEY (`checkpointId`) REFERENCES `portfolioCheckpoints`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioSubmissions` ADD CONSTRAINT `ps_member_fk` FOREIGN KEY (`memberId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioSubmissions` ADD CONSTRAINT `ps_team_fk` FOREIGN KEY (`teamId`) REFERENCES `decaTeams`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioSubmissions` ADD CONSTRAINT `ps_submitter_fk` FOREIGN KEY (`submittedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioVersionFiles` ADD CONSTRAINT `pvf_version_fk` FOREIGN KEY (`versionId`) REFERENCES `portfolioSubmissionVersions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `deca_team_members_user_idx` ON `decaTeamMembers` (`userId`,`leftAt`);--> statement-breakpoint
CREATE INDEX `deca_teams_chapter_event_idx` ON `decaTeams` (`schoolCode`,`eventCode`,`season`);--> statement-breakpoint
CREATE INDEX `portfolio_audit_log_entity_idx` ON `portfolioAuditLog` (`entityType`,`entityId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `portfolio_audit_log_chapter_created_idx` ON `portfolioAuditLog` (`schoolCode`,`createdAt`);--> statement-breakpoint
CREATE INDEX `portfolio_checkpoint_assignment_checkpoint_idx` ON `portfolioCheckpointAssignments` (`checkpointId`,`assignmentType`);--> statement-breakpoint
CREATE INDEX `portfolio_checkpoint_assignment_member_idx` ON `portfolioCheckpointAssignments` (`memberId`,`checkpointId`);--> statement-breakpoint
CREATE INDEX `portfolio_checkpoint_assignment_team_idx` ON `portfolioCheckpointAssignments` (`teamId`,`checkpointId`);--> statement-breakpoint
CREATE INDEX `portfolio_checkpoint_templates_chapter_season_idx` ON `portfolioCheckpointTemplates` (`schoolCode`,`season`);--> statement-breakpoint
CREATE INDEX `portfolio_checkpoint_timeline_timeline_idx` ON `portfolioCheckpointTimelineLinks` (`timelineId`,`checkpointId`);--> statement-breakpoint
CREATE INDEX `portfolio_checkpoints_chapter_status_due_idx` ON `portfolioCheckpoints` (`schoolCode`,`status`,`dueAt`);--> statement-breakpoint
CREATE INDEX `portfolio_checkpoints_chapter_season_idx` ON `portfolioCheckpoints` (`schoolCode`,`season`);--> statement-breakpoint
CREATE INDEX `portfolio_evaluations_submission_version_created_idx` ON `portfolioEvaluations` (`submissionId`,`versionId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `portfolio_evaluations_event_status_idx` ON `portfolioEvaluations` (`eventCode`,`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `portfolio_integrity_findings_evaluation_decision_idx` ON `portfolioIntegrityFindings` (`evaluationId`,`humanDecision`);--> statement-breakpoint
CREATE INDEX `portfolio_review_comments_evaluation_visibility_idx` ON `portfolioReviewComments` (`evaluationId`,`visibility`);--> statement-breakpoint
CREATE INDEX `portfolio_submission_versions_submission_idx` ON `portfolioSubmissionVersions` (`submissionId`,`submittedAt`);--> statement-breakpoint
CREATE INDEX `portfolio_submissions_member_idx` ON `portfolioSubmissions` (`memberId`,`status`);--> statement-breakpoint
CREATE INDEX `portfolio_submissions_team_idx` ON `portfolioSubmissions` (`teamId`,`status`);--> statement-breakpoint
CREATE INDEX `portfolio_submissions_chapter_status_idx` ON `portfolioSubmissions` (`schoolCode`,`status`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `portfolio_version_files_version_idx` ON `portfolioVersionFiles` (`versionId`,`uploadedAt`);
