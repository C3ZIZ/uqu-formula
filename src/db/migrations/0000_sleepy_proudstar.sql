CREATE TYPE "public"."role" AS ENUM('visitor', 'staff', 'admin');--> statement-breakpoint
CREATE TYPE "public"."zone_type" AS ENUM('stage', 'workshop', 'booth', 'competition', 'services', 'entrance');--> statement-breakpoint
CREATE TABLE "agenda_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title_ar" text NOT NULL,
	"title_en" text NOT NULL,
	"details_ar" text DEFAULT '' NOT NULL,
	"details_en" text DEFAULT '' NOT NULL,
	"day" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"zone_id" uuid
);
--> statement-breakpoint
CREATE TABLE "check_ins" (
	"user_id" uuid NOT NULL,
	"event_date" date NOT NULL,
	"checked_in_by" uuid,
	"checked_in_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "check_ins_user_id_event_date_pk" PRIMARY KEY("user_id","event_date")
);
--> statement-breakpoint
CREATE TABLE "coin_claims" (
	"user_id" uuid NOT NULL,
	"code_id" uuid NOT NULL,
	"coins" integer NOT NULL,
	"claimed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coin_claims_user_id_code_id_pk" PRIMARY KEY("user_id","code_id")
);
--> statement-breakpoint
CREATE TABLE "coin_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"label_ar" text NOT NULL,
	"label_en" text NOT NULL,
	"coins" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coin_codes_token_unique" UNIQUE("token"),
	CONSTRAINT "coin_codes_coins_positive" CHECK ("coin_codes"."coins" > 0)
);
--> statement-breakpoint
CREATE TABLE "password_resets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	CONSTRAINT "password_resets_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'visitor' NOT NULL,
	"badge_code" text NOT NULL,
	"failed_logins" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_badge_code_unique" UNIQUE("badge_code")
);
--> statement-breakpoint
CREATE TABLE "zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_ar" text NOT NULL,
	"name_en" text NOT NULL,
	"details_ar" text DEFAULT '' NOT NULL,
	"details_en" text DEFAULT '' NOT NULL,
	"type" "zone_type" NOT NULL,
	"x" real NOT NULL,
	"y" real NOT NULL,
	"width" real NOT NULL,
	"height" real NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_checked_in_by_users_id_fk" FOREIGN KEY ("checked_in_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_claims" ADD CONSTRAINT "coin_claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_claims" ADD CONSTRAINT "coin_claims_code_id_coin_codes_id_fk" FOREIGN KEY ("code_id") REFERENCES "public"."coin_codes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agenda_day_time_idx" ON "agenda_items" USING btree ("day","start_time");--> statement-breakpoint
CREATE INDEX "check_ins_date_idx" ON "check_ins" USING btree ("event_date");