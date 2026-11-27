import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";

const sql = await readFile(new URL("../supabase/migrations/20261128030000_buyer_demand_to_bulk_rfq_transaction.sql", import.meta.url), "utf8");
const compact = sql.replace(/\s+/g, " ").toLowerCase();

assert.match(compact, /create table if not exists public\.buyer_demand_rfq_conversions/);
assert.match(compact, /demand_id uuid not null unique references public\.buyer_demands\(id\) on delete restrict/);
assert.match(compact, /request_id uuid not null unique references public\.bulk_requests\(id\) on delete restrict/);
assert.match(compact, /alter table public\.buyer_demand_rfq_conversions enable row level security/);
assert.match(compact, /revoke all on table public\.buyer_demand_rfq_conversions from public, anon, authenticated/);
assert.match(compact, /security definer set search_path = pg_catalog, public, auth, pg_temp/);
assert.match(compact, /where d\.id = p_demand_id for update/);
assert.match(compact, /v_demand\.buyer_id is distinct from v_buyer_id/);
assert.match(compact, /select c\.request_id into v_existing_request_id/);
assert.match(compact, /v_demand\.status <> 'active'/);
assert.match(compact, /v_demand\.response_deadline < current_date/);
assert.match(compact, /p_buyer_type not in \('individual', 'business'\)/);
assert.match(compact, /p_visibility not in \('public', 'private'\)/);
assert.match(compact, /p_quote_deadline > now\(\) \+ interval '90 days'/);
assert.match(compact, /case when v_demand\.need_mode = 'specific_date' then v_demand\.need_date else null end/);
assert.match(compact, /'pending_review'/);
assert.match(compact, /revoke all on function public\.convert_buyer_demand_to_bulk_rfq[\s\S]*?from public, anon/);
assert.match(compact, /grant execute on function public\.convert_buyer_demand_to_bulk_rfq[\s\S]*?to authenticated/);
assert.match(compact, /before update or delete on public\.buyer_demand_rfq_conversions/);

for (const forbidden of ["contact_phone", "contact_phone_public", "target_price", "notes", "buyer_demand_responses", "bulk_quotes", "bulk_invitations"]) {
  assert.equal(compact.includes(forbidden), false, forbidden + " must not be read/copied/created by conversion");
}
console.log("Buyer demand → RFQ transaction migration contract passed.");
