-- Applied to production 2026-11-16 as admin_content_draft_trash_restore_and_audited_permanent_delete
alter table public.content_drafts
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.profiles(id) on delete set null,
  add column if not exists deleted_from_status text;
create index if not exists idx_content_drafts_active_articles on public.content_drafts(updated_at desc)
  where content_type='article' and deleted_at is null;
create index if not exists idx_content_drafts_trash on public.content_drafts(deleted_at desc)
  where deleted_at is not null;
alter policy content_drafts_public_published_articles_read on public.content_drafts
  using(status='published'::public.content_draft_status and content_type='article' and deleted_at is null);
create or replace function public.audit_content_draft_removal()
returns trigger language plpgsql security definer
set search_path='pg_catalog','public','pg_temp'
as $$
begin
  if tg_op='UPDATE' then
    if old.deleted_at is distinct from new.deleted_at then
      insert into public.admin_audit_log(admin_id,action,entity_type,entity_id,metadata)
      values(auth.uid(),case when new.deleted_at is null then 'content_draft.restored' else 'content_draft.trashed' end,
        'content_draft',old.id,jsonb_build_object('slug',old.slug,'title',old.title,'content_type',old.content_type,
        'status_before',old.status::text,'status_after',new.status::text));
    end if;
    return new;
  end if;
  if tg_op='DELETE' then
    if old.deleted_at is null then raise exception 'Content must be in trash before permanent deletion'; end if;
    insert into public.admin_audit_log(admin_id,action,entity_type,entity_id,metadata)
    values(auth.uid(),'content_draft.permanently_deleted','content_draft',old.id,
      jsonb_build_object('slug',old.slug,'title',old.title,'content_type',old.content_type,'deleted_at',old.deleted_at));
    return old;
  end if;
  return null;
end $$;
revoke all on function public.audit_content_draft_removal() from public,anon,authenticated;
drop trigger if exists trg_audit_content_draft_trash on public.content_drafts;
create trigger trg_audit_content_draft_trash after update of deleted_at on public.content_drafts
for each row execute function public.audit_content_draft_removal();
drop trigger if exists trg_audit_content_draft_permanent_delete on public.content_drafts;
create trigger trg_audit_content_draft_permanent_delete before delete on public.content_drafts
for each row execute function public.audit_content_draft_removal();
