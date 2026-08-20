CREATE TABLE `achievementUnlocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`achievementId` varchar(50) NOT NULL,
	`tier` enum('bronze','silver','gold') NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `achievementUnlocks_id` PRIMARY KEY(`id`),
	CONSTRAINT `achievement_unlock_user_tier` UNIQUE(`userId`,`achievementId`,`tier`)
);
--> statement-breakpoint
ALTER TABLE `achievementUnlocks` ADD CONSTRAINT `achievementUnlocks_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `achievement_unlock_user_time_idx` ON `achievementUnlocks` (`userId`,`unlockedAt`);