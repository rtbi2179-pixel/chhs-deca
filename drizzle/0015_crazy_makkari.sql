CREATE TABLE IF NOT EXISTS `chapterExamActivity` (
  `id` int AUTO_INCREMENT NOT NULL,
  `attemptId` int NOT NULL,
  `userId` int NOT NULL,
  `eventType` enum('rapid_answer','tab_hidden') NOT NULL,
  `questionId` varchar(50),
  `elapsedSeconds` int,
  `occurredAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `chapterExamActivity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `chapterExamAttempts` (
  `id` int AUTO_INCREMENT NOT NULL,
  `configId` int NOT NULL,
  `schoolCode` varchar(50) NOT NULL,
  `userId` int NOT NULL,
  `sessionId` int NOT NULL,
  `cluster` varchar(255) NOT NULL,
  `questionCount` int NOT NULL,
  `scoreVisible` boolean NOT NULL,
  `startedAt` timestamp NOT NULL DEFAULT (now()),
  `expiresAt` timestamp NOT NULL,
  `completedAt` timestamp,
  `score` int,
  `accuracy` int,
  `suspiciousActivityCount` int NOT NULL DEFAULT 0,
  CONSTRAINT `chapterExamAttempts_id` PRIMARY KEY(`id`),
  CONSTRAINT `chapter_exam_attempt_member_config_unique` UNIQUE(`configId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `chapterExamConfigs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `schoolCode` varchar(50) NOT NULL,
  `isEnabled` boolean NOT NULL DEFAULT false,
  `cluster` varchar(255) NOT NULL DEFAULT 'Marketing',
  `questionCount` int NOT NULL DEFAULT 100,
  `extraTimeMinutes` int NOT NULL DEFAULT 0,
  `scoreVisible` boolean NOT NULL DEFAULT true,
  `availableFrom` timestamp,
  `availableUntil` timestamp,
  `createdBy` int,
  `updatedBy` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `chapterExamConfigs_id` PRIMARY KEY(`id`),
  CONSTRAINT `chapter_exam_config_school_unique` UNIQUE(`schoolCode`)
);
--> statement-breakpoint
CREATE INDEX `chapter_exam_activity_attempt_idx` ON `chapterExamActivity` (`attemptId`,`occurredAt`);
--> statement-breakpoint
CREATE INDEX `chapter_exam_attempt_member_idx` ON `chapterExamAttempts` (`schoolCode`,`userId`,`completedAt`);
