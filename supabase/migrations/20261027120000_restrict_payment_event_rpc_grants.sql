-- Forward-only hardening for the payment-event SECURITY DEFINER RPC.
-- Do not apply to Production until migration history and the exact target schema
-- have been reconciled under issue #65. This migration changes function grants only.
REVOKE ALL ON FUNCTION public.record_payment_event(uuid, text, text, numeric, text, text, jsonb)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_payment_event(uuid, text, text, numeric, text, text, jsonb)
  FROM anon, authenticated;

-- Keep the RPC available only to trusted server-side service-role callers if needed.
-- Never expose the service-role credential to a browser/client.
GRANT EXECUTE ON FUNCTION public.record_payment_event(uuid, text, text, numeric, text, text, jsonb)
  TO service_role;
