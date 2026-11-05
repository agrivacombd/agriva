-- Admin-managed SEO landing pages with a reviewed publication lifecycle.
CREATE TABLE IF NOT EXISTS public.seo_landing_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 160),
  meta_title text,
  meta_description text,
  canonical_url text,
  noindex boolean NOT NULL DEFAULT false,
  hero_title text,
  hero_description text,
  body_markdown text NOT NULL DEFAULT '',
  faq jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(faq) = 'array'),
  cta_label text,
  cta_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','approved','published')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS seo_landing_pages_public_idx
  ON public.seo_landing_pages (status, updated_at DESC);
ALTER TABLE public.seo_landing_pages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.seo_landing_pages FROM anon, authenticated;
GRANT SELECT (slug,title,meta_title,meta_description,canonical_url,noindex,hero_title,hero_description,body_markdown,faq,cta_label,cta_url,status,updated_at,published_at)
  ON public.seo_landing_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_landing_pages TO authenticated;
CREATE POLICY seo_landing_pages_public_read ON public.seo_landing_pages
  FOR SELECT TO anon USING (status = 'published');
CREATE POLICY seo_landing_pages_admin_all ON public.seo_landing_pages
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
CREATE OR REPLACE FUNCTION public.set_seo_landing_page_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS seo_landing_pages_updated_at ON public.seo_landing_pages;
CREATE TRIGGER seo_landing_pages_updated_at BEFORE UPDATE ON public.seo_landing_pages
FOR EACH ROW EXECUTE FUNCTION public.set_seo_landing_page_updated_at();
