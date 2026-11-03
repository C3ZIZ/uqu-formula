-- Removes everything the load test added.
DELETE FROM users WHERE email LIKE '%@loadtest.invalid';
DELETE FROM coin_codes WHERE token LIKE 'LOADCODE%';
