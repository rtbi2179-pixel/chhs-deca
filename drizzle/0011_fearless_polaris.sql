ALTER TABLE `discussionThreads` ADD `discussionType` enum('universal','chapter') DEFAULT 'universal' NOT NULL;--> statement-breakpoint
ALTER TABLE `discussionThreads` ADD `schoolCode` varchar(50);