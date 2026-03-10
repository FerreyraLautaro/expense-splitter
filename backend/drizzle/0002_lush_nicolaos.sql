DROP TABLE `contacts`;--> statement-breakpoint
DROP TABLE `otp_codes`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `divisions` DROP COLUMN `owner_user_id`;--> statement-breakpoint
ALTER TABLE `participants` DROP COLUMN `contact_id`;