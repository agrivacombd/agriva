-- Forward-only repair for live attribution RPC exposure found during Production schema reconciliation.
-- This migration is intentionally NOT applied to Production until the full migration history is reconciled.
-- Public referral creation needs only success/failure; never return the inserted attribution row.
DROP FUNCTION IF EXISTS public.record_attribution_session(text, text, uuid, integer);

CREATE FUNCTION public.record_attribution_session(
  p_code text,
  p_visitor_token text,
  p_product_id uuid,
  p_days integer DEFAULT 15
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  r public.reseller_links;
BEGIN
  IF p_days IS NULL OR p_days < 1 OR p_days > 30 THEN
    RAISE EXCEPTION 'Invalid attribution window' USING ERRCODE = '22023';
  END IF;
  IF p_product_id IS NULL OR p_code IS NULL
     OR length(btrim(p_code)) = 0 OR length(p_code) > 64 THEN
    RAISE EXCEPTION 'Invalid referral link input' USING ERRCODE = '22023';
  END IF;
  IF p_visitor_token IS NULL
     OR length(p_visitor_token) < 16 OR length(p_visitor_token) > 128
     OR p_visitor_token !~ '[^[:space:]]' THEN
    RAISE EXCEPTION 'Invalid visitor token' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO r
  FROM public.reseller_links
  WHERE code = p_code AND product_id = p_product_id AND expires_at > now();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Referral link is invalid or expired' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.attribution_sessions(reseller_id, product_id, code, visitor_token, expires_at)
  VALUES (r.reseller_id, r.product_id, r.code, p_visitor_token,
    least(r.expires_at, now() + make_interval(days => p_days)))
  ON CONFLICT (code, visitor_token, product_id)
  DO UPDATE SET expires_at = greatest(public.attribution_sessions.expires_at, excluded.expires_at);
END;
$$;

REVOKE ALL ON FUNCTION public.record_attribution_session(text, text, uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_attribution_session(text, text, uuid, integer) TO anon, authenticated;

-- The private implementation is not a public API; the public wrapper above runs as its owner.
REVOKE ALL ON FUNCTION private.record_attribution_session(text, text, uuid, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.record_attribution_session(text, text, uuid, integer) TO service_role;

-- Checkout attribution resolution is authenticated-only. The public wrapper returns a reseller ID.
REVOKE ALL ON FUNCTION public.resolve_reseller_attribution(text, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_reseller_attribution(text, text, uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION private.resolve_reseller_attribution(text, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.resolve_reseller_attribution(text, text, uuid) TO authenticated, service_role;
