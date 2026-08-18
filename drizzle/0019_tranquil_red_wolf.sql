CREATE TABLE `savingsInterestSchedule` (
	`id` int NOT NULL,
	`taskUid` varchar(65),
	`lastRunAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `savingsInterestSchedule_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `economicConfig` MODIFY COLUMN `savingsInterestRate` decimal(5,2) NOT NULL DEFAULT '7.0';--> statement-breakpoint
CREATE INDEX `savings_interest_schedule_task_uid_idx` ON `savingsInterestSchedule` (`taskUid`);