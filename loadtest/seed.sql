-- Adds 1000 load-test visitors and 20 coin codes. Run through loadtest/run.sh only.
INSERT INTO users (name, email, phone, password_hash, badge_code)
SELECT 'Load ' || n, 'load' || n || '@loadtest.invalid', '0500000000', :'hash', 'FWLOAD' || n
FROM generate_series(1, 1000) AS n
ON CONFLICT DO NOTHING;

INSERT INTO coin_codes (token, label_ar, label_en, coins)
SELECT 'LOADCODE' || n, 'Load ' || n, 'Load ' || n, 10
FROM generate_series(1, 20) AS n
ON CONFLICT DO NOTHING;
