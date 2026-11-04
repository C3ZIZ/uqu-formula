CREATE TYPE "public"."badge_kind" AS ENUM('challenge', 'all_days');--> statement-breakpoint
CREATE TABLE "badge_claims" (
	"user_id" uuid NOT NULL,
	"badge_id" uuid NOT NULL,
	"claimed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "badge_claims_user_id_badge_id_pk" PRIMARY KEY("user_id","badge_id")
);
--> statement-breakpoint
CREATE TABLE "badge_images" (
	"badge_id" uuid PRIMARY KEY NOT NULL,
	"data" "bytea" NOT NULL,
	"content_type" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "badge_kind" NOT NULL,
	"token" text,
	"name_ar" text NOT NULL,
	"name_en" text NOT NULL,
	"challenge_ar" text DEFAULT '' NOT NULL,
	"challenge_en" text DEFAULT '' NOT NULL,
	"icon" text NOT NULL,
	"image_updated_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "badges_token_unique" UNIQUE("token"),
	CONSTRAINT "badges_token_matches_kind" CHECK (("badges"."kind" = 'challenge') = ("badges"."token" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "badge_claims" ADD CONSTRAINT "badge_claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "badge_claims" ADD CONSTRAINT "badge_claims_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "badge_images" ADD CONSTRAINT "badge_images_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "badges_one_all_days" ON "badges" USING btree ("kind") WHERE "badges"."kind" = 'all_days';