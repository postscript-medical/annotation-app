#!/bin/sh
# Fails if code removed from the migration's scope creeps back in: the staff/admin role and
# everything under /admin (docs/migration-execution-plan.md, scope change 2).
# Scans src/ and every migration after the baseline.
set -eu

cd "$(dirname "$0")/.."

baseline='supabase/migrations/20261102172256_remote_schema.sql'
migrations=$(find supabase/migrations -name '*.sql' ! -path "$baseline" 2>/dev/null || true)

status=0

if [ -d 'src/routes/(admin)' ] || [ -d 'src/routes/admin' ]; then
	echo 'Removed scope: an admin route group exists under src/routes.'
	status=1
fi

# shellcheck disable=SC2086 # word splitting of $migrations is intended
if grep -rnIE '\bdm\b|requireStaff|platform_role|admin_audit|routes/\(admin\)|["'"'"'`]/admin\b' src $migrations; then
	echo 'Removed scope: the lines above mention the staff/admin role or /admin routes.'
	status=1
fi

if [ "$status" -eq 0 ]; then
	echo 'Removed-scope check passed.'
fi
exit "$status"
