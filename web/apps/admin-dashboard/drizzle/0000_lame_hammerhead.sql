CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"password" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_scan_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"workspace_id" varchar(20),
	"qr_node_id" varchar(100),
	"location" geometry(point) NOT NULL,
	"image_url" text,
	"validation_status" varchar(50),
	"diagnosis_result" varchar(255),
	"disease_id" varchar(20),
	"probability" integer,
	"scanned_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "geofences" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspace_id" varchar(20),
	"polygon_info" geometry(point) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pests_diseases" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"nama" varchar(255) NOT NULL,
	"nama_ilmiah" varchar(255),
	"jenis" varchar(50),
	"kategori" varchar(100),
	"tingkat_risiko" varchar(50),
	"gejala" text,
	"penanganan" text,
	"foto" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "plant_pest_relations" (
	"id" serial PRIMARY KEY NOT NULL,
	"plant_id" varchar(20),
	"pest_disease_id" varchar(20)
);
--> statement-breakpoint
CREATE TABLE "plants" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"nama_lokal" varchar(255) NOT NULL,
	"nama_ilmiah" varchar(255),
	"kategori" varchar(100),
	"risiko_penyakit" varchar(50),
	"siklus_panen" varchar(100),
	"habitat" varchar(255),
	"deskripsi" text,
	"foto" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "qr_batches" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"workspace_id" varchar(20),
	"zone" varchar(255),
	"node_count" integer NOT NULL,
	"prefix" varchar(50),
	"status" varchar(50) DEFAULT 'Belum Dicetak',
	"created_by" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "qr_nodes" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"batch_id" varchar(50),
	"status" varchar(50) DEFAULT 'Offline',
	"last_scanned_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "sop_pest_relations" (
	"id" serial PRIMARY KEY NOT NULL,
	"sop_id" varchar(20),
	"pest_disease_id" varchar(20)
);
--> statement-breakpoint
CREATE TABLE "sop_plant_relations" (
	"id" serial PRIMARY KEY NOT NULL,
	"sop_id" varchar(20),
	"plant_id" varchar(20)
);
--> statement-breakpoint
CREATE TABLE "sops" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"judul" varchar(255) NOT NULL,
	"kategori" varchar(100),
	"urgensi" varchar(50),
	"langkah" jsonb NOT NULL,
	"pdf_url" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean NOT NULL,
	"image" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"role" text DEFAULT 'pengguna',
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp,
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(50),
	"status" varchar(50) DEFAULT 'Perencanaan',
	"priority" varchar(50),
	"description" text,
	"area_info" varchar(100),
	"image" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_scan_logs" ADD CONSTRAINT "ai_scan_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_scan_logs" ADD CONSTRAINT "ai_scan_logs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_scan_logs" ADD CONSTRAINT "ai_scan_logs_qr_node_id_qr_nodes_id_fk" FOREIGN KEY ("qr_node_id") REFERENCES "public"."qr_nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_scan_logs" ADD CONSTRAINT "ai_scan_logs_disease_id_pests_diseases_id_fk" FOREIGN KEY ("disease_id") REFERENCES "public"."pests_diseases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geofences" ADD CONSTRAINT "geofences_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plant_pest_relations" ADD CONSTRAINT "plant_pest_relations_plant_id_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."plants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plant_pest_relations" ADD CONSTRAINT "plant_pest_relations_pest_disease_id_pests_diseases_id_fk" FOREIGN KEY ("pest_disease_id") REFERENCES "public"."pests_diseases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_batches" ADD CONSTRAINT "qr_batches_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_batches" ADD CONSTRAINT "qr_batches_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_nodes" ADD CONSTRAINT "qr_nodes_batch_id_qr_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."qr_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sop_pest_relations" ADD CONSTRAINT "sop_pest_relations_sop_id_sops_id_fk" FOREIGN KEY ("sop_id") REFERENCES "public"."sops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sop_pest_relations" ADD CONSTRAINT "sop_pest_relations_pest_disease_id_pests_diseases_id_fk" FOREIGN KEY ("pest_disease_id") REFERENCES "public"."pests_diseases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sop_plant_relations" ADD CONSTRAINT "sop_plant_relations_sop_id_sops_id_fk" FOREIGN KEY ("sop_id") REFERENCES "public"."sops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sop_plant_relations" ADD CONSTRAINT "sop_plant_relations_plant_id_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."plants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sops" ADD CONSTRAINT "sops_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;