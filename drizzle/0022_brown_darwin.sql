ALTER TABLE `economicConfig` MODIFY COLUMN `paymentReliabilityWeight` decimal(5,2) NOT NULL DEFAULT '30';--> statement-breakpoint
ALTER TABLE `economicConfig` MODIFY COLUMN `accountHistoryWeight` decimal(5,2) NOT NULL DEFAULT '20';--> statement-breakpoint
ALTER TABLE `economicConfig` MODIFY COLUMN `practiceConsistencyWeight` decimal(5,2) NOT NULL DEFAULT '25';--> statement-breakpoint
ALTER TABLE `economicConfig` MODIFY COLUMN `netWorthWeight` decimal(5,2) NOT NULL DEFAULT '15';