-- Run after applying 20261027230000_revoke_client_truncate_privileges.sql.
-- Safe regression assertion: checks privileges only; performs no writes.
DO $$
BEGIN
  IF has_table_privilege('anon', 'public.buyer_demands', 'TRUNCATE') THEN
    RAISE EXCEPTION 'anon must not have TRUNCATE on public.buyer_demands';
  END IF;
  IF has_table_privilege('authenticated', 'public.buyer_demands', 'TRUNCATE') THEN
    RAISE EXCEPTION 'authenticated must not have TRUNCATE on public.buyer_demands';
  END IF;
  IF has_table_privilege('anon', 'public.transport_bookings', 'TRUNCATE') THEN
    RAISE EXCEPTION 'anon must not have TRUNCATE on public.transport_bookings';
  END IF;
  IF has_table_privilege('authenticated', 'public.transport_bookings', 'TRUNCATE') THEN
    RAISE EXCEPTION 'authenticated must not have TRUNCATE on public.transport_bookings';
  END IF;
END
$$;
