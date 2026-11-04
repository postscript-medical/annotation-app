#!/bin/sh
# Generates src/lib/types/db.ts from the LOCAL Supabase stack's public schema, formatted with
# Prettier (the CLI's own output is unformatted).
#
#   sh scripts/gen-db-types.sh          write src/lib/types/db.ts
#   sh scripts/gen-db-types.sh --check  fail if the committed file differs from a fresh copy (CI)
#
# Needs a running local stack with all migrations applied (`npx supabase start` / `db reset`).
set -eu

target=src/lib/types/db.ts
tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT

# No --linked/--project-id: the CLI targets the local stack by default.
npx supabase gen types typescript --schema public 2>/dev/null >"$tmp"
npx prettier --stdin-filepath "$target" <"$tmp" >"$tmp.fmt"
mv "$tmp.fmt" "$tmp"

if [ "${1:-}" = "--check" ]; then
	if ! diff -u "$target" "$tmp"; then
		echo "src/lib/types/db.ts is out of date. Run \`npm run db:types\` and commit the result." >&2
		exit 1
	fi
	echo "Database types are up to date."
else
	mkdir -p "$(dirname "$target")"
	cp "$tmp" "$target"
	echo "Wrote $target"
fi
