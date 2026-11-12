-- Disposable PostgreSQL 17 fixture: minimum dependencies of the repair migration.
CREATE SCHEMA auth;
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE TYPE public.user_role AS ENUM ('admin','farmer');
CREATE TYPE public.content_draft_status AS ENUM ('draft','review','approved','rejected','published');
CREATE TABLE public.profiles(id uuid PRIMARY KEY, role public.user_role NOT NULL);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
CREATE TABLE public.content_drafts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 content_type text NOT NULL DEFAULT 'article',
 title text NOT NULL,
 slug text,
 body_markdown text,
 meta_title text,
 meta_description text,
 status public.content_draft_status NOT NULL DEFAULT 'draft',
 reviewed_by uuid REFERENCES public.profiles(id),
 reviewed_at timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.profiles(id,role) VALUES ('00000000-0000-4000-8000-000000000001','admin');
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
INSERT INTO public.content_drafts(title,slug,body_markdown) VALUES ('Test article','test-article','Test body');
