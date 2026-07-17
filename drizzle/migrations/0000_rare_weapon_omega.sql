CREATE TABLE `adminMemberNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`schoolCode` varchar(50) NOT NULL,
	`memberId` int NOT NULL,
	`adminId` int NOT NULL,
	`note` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `adminMemberNotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `announcementComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`announcementId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `announcementComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `announcementLikes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`announcementId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `announcementLikes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`schoolCode` varchar(255) NOT NULL,
	`authorId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`content` text NOT NULL,
	`imageUrl` varchar(1024),
	`fileUrl` varchar(1024),
	`fileName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `announcements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `banks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`focus` varchar(100) NOT NULL,
	`description` text,
	`schoolCode` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `banks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blueBucks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blueBucks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blueBucksTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`reason` enum('correct_first_attempt','discussion_post','discussion_reply','admin_award') NOT NULL,
	`relatedId` int,
	`schoolCode` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blueBucksTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bookmarks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`questionId` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bookmarks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calendarEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`date` varchar(10) NOT NULL,
	`time` varchar(5),
	`location` varchar(255),
	`link` varchar(500),
	`type` enum('district','state','icdc','chapter','deadline') NOT NULL,
	`schoolCode` varchar(50) NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calendarEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cosmetics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`type` enum('profile_frame','banner','avatar_effect','title') NOT NULL,
	`rarity` enum('common','rare','epic','legendary') NOT NULL,
	`cost` int NOT NULL,
	`imageUrl` text,
	`schoolCode` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cosmetics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creditCardPayments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userCreditCardId` int NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`status` enum('pending','completed','missed','late') NOT NULL,
	`dueDate` timestamp NOT NULL,
	`paidDate` timestamp,
	`daysLate` int DEFAULT 0,
	`schoolCode` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `creditCardPayments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creditCards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bankId` int NOT NULL,
	`tier` enum('starter','rewards','elite') NOT NULL,
	`name` varchar(100) NOT NULL,
	`creditScoreRequired` int NOT NULL,
	`rewardsPercentage` decimal(5,2) NOT NULL,
	`interestRate` decimal(5,2) NOT NULL,
	`annualFee` decimal(10,2) DEFAULT '0',
	`benefits` text,
	`schoolCode` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `creditCards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creditHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`previousScore` int NOT NULL,
	`newScore` int NOT NULL,
	`scoreChange` int NOT NULL,
	`factors` text,
	`reason` varchar(255),
	`schoolCode` varchar(50) NOT NULL,
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `creditHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creditScores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`score` int NOT NULL DEFAULT 500,
	`lastCalculatedDate` timestamp NOT NULL DEFAULT (now()),
	`paymentReliabilityScore` decimal(5,2) DEFAULT '0',
	`accountHistoryScore` decimal(5,2) DEFAULT '0',
	`practiceConsistencyScore` decimal(5,2) DEFAULT '0',
	`netWorthScore` decimal(5,2) DEFAULT '0',
	`spendingBehaviorScore` decimal(5,2) DEFAULT '0',
	`schoolCode` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `creditScores_id` PRIMARY KEY(`id`),
	CONSTRAINT `creditScores_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `dailyPracticeStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`practiceDate` date NOT NULL,
	`questionsCompleted` int NOT NULL DEFAULT 0,
	`correctAnswers` int NOT NULL DEFAULT 0,
	`totalAnswered` int NOT NULL DEFAULT 0,
	`accuracy` decimal(5,2) NOT NULL DEFAULT '0',
	`blueBucksEarned` int NOT NULL DEFAULT 0,
	`streakQualified` boolean NOT NULL DEFAULT false,
	`schoolCode` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dailyPracticeStats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `directMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` int NOT NULL,
	`recipientId` int NOT NULL,
	`schoolCode` varchar(50) NOT NULL,
	`body` text NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `directMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `discussionReplies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`threadId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`likes` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `discussionReplies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `discussionThreads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`category` varchar(50) NOT NULL DEFAULT 'general',
	`discussionType` enum('universal','chapter') NOT NULL DEFAULT 'universal',
	`schoolCode` varchar(50),
	`views` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `discussionThreads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `economicAuditLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`superAdminId` int NOT NULL,
	`schoolCode` varchar(50) NOT NULL,
	`changeType` varchar(100) NOT NULL,
	`fieldChanged` varchar(100) NOT NULL,
	`oldValue` text,
	`newValue` text,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `economicAuditLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `economicChangesLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`changeType` varchar(100) NOT NULL,
	`oldValue` text,
	`newValue` text,
	`reason` text,
	`schoolCode` varchar(50) NOT NULL,
	`changedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `economicChangesLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `economicConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`schoolCode` varchar(50) NOT NULL,
	`paymentReliabilityWeight` decimal(5,2) NOT NULL DEFAULT '25',
	`accountHistoryWeight` decimal(5,2) NOT NULL DEFAULT '25',
	`practiceConsistencyWeight` decimal(5,2) NOT NULL DEFAULT '20',
	`netWorthWeight` decimal(5,2) NOT NULL DEFAULT '20',
	`spendingBehaviorWeight` decimal(5,2) NOT NULL DEFAULT '10',
	`onTimePaymentPoints` int NOT NULL DEFAULT 2,
	`missedPaymentPenalty` int NOT NULL DEFAULT 15,
	`savingsInterestRate` decimal(5,2) NOT NULL DEFAULT '0.5',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `economicConfig_id` PRIMARY KEY(`id`),
	CONSTRAINT `economicConfig_schoolCode_unique` UNIQUE(`schoolCode`)
);
--> statement-breakpoint
CREATE TABLE `economicSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`schoolCode` varchar(50) NOT NULL,
	`easyQuestionReward` int NOT NULL DEFAULT 5,
	`mediumQuestionReward` int NOT NULL DEFAULT 10,
	`hardQuestionReward` int NOT NULL DEFAULT 15,
	`dailyQuestionLimit` int NOT NULL DEFAULT 100,
	`streakMinQuestionsPerDay` int NOT NULL DEFAULT 10,
	`streakMinAccuracy` decimal(5,2) NOT NULL DEFAULT '70',
	`maxMultiplier` decimal(3,1) NOT NULL DEFAULT '2.0',
	`multiplierIncreaseInterval` int NOT NULL DEFAULT 10,
	`multiplierIncreaseAmount` decimal(3,1) NOT NULL DEFAULT '0.1',
	`newUserStartingBalance` int NOT NULL DEFAULT 1000,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `economicSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `economicSettings_schoolCode_unique` UNIQUE(`schoolCode`)
);
--> statement-breakpoint
CREATE TABLE `emailBlacklist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`reason` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailBlacklist_id` PRIMARY KEY(`id`),
	CONSTRAINT `emailBlacklist_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `financialProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`netWorth` decimal(15,2) NOT NULL DEFAULT '0',
	`totalAssets` decimal(15,2) NOT NULL DEFAULT '0',
	`totalDebt` decimal(15,2) NOT NULL DEFAULT '0',
	`totalRewardsEarned` decimal(15,2) NOT NULL DEFAULT '0',
	`totalPurchases` decimal(15,2) NOT NULL DEFAULT '0',
	`missedPayments` int NOT NULL DEFAULT 0,
	`latePayments` int NOT NULL DEFAULT 0,
	`onTimePayments` int NOT NULL DEFAULT 0,
	`schoolCode` varchar(50) NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `financialProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `financialProfiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `gachaPulls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cosmeticId` int NOT NULL,
	`rarityObtained` enum('common','rare','epic','legendary') NOT NULL,
	`pointsSpent` int NOT NULL,
	`pulledAt` timestamp NOT NULL DEFAULT (now()),
	`schoolCode` varchar(50) NOT NULL,
	CONSTRAINT `gachaPulls_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ipRateLimits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ipAddress` varchar(45) NOT NULL,
	`endpoint` varchar(255) NOT NULL,
	`attemptCount` int NOT NULL DEFAULT 0,
	`lastAttemptAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`blockedUntil` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ipRateLimits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leaderboard` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalQuestionsAnswered` int NOT NULL DEFAULT 0,
	`totalCorrectAnswers` int NOT NULL DEFAULT 0,
	`accuracyPercentage` int NOT NULL DEFAULT 0,
	`marketingScore` int NOT NULL DEFAULT 0,
	`businessManagementScore` int NOT NULL DEFAULT 0,
	`financeScore` int NOT NULL DEFAULT 0,
	`hospitalityScore` int NOT NULL DEFAULT 0,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leaderboard_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketPriceHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stockId` int NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`priceTimestamp` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `marketPriceHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stockId` int NOT NULL,
	`type` enum('buy','sell') NOT NULL,
	`shares` decimal(15,6) NOT NULL,
	`pricePerShare` decimal(10,2) NOT NULL,
	`totalAmount` decimal(15,2) NOT NULL,
	`status` enum('pending','executed','cancelled') NOT NULL DEFAULT 'executed',
	`schoolCode` varchar(50) NOT NULL,
	`executedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `marketTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pendingOrders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stockId` int NOT NULL,
	`type` enum('buy','sell') NOT NULL,
	`blueBucksAmount` decimal(15,2) NOT NULL,
	`shares` decimal(15,6),
	`status` enum('pending','executed','cancelled') NOT NULL DEFAULT 'pending',
	`schoolCode` varchar(50) NOT NULL,
	`executedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pendingOrders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolioCash` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cashBalance` decimal(15,2) NOT NULL DEFAULT '0',
	`initialAllocation` decimal(15,2) NOT NULL DEFAULT '10000',
	`schoolCode` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolioCash_id` PRIMARY KEY(`id`),
	CONSTRAINT `portfolioCash_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `portfolioHoldings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stockId` int NOT NULL,
	`shares` decimal(15,6) NOT NULL,
	`averageBuyPrice` decimal(10,2) NOT NULL,
	`totalInvested` decimal(15,2) NOT NULL,
	`schoolCode` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolioHoldings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolioItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`schoolCode` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`category` varchar(100) NOT NULL,
	`description` text,
	`fileUrl` varchar(1024),
	`externalUrl` varchar(1024),
	`status` enum('not_started','in_progress','ready_for_review','needs_revision','completed') NOT NULL DEFAULT 'not_started',
	`memberProgressNotes` text,
	`adminFeedback` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolioItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolioSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalValue` decimal(15,2) NOT NULL,
	`cashBalance` decimal(15,2) NOT NULL,
	`totalProfit` decimal(15,2) NOT NULL,
	`percentageReturn` decimal(8,2) NOT NULL,
	`schoolCode` varchar(50) NOT NULL,
	`snapshotDate` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portfolioSnapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolioUploads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` text NOT NULL,
	`fileSize` int NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`schoolCode` varchar(50) NOT NULL,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolioUploads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` varchar(50) NOT NULL,
	`cluster` varchar(255) NOT NULL,
	`instructional_area` varchar(255) NOT NULL,
	`performance_indicator_focus` varchar(500),
	`cognitive_level` varchar(100),
	`difficulty` varchar(50) NOT NULL,
	`stem` text NOT NULL,
	`option_a` text NOT NULL,
	`option_b` text NOT NULL,
	`option_c` text NOT NULL,
	`option_d` text NOT NULL,
	`correct_answer` varchar(1) NOT NULL,
	`rationale` text,
	`distractor_rationale_a` text,
	`distractor_rationale_b` text,
	`distractor_rationale_c` text,
	`distractor_rationale_d` text,
	`concept_tag` varchar(255),
	`source_status` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userCreditCardId` int NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`source` varchar(100) NOT NULL,
	`transactionAmount` decimal(15,2) NOT NULL,
	`schoolCode` varchar(50) NOT NULL,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rewards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `schoolCodeAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`attemptCount` int NOT NULL DEFAULT 0,
	`lastAttemptAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `schoolCodeAttempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `schoolCodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`schoolName` varchar(255) NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `schoolCodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `schoolCodes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `sessionQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`questionId` varchar(50) NOT NULL,
	`userAnswer` varchar(1),
	`isCorrect` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sessionQuestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticker` varchar(10) NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`schoolCode` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stocks_id` PRIMARY KEY(`id`),
	CONSTRAINT `stocks_ticker_unique` UNIQUE(`ticker`)
);
--> statement-breakpoint
CREATE TABLE `studySessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`cluster` varchar(255),
	`difficulty` varchar(50),
	`totalQuestions` int NOT NULL,
	`questionsAnswered` int NOT NULL DEFAULT 0,
	`correctAnswers` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `studySessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userAnswers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`questionId` varchar(50) NOT NULL,
	`selectedAnswer` varchar(1) NOT NULL,
	`isCorrect` boolean NOT NULL,
	`schoolCode` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userAnswers_id` PRIMARY KEY(`id`),
	CONSTRAINT `userAnswers_userId_questionId_unique` UNIQUE(`userId`,`questionId`)
);
--> statement-breakpoint
CREATE TABLE `userBankAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`checkingBalance` decimal(15,2) NOT NULL DEFAULT '0',
	`savingsBalance` decimal(15,2) NOT NULL DEFAULT '0',
	`investmentBalance` decimal(15,2) NOT NULL DEFAULT '0',
	`totalDebt` decimal(15,2) NOT NULL DEFAULT '0',
	`accountOpenDate` timestamp NOT NULL DEFAULT (now()),
	`schoolCode` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userBankAccounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `userBankAccounts_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `userCosmetics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cosmeticId` int NOT NULL,
	`acquiredAt` timestamp NOT NULL DEFAULT (now()),
	`isEquipped` boolean NOT NULL DEFAULT false,
	`schoolCode` varchar(50) NOT NULL,
	CONSTRAINT `userCosmetics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userCreditCards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`creditCardId` int NOT NULL,
	`creditLimit` decimal(15,2) NOT NULL,
	`currentBalance` decimal(15,2) NOT NULL DEFAULT '0',
	`availableCredit` decimal(15,2) NOT NULL,
	`utilizationRate` decimal(5,2) NOT NULL DEFAULT '0',
	`approvedDate` timestamp NOT NULL DEFAULT (now()),
	`schoolCode` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userCreditCards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userStreaks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`currentStreak` int NOT NULL DEFAULT 0,
	`longestStreak` int NOT NULL DEFAULT 0,
	`currentMultiplier` decimal(3,1) NOT NULL DEFAULT '1.0',
	`maxMultiplier` decimal(3,1) NOT NULL DEFAULT '2.0',
	`lastPracticeDate` timestamp,
	`streakStartDate` timestamp,
	`schoolCode` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userStreaks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64),
	`username` varchar(255),
	`passwordHash` varchar(255),
	`schoolCode` varchar(50),
	`firstName` varchar(100),
	`lastName` varchar(100),
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64) DEFAULT 'custom',
	`role` enum('user','admin','super_admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	`emailVerified` boolean NOT NULL DEFAULT false,
	`emailVerificationToken` varchar(255),
	`emailVerificationExpiresAt` timestamp,
	`twoFactorEnabled` boolean NOT NULL DEFAULT false,
	`twoFactorCode` varchar(6),
	`twoFactorExpiresAt` timestamp,
	`passwordResetToken` varchar(255),
	`passwordResetExpiresAt` timestamp,
	`adminPromotedAt` timestamp,
	`selectedSchoolCode` varchar(50),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `volunteerOpportunities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`date` timestamp NOT NULL,
	`spotsAvailable` int NOT NULL DEFAULT 10,
	`schoolCode` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `volunteerOpportunities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `volunteerSignups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`opportunityId` int NOT NULL,
	`status` enum('signed_up','confirmed','completed','cancelled') NOT NULL DEFAULT 'signed_up',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `volunteerSignups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `adminMemberNotes` ADD CONSTRAINT `adminMemberNotes_memberId_users_id_fk` FOREIGN KEY (`memberId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `adminMemberNotes` ADD CONSTRAINT `adminMemberNotes_adminId_users_id_fk` FOREIGN KEY (`adminId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `announcementComments` ADD CONSTRAINT `announcementComments_announcementId_announcements_id_fk` FOREIGN KEY (`announcementId`) REFERENCES `announcements`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `announcementComments` ADD CONSTRAINT `announcementComments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `announcementLikes` ADD CONSTRAINT `announcementLikes_announcementId_announcements_id_fk` FOREIGN KEY (`announcementId`) REFERENCES `announcements`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `announcementLikes` ADD CONSTRAINT `announcementLikes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `announcements` ADD CONSTRAINT `announcements_authorId_users_id_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `blueBucks` ADD CONSTRAINT `blueBucks_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `blueBucksTransactions` ADD CONSTRAINT `blueBucksTransactions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calendarEvents` ADD CONSTRAINT `calendarEvents_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `creditCardPayments` ADD CONSTRAINT `creditCardPayments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `creditCardPayments` ADD CONSTRAINT `creditCardPayments_userCreditCardId_userCreditCards_id_fk` FOREIGN KEY (`userCreditCardId`) REFERENCES `userCreditCards`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `creditCards` ADD CONSTRAINT `creditCards_bankId_banks_id_fk` FOREIGN KEY (`bankId`) REFERENCES `banks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `creditHistory` ADD CONSTRAINT `creditHistory_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `creditScores` ADD CONSTRAINT `creditScores_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dailyPracticeStats` ADD CONSTRAINT `dailyPracticeStats_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `directMessages` ADD CONSTRAINT `directMessages_senderId_users_id_fk` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `directMessages` ADD CONSTRAINT `directMessages_recipientId_users_id_fk` FOREIGN KEY (`recipientId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `economicAuditLog` ADD CONSTRAINT `economicAuditLog_superAdminId_users_id_fk` FOREIGN KEY (`superAdminId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `economicChangesLog` ADD CONSTRAINT `economicChangesLog_adminId_users_id_fk` FOREIGN KEY (`adminId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `financialProfiles` ADD CONSTRAINT `financialProfiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `gachaPulls` ADD CONSTRAINT `gachaPulls_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `gachaPulls` ADD CONSTRAINT `gachaPulls_cosmeticId_cosmetics_id_fk` FOREIGN KEY (`cosmeticId`) REFERENCES `cosmetics`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `marketPriceHistory` ADD CONSTRAINT `marketPriceHistory_stockId_stocks_id_fk` FOREIGN KEY (`stockId`) REFERENCES `stocks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `marketTransactions` ADD CONSTRAINT `marketTransactions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `marketTransactions` ADD CONSTRAINT `marketTransactions_stockId_stocks_id_fk` FOREIGN KEY (`stockId`) REFERENCES `stocks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pendingOrders` ADD CONSTRAINT `pendingOrders_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pendingOrders` ADD CONSTRAINT `pendingOrders_stockId_stocks_id_fk` FOREIGN KEY (`stockId`) REFERENCES `stocks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioCash` ADD CONSTRAINT `portfolioCash_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioHoldings` ADD CONSTRAINT `portfolioHoldings_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioHoldings` ADD CONSTRAINT `portfolioHoldings_stockId_stocks_id_fk` FOREIGN KEY (`stockId`) REFERENCES `stocks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioItems` ADD CONSTRAINT `portfolioItems_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioSnapshots` ADD CONSTRAINT `portfolioSnapshots_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioUploads` ADD CONSTRAINT `portfolioUploads_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rewards` ADD CONSTRAINT `rewards_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rewards` ADD CONSTRAINT `rewards_userCreditCardId_userCreditCards_id_fk` FOREIGN KEY (`userCreditCardId`) REFERENCES `userCreditCards`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userAnswers` ADD CONSTRAINT `userAnswers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userBankAccounts` ADD CONSTRAINT `userBankAccounts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userCosmetics` ADD CONSTRAINT `userCosmetics_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userCosmetics` ADD CONSTRAINT `userCosmetics_cosmeticId_cosmetics_id_fk` FOREIGN KEY (`cosmeticId`) REFERENCES `cosmetics`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userCreditCards` ADD CONSTRAINT `userCreditCards_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userCreditCards` ADD CONSTRAINT `userCreditCards_creditCardId_creditCards_id_fk` FOREIGN KEY (`creditCardId`) REFERENCES `creditCards`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userStreaks` ADD CONSTRAINT `userStreaks_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;