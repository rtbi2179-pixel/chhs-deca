CREATE TABLE `blazerBuddyMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`schoolCode` varchar(50) NOT NULL,
	`speaker` enum('member','buddy') NOT NULL,
	`body` text NOT NULL,
	`notificationKey` varchar(100),
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blazerBuddyMessages_id` PRIMARY KEY(`id`),
	CONSTRAINT `blazer_buddy_user_notification` UNIQUE(`userId`,`notificationKey`)
);
--> statement-breakpoint
ALTER TABLE `blazerBuddyMessages` ADD CONSTRAINT `blazerBuddyMessages_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `blazer_buddy_user_school_created` ON `blazerBuddyMessages` (`userId`,`schoolCode`,`createdAt`);