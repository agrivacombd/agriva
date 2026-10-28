-- Require explicit approval before an opportunity can become a saved content draft.
-- The generated-content RPC keeps the insert and opportunity transition atomic.
CREATE UNIQUE INDEX IF NOT EXISTS content_drafts_published_article_slug_uidx
  ON public.content_drafts (slug)
  WHERE status = 'published' AND content_type = 'article';

-- RLS limits anonymous reads to published article rows only.
GRANT SELECT ON TABLE public.content_drafts TO anon;

CREATE OR REPLACE FUNCTION public.guard_published_content_article_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.status = 'published'
     AND NEW.content_type = 'article'
     AND NEW.slug = ANY (ARRAY[
       'boro-rice-season-preparation',
       'soil-health-basics',
       'integrated-pest-management',
       'vegetable-garden-water-management'
     ]) THEN
    RAISE EXCEPTION 'This slug is reserved for a built-in AGRIVA article' USING ERRCODE = '23505';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS content_drafts_reserved_blog_slug_guard ON public.content_drafts;
CREATE TRIGGER content_drafts_reserved_blog_slug_guard
BEFORE INSERT OR UPDATE OF slug, status, content_type
ON public.content_drafts
FOR EACH ROW
EXECUTE FUNCTION public.guard_published_content_article_slug();

REVOKE ALL ON FUNCTION public.guard_published_content_article_slug() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_content_draft_from_opportunity(p_opportunity_id uuid)
RETURNS public.content_drafts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  o public.content_opportunities;
  d public.content_drafts;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admin role required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO o
  FROM public.content_opportunities
  WHERE id = p_opportunity_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Opportunity not found' USING ERRCODE = 'P0002';
  END IF;
  IF o.status <> 'approved' THEN
    RAISE EXCEPTION 'Opportunity must be approved before drafting' USING ERRCODE = '55000';
  END IF;
  IF EXISTS (SELECT 1 FROM public.content_drafts WHERE opportunity_id = o.id) THEN
    RAISE EXCEPTION 'A content draft already exists for this opportunity' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.content_drafts (
    opportunity_id, content_type, title, slug, meta_title, meta_description,
    primary_keyword, search_intent, created_by
  ) VALUES (
    o.id,
    CASE WHEN o.opportunity_type = 'both' THEN 'article' ELSE o.opportunity_type END,
    COALESCE(NULLIF(btrim(o.title), ''), o.keyword),
    CASE
      WHEN o.slug ~ '^[a-z0-9]+(-[a-z0-9]+)*    COALESCE(NULLIF(btrim(o.title), ''), o.keyword),
    left('Helpful AGRIVA guide for ' || o.keyword, 320),
    o.keyword,
    o.intent,
    auth.uid()
  )
  RETURNING * INTO d;

  UPDATE public.content_opportunities
  SET status = 'draft'
  WHERE id = o.id AND status = 'approved';

  RETURN d;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_generated_content_draft_from_opportunity(
  p_opportunity_id uuid,
  p_title text,
  p_slug text,
  p_meta_title text,
  p_meta_description text,
  p_secondary_keywords text[],
  p_outline jsonb,
  p_faq jsonb,
  p_internal_link_suggestions jsonb,
  p_competitor_analysis jsonb,
  p_body_markdown text
)
RETURNS public.content_drafts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  o public.content_opportunities;
  d public.content_drafts;
  v_title text := btrim(COALESCE(p_title, ''));
  v_slug text := btrim(COALESCE(p_slug, ''));
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admin role required' USING ERRCODE = '42501';
  END IF;

  IF v_title = '' OR char_length(v_title) > 160
     OR v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' OR char_length(v_slug) > 180
     OR char_length(COALESCE(p_meta_title, '')) > 160
     OR char_length(COALESCE(p_meta_description, '')) > 320
     OR char_length(COALESCE(p_body_markdown, '')) > 100000
     OR cardinality(COALESCE(p_secondary_keywords, ARRAY[]::text[])) > 30
     OR jsonb_typeof(COALESCE(p_outline, '[]'::jsonb)) <> 'array'
     OR jsonb_typeof(COALESCE(p_faq, '[]'::jsonb)) <> 'array'
     OR jsonb_typeof(COALESCE(p_internal_link_suggestions, '[]'::jsonb)) <> 'array'
     OR jsonb_typeof(COALESCE(p_competitor_analysis, '[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'Invalid generated content fields' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO o
  FROM public.content_opportunities
  WHERE id = p_opportunity_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Opportunity not found' USING ERRCODE = 'P0002';
  END IF;
  IF o.status <> 'approved' THEN
    RAISE EXCEPTION 'Opportunity must be approved before drafting' USING ERRCODE = '55000';
  END IF;
  IF EXISTS (SELECT 1 FROM public.content_drafts WHERE opportunity_id = o.id) THEN
    RAISE EXCEPTION 'A content draft already exists for this opportunity' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.content_drafts (
    opportunity_id, content_type, title, slug, meta_title, meta_description,
    primary_keyword, secondary_keywords, search_intent, outline, faq,
    internal_link_suggestions, competitor_analysis, body_markdown, status, created_by
  ) VALUES (
    o.id,
    CASE WHEN o.opportunity_type = 'both' THEN 'article' ELSE o.opportunity_type END,
    v_title,
    v_slug,
    NULLIF(btrim(COALESCE(p_meta_title, '')), ''),
    NULLIF(btrim(COALESCE(p_meta_description, '')), ''),
    o.keyword,
    COALESCE(p_secondary_keywords, ARRAY[]::text[]),
    o.intent,
    COALESCE(p_outline, '[]'::jsonb),
    COALESCE(p_faq, '[]'::jsonb),
    COALESCE(p_internal_link_suggestions, '[]'::jsonb),
    COALESCE(p_competitor_analysis, '[]'::jsonb),
    NULLIF(p_body_markdown, ''),
    'draft',
    auth.uid()
  )
  RETURNING * INTO d;

  UPDATE public.content_opportunities
  SET status = 'draft'
  WHERE id = o.id AND status = 'approved';

  RETURN d;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_content_draft_from_opportunity(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_content_draft_from_opportunity(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.create_generated_content_draft_from_opportunity(uuid, text, text, text, text, text[], jsonb, jsonb, jsonb, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_generated_content_draft_from_opportunity(uuid, text, text, text, text, text[], jsonb, jsonb, jsonb, jsonb, text) TO authenticated;
 AND char_length(o.slug) <= 180 THEN o.slug
      ELSE COALESCE(
        NULLIF(trim(both '-' from left(trim(both '-' from regexp_replace(lower(o.keyword), '[^a-z0-9]+', '-', 'g')), 160)), ''),
        'agri-guide-' || substr(o.id::text, 1, 8)
      )
    END,
    COALESCE(NULLIF(btrim(o.title), ''), o.keyword),
    left('Helpful AGRIVA guide for ' || o.keyword, 320),
    o.keyword,
    o.intent,
    auth.uid()
  )
  RETURNING * INTO d;

  UPDATE public.content_opportunities
  SET status = 'draft'
  WHERE id = o.id AND status = 'approved';

  RETURN d;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_generated_content_draft_from_opportunity(
  p_opportunity_id uuid,
  p_title text,
  p_slug text,
  p_meta_title text,
  p_meta_description text,
  p_secondary_keywords text[],
  p_outline jsonb,
  p_faq jsonb,
  p_internal_link_suggestions jsonb,
  p_competitor_analysis jsonb,
  p_body_markdown text
)
RETURNS public.content_drafts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  o public.content_opportunities;
  d public.content_drafts;
  v_title text := btrim(COALESCE(p_title, ''));
  v_slug text := btrim(COALESCE(p_slug, ''));
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admin role required' USING ERRCODE = '42501';
  END IF;

  IF v_title = '' OR char_length(v_title) > 160
     OR v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' OR char_length(v_slug) > 180
     OR char_length(COALESCE(p_meta_title, '')) > 160
     OR char_length(COALESCE(p_meta_description, '')) > 320
     OR char_length(COALESCE(p_body_markdown, '')) > 100000
     OR cardinality(COALESCE(p_secondary_keywords, ARRAY[]::text[])) > 30
     OR jsonb_typeof(COALESCE(p_outline, '[]'::jsonb)) <> 'array'
     OR jsonb_typeof(COALESCE(p_faq, '[]'::jsonb)) <> 'array'
     OR jsonb_typeof(COALESCE(p_internal_link_suggestions, '[]'::jsonb)) <> 'array'
     OR jsonb_typeof(COALESCE(p_competitor_analysis, '[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'Invalid generated content fields' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO o
  FROM public.content_opportunities
  WHERE id = p_opportunity_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Opportunity not found' USING ERRCODE = 'P0002';
  END IF;
  IF o.status <> 'approved' THEN
    RAISE EXCEPTION 'Opportunity must be approved before drafting' USING ERRCODE = '55000';
  END IF;
  IF EXISTS (SELECT 1 FROM public.content_drafts WHERE opportunity_id = o.id) THEN
    RAISE EXCEPTION 'A content draft already exists for this opportunity' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.content_drafts (
    opportunity_id, content_type, title, slug, meta_title, meta_description,
    primary_keyword, secondary_keywords, search_intent, outline, faq,
    internal_link_suggestions, competitor_analysis, body_markdown, status, created_by
  ) VALUES (
    o.id,
    CASE WHEN o.opportunity_type = 'both' THEN 'article' ELSE o.opportunity_type END,
    v_title,
    v_slug,
    NULLIF(btrim(COALESCE(p_meta_title, '')), ''),
    NULLIF(btrim(COALESCE(p_meta_description, '')), ''),
    o.keyword,
    COALESCE(p_secondary_keywords, ARRAY[]::text[]),
    o.intent,
    COALESCE(p_outline, '[]'::jsonb),
    COALESCE(p_faq, '[]'::jsonb),
    COALESCE(p_internal_link_suggestions, '[]'::jsonb),
    COALESCE(p_competitor_analysis, '[]'::jsonb),
    NULLIF(p_body_markdown, ''),
    'draft',
    auth.uid()
  )
  RETURNING * INTO d;

  UPDATE public.content_opportunities
  SET status = 'draft'
  WHERE id = o.id AND status = 'approved';

  RETURN d;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_content_draft_from_opportunity(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_content_draft_from_opportunity(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.create_generated_content_draft_from_opportunity(uuid, text, text, text, text, text[], jsonb, jsonb, jsonb, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_generated_content_draft_from_opportunity(uuid, text, text, text, text, text[], jsonb, jsonb, jsonb, jsonb, text) TO authenticated;
