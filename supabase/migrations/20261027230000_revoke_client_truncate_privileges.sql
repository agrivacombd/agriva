-- Revoke table-wide truncation from client-facing roles.
-- RLS policies do not protect tables from TRUNCATE.
REVOKE TRUNCATE ON TABLE public.buyer_demands FROM anon, authenticated;
REVOKE TRUNCATE ON TABLE public.transport_bookings FROM anon, authenticated;
