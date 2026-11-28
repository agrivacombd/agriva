-- Add transactional audit coverage to Green Exchange moderation.
-- Repository-only migration for the Admin P0 review; do not apply to production
-- until the isolated database migration suite and rollout are approved.

CREATE OR REPLACE FUNCTION public.admin_moderate_green_exchange_listing(
  p_listing_id uuid,
  p_moderation_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_listing public.green_exchange_listings;
  v_previous_status text;
BEGIN
  IF v_actor IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = v_actor
      AND p.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  IF p_listing_id IS NULL
     OR p_moderation_status IS NULL
     OR p_moderation_status NOT IN ('approved', 'rejected', 'pending') THEN
    RAISE EXCEPTION 'invalid moderation input' USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_listing
  FROM public.green_exchange_listings
  WHERE id = p_listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'listing not found' USING ERRCODE = 'P0002';
  END IF;

  v_previous_status := v_listing.moderation_status;

  UPDATE public.green_exchange_listings
  SET moderation_status = p_moderation_status
  WHERE id = p_listing_id;

  INSERT INTO public.admin_audit_log (
    admin_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  VALUES (
    v_actor,
    'green_exchange.listing_moderated',
    'green_exchange_listing',
    p_listing_id,
    jsonb_build_object(
      'previous_moderation_status', v_previous_status,
      'new_moderation_status', p_moderation_status
    )
  );
END;
$function$;
