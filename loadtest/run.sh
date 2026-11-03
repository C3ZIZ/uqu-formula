#!/bin/sh
# Runs the 1000-user test against the local Docker stack, then removes its test data.
set -e
HASH=$(npx tsx -e 'import("./src/lib/password").then(async (m) => console.log(await m.hashPassword("load-test-password")))')
docker compose exec -T db psql -q -U formula -d formula -v hash="$HASH" -f - < loadtest/seed.sql
mkdir -p loadtest/results
STATUS=0
docker run --rm -i --network container:formula-week-caddy-1 grafana/k6 run --summary-export=/dev/stdout - < loadtest/k6.js > loadtest/results/output.txt 2>&1 || STATUS=$?
docker compose exec -T db psql -q -U formula -d formula -f - < loadtest/cleanup.sql
exit $STATUS
