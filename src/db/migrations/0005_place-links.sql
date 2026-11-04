ALTER TABLE "agenda_items" DROP CONSTRAINT "agenda_items_zone_id_zones_id_fk";
--> statement-breakpoint
ALTER TABLE "attendance_codes" ADD COLUMN "zone_id" uuid;--> statement-breakpoint
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_codes" ADD CONSTRAINT "attendance_codes_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE restrict ON UPDATE no action;