-- Staff accounts become visitors first, so the role type can drop the staff value.
UPDATE "users" SET "role" = 'visitor' WHERE "role" = 'staff';--> statement-breakpoint
ALTER TABLE "check_ins" DROP CONSTRAINT "check_ins_checked_in_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'visitor'::text;--> statement-breakpoint
DROP TYPE "public"."role";--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('visitor', 'admin');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'visitor'::"public"."role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."role" USING "role"::"public"."role";--> statement-breakpoint
ALTER TABLE "check_ins" DROP COLUMN "checked_in_by";