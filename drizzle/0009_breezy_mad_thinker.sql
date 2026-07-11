CREATE TABLE `announcementComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`announcementId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `announcementComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `announcementLikes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`announcementId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `announcementLikes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`schoolCode` varchar(255) NOT NULL,
	`authorId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`content` text NOT NULL,
	`imageUrl` varchar(1024),
	`fileUrl` varchar(1024),
	`fileName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `announcements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `announcementComments` ADD CONSTRAINT `announcementComments_announcementId_announcements_id_fk` FOREIGN KEY (`announcementId`) REFERENCES `announcements`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `announcementComments` ADD CONSTRAINT `announcementComments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `announcementLikes` ADD CONSTRAINT `announcementLikes_announcementId_announcements_id_fk` FOREIGN KEY (`announcementId`) REFERENCES `announcements`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `announcementLikes` ADD CONSTRAINT `announcementLikes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `announcements` ADD CONSTRAINT `announcements_authorId_users_id_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;