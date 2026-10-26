-- Draft-only migration. Do not apply to production until reviewed and explicitly approved.
CREATE TABLE IF NOT EXISTS public.search_console_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connected_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'google_search_console' CHECK (provider = 'google_search_console'),
  refresh_token_ciphertext text NOT NULL,
  refresh_token_iv text NOT NULL,
  scopes text[] NOT NULL DEFAULT ARRAY[]::text[],
  property_url text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (connected_by, provider)
);

ALTER TABLE public.search_console_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_console_connections FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage own Search Console connection" ON public.search_console_connections;
CREATE POLICY "Admins manage own Search Console connection"
  ON public.search_console_connections
  FOR ALL
  TO authenticated
  USING (
    connected_by = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
    )
  )
  WITH CHECK (
    connected_by = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
    )
  );

REVOKE ALL ON TABLE public.search_console_connections FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.search_console_connections TO authenticated;
