-- Executed after repair migration in a disposable PostgreSQL instance.
DO $$
DECLARE d uuid; n integer;
BEGIN
 SELECT id INTO d FROM public.content_drafts LIMIT 1;
 BEGIN
  UPDATE public.content_drafts SET status='published' WHERE id=d;
  RAISE EXCEPTION 'Direct draft-to-published transition unexpectedly succeeded';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
 UPDATE public.content_drafts SET status='review' WHERE id=d;
 UPDATE public.content_drafts SET status='approved' WHERE id=d;
 UPDATE public.content_drafts SET status='published' WHERE id=d;
 BEGIN
  UPDATE public.content_drafts SET body_markdown='changed while published' WHERE id=d;
  RAISE EXCEPTION 'Published edit unexpectedly succeeded';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
 UPDATE public.content_drafts SET status='review' WHERE id=d;
 UPDATE public.content_drafts SET body_markdown='changed after unpublish' WHERE id=d;
 SELECT count(*) INTO n FROM public.content_draft_revisions WHERE draft_id=d;
 IF n <> 5 THEN RAISE EXCEPTION 'Expected 5 revisions, found %', n; END IF;
 IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.content_draft_revisions'::regclass) THEN
   RAISE EXCEPTION 'Revision table RLS disabled';
 END IF;
 IF has_table_privilege('anon','public.content_draft_revisions','SELECT') THEN
   RAISE EXCEPTION 'Anonymous access to revisions unexpectedly granted';
 END IF;
END $$;
