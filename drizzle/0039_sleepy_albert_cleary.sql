CREATE TABLE `portfolioNotificationSchedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scheduleCronTaskUid` varchar(65) NOT NULL,
	`lastRunAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolioNotificationSchedules_id` PRIMARY KEY(`id`),
	CONSTRAINT `portfolio_notification_schedule_task_uid_unique` UNIQUE(`scheduleCronTaskUid`)
);
