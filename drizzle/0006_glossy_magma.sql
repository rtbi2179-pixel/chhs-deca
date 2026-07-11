CREATE TABLE `emailBlacklist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`reason` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailBlacklist_id` PRIMARY KEY(`id`),
	CONSTRAINT `emailBlacklist_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `schoolCodeAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`attemptCount` int NOT NULL DEFAULT 0,
	`lastAttemptAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `schoolCodeAttempts_id` PRIMARY KEY(`id`)
);
