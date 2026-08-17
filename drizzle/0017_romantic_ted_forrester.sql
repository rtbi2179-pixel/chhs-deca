CREATE TABLE `creditScoreUpdateSchedule` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskUid` varchar(65) NOT NULL,
	`lastRunAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `creditScoreUpdateSchedule_id` PRIMARY KEY(`id`),
	CONSTRAINT `credit_score_schedule_task_uid_unique` UNIQUE(`taskUid`)
);
