-- Keep marketplace checkout usable with Cash on Delivery while online payment integration is deferred.
-- Online payment stays disabled until a provider is explicitly integrated and verified.
DO $migration$
BEGIN
  IF to_regclass('public.site_settings') IS NULL THEN
    RAISE EXCEPTION 'public.site_settings must exist before enabling COD checkout';
  END IF;

  INSERT INTO public.site_settings (key, value, description, updated_at)
  VALUES
    ('cod_enabled', 'true', 'Cash on delivery checkout toggle', now()),
    ('online_payment_enabled', 'false', 'Online payment remains disabled until a verified provider integration is ready', now())
  ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        updated_at = now();
END;
$migration$;
