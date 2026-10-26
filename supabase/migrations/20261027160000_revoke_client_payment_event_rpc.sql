-- Forward-only privilege correction for the SECURITY DEFINER payment event RPC.
-- Production migration history is known to drift; reconcile history before applying.
revoke all privileges on function public.record_payment_event(uuid,text,text,numeric,text,text,jsonb) from public;
revoke all privileges on function public.record_payment_event(uuid,text,text,numeric,text,text,jsonb) from anon;
revoke all privileges on function public.record_payment_event(uuid,text,text,numeric,text,text,jsonb) from authenticated;

-- The server webhook invokes this RPC with the service-role key. Do not grant it to client roles.
grant execute on function public.record_payment_event(uuid,text,text,numeric,text,text,jsonb) to service_role;
