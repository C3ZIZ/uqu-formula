-- Replaces every stored code with the readable UQU format. The alphabet matches CODE_ALPHABET in the app.
CREATE FUNCTION pg_temp.readable_code(word text) RETURNS text LANGUAGE plpgsql VOLATILE AS $$
DECLARE
  alphabet constant text := '23456789ABCDEFGHJKMNPQRSTVWXYZ';
  bytes bytea := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
  tail text := '';
BEGIN
  FOR position IN 0..5 LOOP
    tail := tail || substr(alphabet, 1 + get_byte(bytes, position) % length(alphabet), 1);
  END LOOP;
  RETURN 'UQU-' || word || '-' || tail;
END;
$$;--> statement-breakpoint
UPDATE "users" SET "badge_code" = pg_temp.readable_code('RACER');--> statement-breakpoint
UPDATE "coin_codes" SET "token" = pg_temp.readable_code('PIT');--> statement-breakpoint
UPDATE "attendance_codes" SET "token" = pg_temp.readable_code('GRID');
