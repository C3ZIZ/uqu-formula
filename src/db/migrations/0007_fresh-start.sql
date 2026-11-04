-- Clears all test data before the event, at the owner's request. The seed then creates the first admin again.
TRUNCATE "users", "password_resets", "check_ins", "zones", "agenda_items", "coin_codes", "coin_claims", "attendance_codes", "badges", "badge_images", "badge_claims" CASCADE;
