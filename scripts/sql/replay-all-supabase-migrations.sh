#!/usr/bin/env bash
set -euo pipefail

: "${PGHOST:=127.0.0.1}"
: "${PGPORT:=54322}"
: "${PGUSER:=postgres}"
: "${PGDATABASE:=postgres}"
: "${PGPASSWORD:=postgres}"
export PGHOST PGPORT PGUSER PGDATABASE PGPASSWORD

mapfile -t migrations < <(
  find supabase/migrations -maxdepth 1 -type f -name '*.sql' -print | LC_ALL=C sort
)

if (( ${#migrations[@]} == 0 )); then
  echo "No Supabase migrations found." >&2
  exit 1
fi

# Two historical files currently share version 20261105180000. Replay every
# file in deterministic lexical filename order instead of collapsing by version.
duplicates="$(
  for file in "${migrations[@]}"; do
    basename "$file" .sql | cut -d_ -f1
  done | sort | uniq -d
)"
if [[ -n "$duplicates" ]]; then
  echo "::warning::Duplicate migration version(s) detected: $(tr '\n' ' ' <<< "$duplicates"). Files will still be applied individually in lexical filename order."
fi

echo "Replaying ${#migrations[@]} AGRIVA migrations against the disposable local Supabase database."
for migration in "${migrations[@]}"; do
  echo "::group::Applying $migration"
  psql -X -v ON_ERROR_STOP=1 -f "$migration"
  echo "::endgroup::"
done

echo "All ${#migrations[@]} AGRIVA migrations applied successfully."
