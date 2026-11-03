CREATE TABLE "attendance_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"event_date" date NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_codes_token_unique" UNIQUE("token"),
	CONSTRAINT "attendance_codes_event_date_unique" UNIQUE("event_date")
);
