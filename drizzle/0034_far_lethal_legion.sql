CREATE TABLE `decaEventRubrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventCode` varchar(20) NOT NULL,
	`season` varchar(20) NOT NULL,
	`version` varchar(80) NOT NULL,
	`rubricType` enum('roleplay_practice') NOT NULL DEFAULT 'roleplay_practice',
	`rubricJson` json NOT NULL,
	`sourceUrl` varchar(1024) NOT NULL,
	`sourceVersion` varchar(255) NOT NULL,
	`verificationStatus` enum('verified','unverified') NOT NULL DEFAULT 'unverified',
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `decaEventRubrics_id` PRIMARY KEY(`id`),
	CONSTRAINT `deca_event_rubric_event_season_version_unique` UNIQUE(`eventCode`,`season`,`version`)
);
--> statement-breakpoint
CREATE TABLE `roleplayAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventCode` varchar(20) NOT NULL,
	`scenarioId` int NOT NULL,
	`rubricId` int NOT NULL,
	`trainingMode` enum('competition','practice','coach') NOT NULL,
	`status` enum('briefing','preparing','judge_intro','interview','follow_up','submitted','transcribing','evaluating','completed','failed','abandoned') NOT NULL DEFAULT 'briefing',
	`prepStartedAt` timestamp,
	`interviewStartedAt` timestamp,
	`submittedAt` timestamp,
	`completedAt` timestamp,
	`prepDurationSeconds` int NOT NULL,
	`interviewDurationSeconds` int NOT NULL,
	`scratchpad` text,
	`activeState` json,
	`totalScore` int,
	`performanceLevel` varchar(50),
	`rubricVersion` varchar(80) NOT NULL,
	`failureReason` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roleplayAttempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roleplayEvaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attemptId` int NOT NULL,
	`piScores` json NOT NULL,
	`deliveryAnalysis` json NOT NULL,
	`overallScore` int NOT NULL,
	`performanceLevel` varchar(50) NOT NULL,
	`strengths` json NOT NULL,
	`improvements` json NOT NULL,
	`trainingRecommendations` json NOT NULL,
	`modelMetadata` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roleplayEvaluations_id` PRIMARY KEY(`id`),
	CONSTRAINT `roleplay_evaluation_attempt_unique` UNIQUE(`attemptId`)
);
--> statement-breakpoint
CREATE TABLE `roleplayJudgeTurns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attemptId` int NOT NULL,
	`sequence` int NOT NULL,
	`turnType` enum('introduction','follow_up') NOT NULL,
	`question` text NOT NULL,
	`basis` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `roleplayJudgeTurns_id` PRIMARY KEY(`id`),
	CONSTRAINT `roleplay_judge_turn_attempt_sequence_unique` UNIQUE(`attemptId`,`sequence`)
);
--> statement-breakpoint
CREATE TABLE `roleplayRecordings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attemptId` int NOT NULL,
	`phase` enum('interview') NOT NULL DEFAULT 'interview',
	`audioStorageKey` varchar(1024) NOT NULL,
	`contentType` varchar(100) NOT NULL,
	`durationSeconds` int NOT NULL,
	`fileSizeBytes` int NOT NULL,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `roleplayRecordings_id` PRIMARY KEY(`id`),
	CONSTRAINT `roleplay_recording_attempt_phase_unique` UNIQUE(`attemptId`,`phase`)
);
--> statement-breakpoint
CREATE TABLE `roleplayScenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventCode` varchar(20) NOT NULL,
	`careerCluster` varchar(80) NOT NULL,
	`instructionalArea` varchar(255) NOT NULL,
	`difficulty` enum('foundational','competition','stretch') NOT NULL DEFAULT 'competition',
	`participantRole` varchar(255) NOT NULL,
	`judgeRole` varchar(255) NOT NULL,
	`companyContext` text NOT NULL,
	`situation` text NOT NULL,
	`task` text NOT NULL,
	`performanceIndicators` json NOT NULL,
	`judgeContext` text NOT NULL,
	`judgeQuestions` json NOT NULL,
	`expectedBusinessConcepts` json NOT NULL,
	`scenarioData` json,
	`sourceType` enum('official_public_sample','blue_blazer_original','ai_generated') NOT NULL,
	`sourceYear` varchar(20) NOT NULL,
	`sourceAttribution` varchar(1024),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roleplayScenarios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roleplayTranscripts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attemptId` int NOT NULL,
	`phase` enum('interview') NOT NULL DEFAULT 'interview',
	`rawText` text NOT NULL,
	`cleanedText` text NOT NULL,
	`segments` json,
	`whisperModel` varchar(100),
	`transcribedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `roleplayTranscripts_id` PRIMARY KEY(`id`),
	CONSTRAINT `roleplay_transcript_attempt_phase_unique` UNIQUE(`attemptId`,`phase`)
);
--> statement-breakpoint
ALTER TABLE `roleplayAttempts` ADD CONSTRAINT `roleplayAttempts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `roleplayAttempts` ADD CONSTRAINT `roleplayAttempts_scenarioId_roleplayScenarios_id_fk` FOREIGN KEY (`scenarioId`) REFERENCES `roleplayScenarios`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `roleplayAttempts` ADD CONSTRAINT `roleplayAttempts_rubricId_decaEventRubrics_id_fk` FOREIGN KEY (`rubricId`) REFERENCES `decaEventRubrics`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `roleplayEvaluations` ADD CONSTRAINT `roleplayEvaluations_attemptId_roleplayAttempts_id_fk` FOREIGN KEY (`attemptId`) REFERENCES `roleplayAttempts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `roleplayJudgeTurns` ADD CONSTRAINT `roleplayJudgeTurns_attemptId_roleplayAttempts_id_fk` FOREIGN KEY (`attemptId`) REFERENCES `roleplayAttempts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `roleplayRecordings` ADD CONSTRAINT `roleplayRecordings_attemptId_roleplayAttempts_id_fk` FOREIGN KEY (`attemptId`) REFERENCES `roleplayAttempts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `roleplayTranscripts` ADD CONSTRAINT `roleplayTranscripts_attemptId_roleplayAttempts_id_fk` FOREIGN KEY (`attemptId`) REFERENCES `roleplayAttempts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `deca_event_rubric_event_season_idx` ON `decaEventRubrics` (`eventCode`,`season`);--> statement-breakpoint
CREATE INDEX `roleplay_attempt_user_created_idx` ON `roleplayAttempts` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `roleplay_attempt_user_status_idx` ON `roleplayAttempts` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `roleplay_attempt_scenario_idx` ON `roleplayAttempts` (`scenarioId`);--> statement-breakpoint
CREATE INDEX `roleplay_scenario_event_source_created_idx` ON `roleplayScenarios` (`eventCode`,`sourceType`,`createdAt`);