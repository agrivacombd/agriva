-- Run after fixture, workflow repair, and workflow execution tests.
INSERT INTO public.profiles(id,role) VALUES ('00000000-0000-4000-8000-000000000002','admin');
INSERT INTO public.content_drafts(id,title,slug,body_markdown,status,reviewed_by,reviewer_name,author_name,author_verified_by,hero_image_url,hero_image_width,hero_image_height,hero_image_alt,claim_evidence)
VALUES ('00000000-0000-4000-8000-000000000003','Reviewed article','reviewed-article','Source-backed article','draft',
'00000000-0000-4000-8000-000000000001','AGRIVA editorial reviewer','AGRIVA editorial author','00000000-0000-4000-8000-000000000002',
'https://example.org/reviewed.jpg',1200,630,'Crop field',
'[{"claim":"Claim supported by source","source_url":"https://fao.org/example","verified":true,"verification_note":"Editor inspected source"}]'::jsonb);
UPDATE public.content_drafts SET status='review' WHERE slug='reviewed-article';
UPDATE public.content_drafts SET status='approved' WHERE slug='reviewed-article';
DO $publication_test$
DECLARE published timestamptz;
BEGIN
 UPDATE public.content_drafts SET status='published' WHERE slug='reviewed-article';
 SELECT published_at INTO published FROM public.content_drafts WHERE slug='reviewed-article';
 IF published IS NULL THEN RAISE EXCEPTION 'Publication timestamp missing'; END IF;
 UPDATE public.content_drafts SET status='review' WHERE slug='reviewed-article';
 IF (SELECT published_at FROM public.content_drafts WHERE slug='reviewed-article') IS NOT NULL THEN
   RAISE EXCEPTION 'Unpublish did not clear timestamp';
 END IF;
 UPDATE public.content_drafts SET status='approved' WHERE slug='reviewed-article';
 UPDATE public.content_drafts SET status='published' WHERE slug='reviewed-article';
 IF (SELECT published_at FROM public.content_drafts WHERE slug='reviewed-article') IS NULL THEN
   RAISE EXCEPTION 'Republish did not set timestamp';
 END IF;
 IF NOT EXISTS (SELECT 1 FROM public.published_articles WHERE slug='reviewed-article') THEN
   RAISE EXCEPTION 'Published article view missing row';
 END IF;
END $publication_test$;
INSERT INTO public.content_drafts(id,title,slug,body_markdown,status)
VALUES ('00000000-0000-4000-8000-000000000004','Unverified','unverified','Unsafe draft','draft');
UPDATE public.content_drafts SET status='review' WHERE slug='unverified';
UPDATE public.content_drafts SET status='approved' WHERE slug='unverified';
DO $$
BEGIN
 BEGIN
  UPDATE public.content_drafts SET status='published' WHERE slug='unverified';
  RAISE EXCEPTION 'Unverified article unexpectedly published';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
END $$;
