-- Revalidate every input in the final anon-callable SECURITY DEFINER attribution RPC.
-- Earlier input guards were lost when record_attribution_session was replaced to
-- minimize its return payload; restore strict bounds at the active database boundary.
CREATE OR REPLACE FUNCTION public.record_attribution_session(
  p_code text,
  p_visitor_token text,
  p_product_id uuid,
  p_days integer DEFAULT 15
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $function$
DECLARE
  r public.reseller_links;
BEGIN
  IF p_days IS NULL OR p_days < 1 OR p_days > 30 THEN
    RAISE EXCEPTION 'Invalid attribution window' USING ERRCODE = '22023';
  END IF;

  IF p_product_id IS NULL
     OR p_code IS NULL
     OR length(btrim(p_code)) = 0
     OR length(p_code) > 64 THEN
    RAISE EXCEPTION 'Invalid referral link input' USING ERRCODE = '22023';
  END IF;

  IF p_visitor_token IS NULL
     OR length(p_visitor_token) < 16
     OR length(p_visitor_token) > 128
     OR p_visitor_token !~ '[^[:space:]]' THEN
    RAISE EXCEPTION 'Invalid visitor token' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO r
  FROM public.reseller_links
  WHERE code = p_code
    AND product_id = p_product_id
    AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Referral link is invalid or expired' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.attribution_sessions(
    reseller_id, product_id, code, visitor_token, expires_at
  )
  VALUES (
    r.reseller_id,
    r.product_id,
    r.code,
    p_visitor_token,
    least(r.expires_at, now() + make_interval(days => p_days))
  )
  ON CONFLICT (code, visitor_token, product_id)
  DO UPDATE SET expires_at = greatest(
    public.attribution_sessions.expires_at,
    excluded.expires_at
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.record_attribution_session(text, text, uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_attribution_session(text, text, uuid, integer) TO anon, authenticated;
