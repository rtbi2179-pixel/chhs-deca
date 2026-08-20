CREATE TABLE `passwordResetRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`schoolCode` varchar(50) NOT NULL,
	`status` enum('pending','approved','completed','expired','cancelled') NOT NULL DEFAULT 'pending',
	`approvedByUserId` int,
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`approvedAt` timestamp,
	`resetTokenHash` varchar(64),
	`resetExpiresAt` timestamp,
	`completedAt` timestamp,
	CONSTRAINT `passwordResetRequests_id` PRIMARY KEY(`id`),
	CONSTRAINT `passwordResetRequests_resetTokenHash_unique` UNIQUE(`resetTokenHash`)
);
--> statement-breakpoint
ALTER TABLE `passwordResetRequests` ADD CONSTRAINT `passwordResetRequests_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `passwordResetRequests` ADD CONSTRAINT `passwordResetRequests_approvedByUserId_users_id_fk` FOREIGN KEY (`approvedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `password_reset_request_school_status_requested_idx` ON `passwordResetRequests` (`schoolCode`,`status`,`requestedAt`);--> statement-breakpoint
CREATE INDEX `password_reset_request_user_status_requested_idx` ON `passwordResetRequests` (`userId`,`status`,`requestedAt`);