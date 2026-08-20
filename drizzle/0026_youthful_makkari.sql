CREATE TABLE `websiteInteractionEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`schoolCode` varchar(50) NOT NULL,
	`eventType` enum('page_view','control_click') NOT NULL,
	`path` varchar(255) NOT NULL,
	`label` varchar(120),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `websiteInteractionEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `websiteInteractionEvents` ADD CONSTRAINT `websiteInteractionEvents_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `website_interaction_school_time_idx` ON `websiteInteractionEvents` (`schoolCode`,`createdAt`);--> statement-breakpoint
CREATE INDEX `website_interaction_user_time_idx` ON `websiteInteractionEvents` (`userId`,`createdAt`);