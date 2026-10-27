-- Bound anonymous attribution and search RPC inputs without removing intended public access.
CREATE OR REPLACE FUNCTION public.record_attribution_session(
  p_code text,
  p_visitor_token text,
  p_product_id uuid,
  p_days integer DEFAULT 15
)
RETURNS public.attribution_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  a public.attribution_sessions;
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

  INSERT INTO public.attribution_sessions(reseller_id, product_id, code, visitor_token, expires_at)
  VALUES (r.reseller_id, r.product_id, r.code, p_visitor_token, least(r.expires_at, now() + make_interval(days => p_days)))
  ON CONFLICT (code, visitor_token, product_id)
  DO UPDATE SET expires_at = greatest(public.attribution_sessions.expires_at, excluded.expires_at)
  RETURNING * INTO a;

  RETURN a;
END;
$$;

CREATE OR REPLACE FUNCTION public.track_search(p_query text, p_session_id text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  cleaned text;
  normalized text;
  uid uuid;
BEGIN
  -- Bound raw input before regex normalization to avoid needless work on oversized requests.
  IF p_query IS NULL OR length(p_query) > 1000 THEN
    RETURN;
  END IF;
  IF p_session_id IS NOT NULL
     AND (length(p_session_id) < 1 OR length(p_session_id) > 128 OR length(btrim(p_session_id)) = 0) THEN
    RETURN;
  END IF;

  cleaned := regexp_replace(trim(p_query), '\s+', ' ', 'g');
  IF length(cleaned) < 2 OR length(cleaned) > 200 THEN
    RETURN;
  END IF;

  normalized := lower(cleaned);
  uid := auth.uid();

  INSERT INTO public.search_queries(query, normalized_query, user_id, session_id, search_count, first_seen_at, last_seen_at)
  VALUES (cleaned, normalized, uid, p_session_id, 1, now(), now())
  ON CONFLICT (normalized_query)
  DO UPDATE SET
    query = excluded.query,
    search_count = public.search_queries.search_count + 1,
    last_seen_at = now();
END;
$$;

-- Preserve the intended public caller grants; the functions remain bounded and pinned to a safe search_path.
