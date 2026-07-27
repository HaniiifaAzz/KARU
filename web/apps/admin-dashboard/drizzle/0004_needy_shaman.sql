ALTER TABLE "ai_scan_logs" ADD COLUMN "ai_category" varchar(50);--> statement-breakpoint
ALTER TABLE "ai_scan_logs" ADD COLUMN "ai_recommendation" text;--> statement-breakpoint
ALTER TABLE "ai_scan_logs" ADD COLUMN "ai_description" text;