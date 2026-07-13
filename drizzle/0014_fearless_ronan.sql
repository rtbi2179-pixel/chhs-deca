CREATE TABLE `adminMemberNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`schoolCode` varchar(50) NOT NULL,
	`memberId` int NOT NULL,
	`adminId` int NOT NULL,
	`note` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `adminMemberNotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `directMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` int NOT NULL,
	`recipientId` int NOT NULL,
	`schoolCode` varchar(50) NOT NULL,
	`body` text NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `directMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolioItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`schoolCode` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`category` varchar(100) NOT NULL,
	`description` text,
	`fileUrl` varchar(1024),
	`externalUrl` varchar(1024),
	`status` enum('not_started','in_progress','ready_for_review','needs_revision','completed') NOT NULL DEFAULT 'not_started',
	`memberProgressNotes` text,
	`adminFeedback` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolioItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `adminMemberNotes` ADD CONSTRAINT `adminMemberNotes_memberId_users_id_fk` FOREIGN KEY (`memberId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `adminMemberNotes` ADD CONSTRAINT `adminMemberNotes_adminId_users_id_fk` FOREIGN KEY (`adminId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `directMessages` ADD CONSTRAINT `directMessages_senderId_users_id_fk` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `directMessages` ADD CONSTRAINT `directMessages_recipientId_users_id_fk` FOREIGN KEY (`recipientId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioItems` ADD CONSTRAINT `portfolioItems_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;