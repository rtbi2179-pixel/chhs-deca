ALTER TABLE `timelineItems` ADD `weekStartDate` varchar(10);--> statement-breakpoint
ALTER TABLE `timelineItems` ADD `weekTitle` varchar(120);--> statement-breakpoint
ALTER TABLE `userEventTimelines` ADD `trainingIntensity` enum('essential','competitive','all_in') DEFAULT 'competitive' NOT NULL;