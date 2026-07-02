CREATE TABLE `elearning_questions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`question` text NOT NULL,
	`options` text NOT NULL,
	`correct_answer` integer NOT NULL,
	`created_at` text,
	FOREIGN KEY (`session_id`) REFERENCES `elearning_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `elearning_quiz_submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`student_id` integer NOT NULL,
	`grade` integer NOT NULL,
	`created_at` text,
	FOREIGN KEY (`session_id`) REFERENCES `elearning_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `elearning_section_completions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`student_id` integer NOT NULL,
	`setup_id` integer NOT NULL,
	`section_key` text NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`setup_id`) REFERENCES `elearning_setups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `elearning_section_completions_student_id_setup_id_section_key_unique` ON `elearning_section_completions` (`student_id`,`setup_id`,`section_key`);--> statement-breakpoint
CREATE TABLE `elearning_session_angkets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`student_id` integer NOT NULL,
	`evaluation_id` integer NOT NULL,
	`score` integer NOT NULL,
	`created_at` text,
	FOREIGN KEY (`session_id`) REFERENCES `elearning_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`evaluation_id`) REFERENCES `elearning_evaluations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `elearning_session_angkets_session_id_student_id_evaluation_id_unique` ON `elearning_session_angkets` (`session_id`,`student_id`,`evaluation_id`);--> statement-breakpoint
CREATE TABLE `tutor_attendances` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tutor_id` integer NOT NULL,
	`date` text NOT NULL,
	`created_at` text,
	FOREIGN KEY (`tutor_id`) REFERENCES `tutors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tutor_attendances_tutor_id_date_unique` ON `tutor_attendances` (`tutor_id`,`date`);--> statement-breakpoint
ALTER TABLE `elearning_setups` ADD `semester` text DEFAULT 'Ganjil' NOT NULL;