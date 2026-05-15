CREATE TABLE "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(50) NOT NULL,
	"action" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"user_id" text,
	"user_role" varchar(100),
	"user_name" varchar(255),
	"ip_address" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"site_name" varchar(255) DEFAULT 'KARU',
	"site_description" text,
	"logo_url" text,
	"favicon_url" text,
	"footer_text" text,
	"contact_email" varchar(255),
	"maintenance_mode" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;