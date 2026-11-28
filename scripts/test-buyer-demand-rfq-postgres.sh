#!/usr/bin/env bash
set -euo pipefail

: "${PGHOST:?PGHOST is required}"
: "${PGPORT:=5432}"
: "${PGUSER:=postgres}"
: "${PGDATABASE:=postgres}"
: "${PGPASSWORD:?PGPASSWORD is required}"
export PGPORT PGUSER PGDATABASE PGPASSWORD

psql -v ON_ERROR_STOP=1 -f scripts/test-buyer-demand-rfq-postgres-setup.sql
psql -v ON_ERROR_STOP=1 -f supabase/migrations/20261128030000_buyer_demand_to_bulk_rfq_transaction.sql
psql -v ON_ERROR_STOP=1 -f supabase/migrations/20261128040000_restrict_buyer_demand_phone_column_after_app_rollout.sql
psql -v ON_ERROR_STOP=1 -f scripts/test-buyer-demand-rfq-postgres.sql
