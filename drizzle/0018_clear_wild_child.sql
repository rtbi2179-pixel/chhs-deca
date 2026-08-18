CREATE TABLE `userEventQuizResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`traitScores` json NOT NULL,
	`recommendedEventCodes` json NOT NULL,
	`selectedEventCode` varchar(20),
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userEventQuizResults_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_event_quiz_user_unique` UNIQUE(`userId`)
);
