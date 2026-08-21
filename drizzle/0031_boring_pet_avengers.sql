ALTER TABLE `timelineItems` ADD `completionMetric` varchar(40) DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE `timelineItems` ADD `completionTarget` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `timelineItems` ADD `completionBaseline` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `timelineItems` ADD `successCriteria` text;