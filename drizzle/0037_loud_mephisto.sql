CREATE TABLE `decaAiJudgeAcousticAnalyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recordingId` int NOT NULL,
	`metrics` json NOT NULL,
	`confidence` decimal(4,2) NOT NULL,
	`analysisVersion` varchar(80) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `decaAiJudgeAcousticAnalyses_id` PRIMARY KEY(`id`),
	CONSTRAINT `deca_ai_judge_acoustic_recording_unique` UNIQUE(`recordingId`)
);
--> statement-breakpoint
CREATE TABLE `decaAiJudgeRecordingChunks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recordingId` int NOT NULL,
	`sequence` int NOT NULL,
	`storageKey` varchar(1024) NOT NULL,
	`fileSizeBytes` int NOT NULL,
	`startMs` int NOT NULL,
	`endMs` int NOT NULL,
	`uploadStatus` enum('uploaded','failed') NOT NULL DEFAULT 'uploaded',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `decaAiJudgeRecordingChunks_id` PRIMARY KEY(`id`),
	CONSTRAINT `deca_ai_judge_recording_chunk_sequence_unique` UNIQUE(`recordingId`,`sequence`)
);
--> statement-breakpoint
CREATE TABLE `decaAiJudgeRecordingSegments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recordingId` int NOT NULL,
	`segmentType` enum('presentation','judge_question','participant_response') NOT NULL,
	`startMs` int NOT NULL,
	`endMs` int NOT NULL,
	`label` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `decaAiJudgeRecordingSegments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `decaAiJudgeRecordingTranscripts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recordingId` int NOT NULL,
	`rawTranscript` text NOT NULL,
	`segments` json,
	`language` varchar(20),
	`provider` varchar(100) NOT NULL,
	`confidence` decimal(4,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `decaAiJudgeRecordingTranscripts_id` PRIMARY KEY(`id`),
	CONSTRAINT `deca_ai_judge_transcript_recording_unique` UNIQUE(`recordingId`)
);
--> statement-breakpoint
CREATE TABLE `decaAiJudgeRecordings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`recordingType` enum('presentation','judge_question','participant_response') NOT NULL DEFAULT 'presentation',
	`storageKey` varchar(1024) NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`durationMs` int NOT NULL,
	`hasAudio` boolean NOT NULL DEFAULT true,
	`hasVideo` boolean NOT NULL DEFAULT false,
	`fileSizeBytes` int NOT NULL,
	`uploadStatus` enum('uploading','uploaded','processing','failed') NOT NULL DEFAULT 'uploaded',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `decaAiJudgeRecordings_id` PRIMARY KEY(`id`),
	CONSTRAINT `deca_ai_judge_recording_session_type_unique` UNIQUE(`sessionId`,`recordingType`)
);
--> statement-breakpoint
CREATE TABLE `decaAiJudgeWrittenSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`storageKey` varchar(1024) NOT NULL,
	`fileName` varchar(512) NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`fileSizeBytes` int NOT NULL,
	`parsedContent` text,
	`pageCount` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `decaAiJudgeWrittenSubmissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `deca_ai_judge_written_submission_session_unique` UNIQUE(`sessionId`)
);
--> statement-breakpoint
CREATE TABLE `roleplayAcousticAnalyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recordingId` int NOT NULL,
	`metrics` json NOT NULL,
	`confidence` decimal(4,2) NOT NULL,
	`analysisVersion` varchar(80) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roleplayAcousticAnalyses_id` PRIMARY KEY(`id`),
	CONSTRAINT `roleplay_acoustic_recording_unique` UNIQUE(`recordingId`)
);
--> statement-breakpoint
CREATE TABLE `roleplayRecordingChunks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recordingId` int NOT NULL,
	`sequence` int NOT NULL,
	`storageKey` varchar(1024) NOT NULL,
	`fileSizeBytes` int NOT NULL,
	`startMs` int NOT NULL,
	`endMs` int NOT NULL,
	`uploadStatus` enum('uploaded','failed') NOT NULL DEFAULT 'uploaded',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `roleplayRecordingChunks_id` PRIMARY KEY(`id`),
	CONSTRAINT `roleplay_recording_chunk_sequence_unique` UNIQUE(`recordingId`,`sequence`)
);
--> statement-breakpoint
CREATE TABLE `roleplayRecordingSegments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recordingId` int NOT NULL,
	`segmentType` enum('presentation','judge_question','participant_response') NOT NULL,
	`startMs` int NOT NULL,
	`endMs` int NOT NULL,
	`label` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `roleplayRecordingSegments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `decaAiJudgeSessions` MODIFY COLUMN `submissionMode` enum('reviewed_transcript','recorded_presentation') NOT NULL DEFAULT 'reviewed_transcript';--> statement-breakpoint
ALTER TABLE `decaAiJudgeSessions` MODIFY COLUMN `status` enum('setup','recording','uploading','processing','analyzing','completed','failed') NOT NULL DEFAULT 'analyzing';--> statement-breakpoint
ALTER TABLE `decaAiJudgeSessions` ADD `recordingState` enum('idle','requesting_permission','ready','recording','finalizing','uploading','uploaded','processing','permission_denied','device_error','upload_paused','upload_failed','transcription_failed','analysis_failed','grading_failed') DEFAULT 'idle' NOT NULL;--> statement-breakpoint
ALTER TABLE `decaAiJudgeSessions` ADD `sourceAvailability` json;--> statement-breakpoint
ALTER TABLE `decaAiJudgeSessions` ADD `failureReason` varchar(512);--> statement-breakpoint
ALTER TABLE `roleplayRecordings` ADD `durationMs` int;--> statement-breakpoint
ALTER TABLE `roleplayRecordings` ADD `hasAudio` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `roleplayRecordings` ADD `hasVideo` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `roleplayRecordings` ADD `uploadStatus` enum('uploading','uploaded','processing','failed') DEFAULT 'uploaded' NOT NULL;--> statement-breakpoint
ALTER TABLE `decaAiJudgeAcousticAnalyses` ADD CONSTRAINT `daj_acoustic_recording_fk` FOREIGN KEY (`recordingId`) REFERENCES `decaAiJudgeRecordings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `decaAiJudgeRecordingChunks` ADD CONSTRAINT `daj_chunks_recording_fk` FOREIGN KEY (`recordingId`) REFERENCES `decaAiJudgeRecordings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `decaAiJudgeRecordingSegments` ADD CONSTRAINT `daj_segments_recording_fk` FOREIGN KEY (`recordingId`) REFERENCES `decaAiJudgeRecordings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `decaAiJudgeRecordingTranscripts` ADD CONSTRAINT `daj_transcript_recording_fk` FOREIGN KEY (`recordingId`) REFERENCES `decaAiJudgeRecordings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `decaAiJudgeRecordings` ADD CONSTRAINT `daj_recording_session_fk` FOREIGN KEY (`sessionId`) REFERENCES `decaAiJudgeSessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `decaAiJudgeWrittenSubmissions` ADD CONSTRAINT `daj_written_session_fk` FOREIGN KEY (`sessionId`) REFERENCES `decaAiJudgeSessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `roleplayAcousticAnalyses` ADD CONSTRAINT `roleplay_acoustic_recording_fk` FOREIGN KEY (`recordingId`) REFERENCES `roleplayRecordings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `roleplayRecordingChunks` ADD CONSTRAINT `roleplay_chunks_recording_fk` FOREIGN KEY (`recordingId`) REFERENCES `roleplayRecordings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `roleplayRecordingSegments` ADD CONSTRAINT `roleplay_segments_recording_fk` FOREIGN KEY (`recordingId`) REFERENCES `roleplayRecordings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `deca_ai_judge_segment_recording_idx` ON `decaAiJudgeRecordingSegments` (`recordingId`,`startMs`);--> statement-breakpoint
CREATE INDEX `deca_ai_judge_recording_session_idx` ON `decaAiJudgeRecordings` (`sessionId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `roleplay_recording_segment_recording_idx` ON `roleplayRecordingSegments` (`recordingId`,`startMs`);
