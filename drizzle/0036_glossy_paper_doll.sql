ALTER TABLE `blueBucksTransactions` MODIFY COLUMN `reason` enum('correct_first_attempt','corrected_answer','discussion_post','discussion_reply','news_read','admin_award','bank_deposit') NOT NULL;--> statement-breakpoint
ALTER TABLE `blueBucksTransactions` ADD `sourceKey` varchar(191);--> statement-breakpoint
ALTER TABLE `blueBucksTransactions` ADD CONSTRAINT `blue_bucks_transaction_user_source_unique` UNIQUE(`userId`,`sourceKey`);--> statement-breakpoint
CREATE INDEX `blue_bucks_transaction_user_reason_related_idx` ON `blueBucksTransactions` (`userId`,`reason`,`relatedId`);