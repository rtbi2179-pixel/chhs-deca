CREATE TABLE `questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cluster` varchar(255) NOT NULL,
	`instructional_area` varchar(255) NOT NULL,
	`question_text` text NOT NULL,
	`option_a` text NOT NULL,
	`option_b` text NOT NULL,
	`option_c` text NOT NULL,
	`option_d` text NOT NULL,
	`correct_answer` varchar(1) NOT NULL,
	`explanation` text,
	`difficulty` varchar(50) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `questions_id` PRIMARY KEY(`id`)
);
