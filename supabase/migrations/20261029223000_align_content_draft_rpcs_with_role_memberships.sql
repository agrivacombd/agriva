-- Keep content-draft RPC authorization aligned with the application capability map.
-- Legacy profile roles remain supported; membership roles can authorize content drafting too.
DO $migration$
DECLARE
  v_signature regprocedure;
  v_definition text;
  v_updated text;
  v_guard text := $guard$IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN$guard$;
  v_replacement text := $replacement$IF auth.uid() IS NULL OR (
    NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role::text = ANY (ARRAY['admin', 'super_admin', 'content_seo_manager', 'marketing_manager', 'educator', 'expert', 'agriculturist', 'agronomist']::text[])
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.user_role_memberships m
      WHERE m.user_id = auth.uid()
        AND m.role = ANY (ARRAY['admin', 'super_admin', 'content_seo_manager', 'marketing_manager', 'educator', 'expert', 'agriculturist', 'agronomist'])
    )
  ) THEN$replacement$;
BEGIN
  FOREACH v_signature IN ARRAY ARRAY[
    'public.create_content_draft_from_opportunity(uuid)'::regprocedure,
    'public.create_generated_content_draft_from_opportunity(uuid,text,text,text,text,text[],jsonb,jsonb,jsonb,jsonb,text)'::regprocedure
  ]
  LOOP
    v_definition := pg_get_functiondef(v_signature);
    v_updated := replace(v_definition, v_guard, v_replacement);

    IF v_updated = v_definition THEN
      RAISE EXCEPTION 'Expected legacy admin guard was not found in %', v_signature;
    END IF;

    EXECUTE v_updated;
  END LOOP;
END;
$migration$;
