CREATE TABLE `schoolCodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`schoolName` varchar(255) NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `schoolCodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `schoolCodes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `loginMethod` varchar(64) DEFAULT 'custom';--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `schoolCode` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `firstName` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `lastName` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);