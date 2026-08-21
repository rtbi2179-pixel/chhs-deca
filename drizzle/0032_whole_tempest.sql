CREATE TABLE `decaAiJudgeRuleSets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`competitionYear` varchar(20) NOT NULL,
	`eventCode` varchar(20) NOT NULL,
	`version` varchar(80) NOT NULL,
	`eventName` varchar(160) NOT NULL,
	`sourceUrl` varchar(1024) NOT NULL,
	`sourceVersion` varchar(255) NOT NULL,
	`verified` boolean NOT NULL DEFAULT false,
	`verifiedAt` timestamp,
	`rulesJson` json NOT NULL,
	`rubricJson` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `decaAiJudgeRuleSets_id` PRIMARY KEY(`id`),
	CONSTRAINT `deca_ai_judge_rule_set_year_event_version_unique` UNIQUE(`competitionYear`,`eventCode`,`version`)
);
--> statement-breakpoint
CREATE TABLE `decaAiJudgeSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ruleSetId` int NOT NULL,
	`competitionYear` varchar(20) NOT NULL,
	`eventCode` varchar(20) NOT NULL,
	`ruleSetVersion` varchar(80) NOT NULL,
	`groupSize` int NOT NULL,
	`submissionMode` enum('reviewed_transcript') NOT NULL DEFAULT 'reviewed_transcript',
	`rawTranscript` text NOT NULL,
	`correctedTranscript` text NOT NULL,
	`durationSeconds` int,
	`status` enum('analyzing','completed','failed') NOT NULL DEFAULT 'analyzing',
	`observableScore` int,
	`observableMaximumPoints` int,
	`fullEstimatedScore` int,
	`confidence` decimal(4,2),
	`resultJson` json,
	`modelMetadataJson` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `decaAiJudgeSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `decaAiJudgeSessions` ADD CONSTRAINT `decaAiJudgeSessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `decaAiJudgeSessions` ADD CONSTRAINT `decaAiJudgeSessions_ruleSetId_decaAiJudgeRuleSets_id_fk` FOREIGN KEY (`ruleSetId`) REFERENCES `decaAiJudgeRuleSets`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `deca_ai_judge_rule_set_verified_event_idx` ON `decaAiJudgeRuleSets` (`verified`,`competitionYear`,`eventCode`);--> statement-breakpoint
CREATE INDEX `deca_ai_judge_session_user_created_idx` ON `decaAiJudgeSessions` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `deca_ai_judge_session_rule_set_idx` ON `decaAiJudgeSessions` (`ruleSetId`,`createdAt`);