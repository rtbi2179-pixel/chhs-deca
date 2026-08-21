CREATE TABLE `eventTimelineCalendarEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`schoolCode` varchar(50) NOT NULL,
	`competitionYear` varchar(20) NOT NULL,
	`title` varchar(255) NOT NULL,
	`eventType` enum('meeting','mock_competition','testing','written_deadline','pitchdeck_deadline','district_conference','state_conference','campaign_deadline','leadership_conference','other') NOT NULL,
	`startDate` varchar(10),
	`endDate` varchar(10),
	`isTbd` boolean NOT NULL DEFAULT false,
	`description` text,
	`priority` enum('low','normal','high','critical') NOT NULL DEFAULT 'normal',
	`color` varchar(30) NOT NULL DEFAULT 'blue',
	`applicableEventTypes` json,
	`hardDeadline` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `eventTimelineCalendarEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `timelineItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`timelineId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`itemType` enum('pi_learning','practice_questions','practice_exam','roleplay','written_project','pitch_deck','presentation','review','mock_competition','testing','conference','meeting','deadline','general') NOT NULL,
	`dueDate` varchar(10),
	`priority` enum('low','normal','high','critical') NOT NULL DEFAULT 'normal',
	`status` enum('upcoming','current','completed','overdue','skipped','rescheduled') NOT NULL DEFAULT 'upcoming',
	`estimatedMinutes` int NOT NULL DEFAULT 30,
	`deepLink` varchar(500),
	`hardDeadline` boolean NOT NULL DEFAULT false,
	`generatedReason` text NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `timelineItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userEventTimelines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`schoolCode` varchar(50) NOT NULL,
	`eventCode` varchar(20) NOT NULL,
	`competitionYear` varchar(20) NOT NULL,
	`startDate` varchar(10) NOT NULL,
	`targetDate` varchar(10) NOT NULL,
	`timelineMode` enum('gradual','accelerated','emergency') NOT NULL,
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`readinessScore` int NOT NULL DEFAULT 0,
	`currentPhase` varchar(100) NOT NULL,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userEventTimelines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `timelineItems` ADD CONSTRAINT `timelineItems_timelineId_userEventTimelines_id_fk` FOREIGN KEY (`timelineId`) REFERENCES `userEventTimelines`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userEventTimelines` ADD CONSTRAINT `userEventTimelines_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `timeline_calendar_school_year_idx` ON `eventTimelineCalendarEvents` (`schoolCode`,`competitionYear`);--> statement-breakpoint
CREATE INDEX `timeline_calendar_school_date_idx` ON `eventTimelineCalendarEvents` (`schoolCode`,`startDate`);--> statement-breakpoint
CREATE INDEX `timeline_items_due_idx` ON `timelineItems` (`timelineId`,`dueDate`);--> statement-breakpoint
CREATE INDEX `timeline_items_status_idx` ON `timelineItems` (`timelineId`,`status`);--> statement-breakpoint
CREATE INDEX `timeline_user_event_status_idx` ON `userEventTimelines` (`userId`,`eventCode`,`status`);--> statement-breakpoint
CREATE INDEX `timeline_school_idx` ON `userEventTimelines` (`schoolCode`);