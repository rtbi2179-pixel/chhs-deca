CREATE TABLE `chapterTabVisits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`schoolCode` varchar(50) NOT NULL,
	`tab` enum('calendar','announcements','discussions','volunteer') NOT NULL,
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chapterTabVisits_id` PRIMARY KEY(`id`),
	CONSTRAINT `chapter_tab_visits_user_school_tab_unique` UNIQUE(`userId`,`schoolCode`,`tab`)
);
--> statement-breakpoint
ALTER TABLE `chapterTabVisits` ADD CONSTRAINT `chapterTabVisits_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `chapter_tab_visits_school_tab_seen_idx` ON `chapterTabVisits` (`schoolCode`,`tab`,`lastSeenAt`);