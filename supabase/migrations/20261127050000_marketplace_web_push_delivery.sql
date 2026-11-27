-- Reliable Web Push delivery for marketplace notification rows.
-- This migration is code-only until explicitly applied to a Supabase environment.

create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists supabase_vault with schema vault;

create table if not exists public.push_delivery_queue (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null unique references public.notifications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'delivered', 'failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  delivered_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_delivery_queue_ready_idx
  on public.push_delivery_queue(status, available_at, created_at)
  where status in ('pending', 'processing');

-- Browser subscriptions are written only by authenticated server routes after
-- validating the provider endpoint. Do not permit direct client writes that
-- could turn the delivery worker into an SSRF proxy.
revoke all on public.push_subscriptions from anon, authenticated, public, service_role;
grant select, insert, update, delete on public.push_subscriptions to service_role;
grant select on public.notifications, public.notification_preferences to service_role;

alter table public.push_delivery_queue enable row level security;
revoke all on public.push_delivery_queue from anon, authenticated, public, service_role;

create or replace function private.queue_marketplace_push_delivery()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if exists (
    select 1
    from public.notification_preferences np
    where np.user_id = new.user_id
      and np.push_enabled = true
  ) then
    insert into public.push_delivery_queue(notification_id, user_id)
    values (new.id, new.user_id)
    on conflict (notification_id) do nothing;
  end if;
  return new;
end;
$$;

revoke all on function private.queue_marketplace_push_delivery() from public, anon, authenticated;

drop trigger if exists trg_queue_marketplace_push_delivery on public.notifications;
create trigger trg_queue_marketplace_push_delivery
  after insert on public.notifications
  for each row execute function private.queue_marketplace_push_delivery();

-- Atomically claim work so overlapping workers cannot send the same item.
create or replace function public.claim_push_delivery_batch(p_batch_size integer default 25)
returns table(queue_id uuid, notification_id uuid, user_id uuid, attempt_count integer)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  update public.push_delivery_queue q
  set status = 'failed',
      locked_at = null,
      last_error = coalesce(q.last_error, 'Worker timed out after the maximum delivery attempts'),
      updated_at = now()
  where q.status = 'processing'
    and q.attempt_count >= 5
    and q.locked_at < now() - interval '5 minutes';

  return query
  with candidates as (
    select q.id
    from public.push_delivery_queue q
    where q.attempt_count < 5
      and (
        (q.status = 'pending' and q.available_at <= now())
        or (q.status = 'processing' and q.locked_at < now() - interval '5 minutes')
      )
    order by q.created_at
    for update skip locked
    limit greatest(1, least(coalesce(p_batch_size, 25), 100))
  )
  update public.push_delivery_queue q
  set status = 'processing',
      attempt_count = q.attempt_count + 1,
      locked_at = now(),
      updated_at = now()
  from candidates c
  where q.id = c.id
  returning q.id, q.notification_id, q.user_id, q.attempt_count;
end;
$$;

revoke all on function public.claim_push_delivery_batch(integer) from public, anon, authenticated;
grant execute on function public.claim_push_delivery_batch(integer) to service_role;

create or replace function public.complete_push_delivery(
  p_queue_id uuid,
  p_success boolean,
  p_error text default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  update public.push_delivery_queue q
  set status = case
        when p_success then 'delivered'
        when q.attempt_count >= 5 then 'failed'
        else 'pending'
      end,
      available_at = case
        when p_success or q.attempt_count >= 5 then q.available_at
        else now() + make_interval(
          secs => least(3600, (30 * power(2, greatest(q.attempt_count - 1, 0)))::integer)
        )
      end,
      delivered_at = case when p_success then now() else null end,
      locked_at = null,
      last_error = case when p_success then null else left(coalesce(p_error, 'Push delivery failed'), 1000) end,
      updated_at = now()
  where q.id = p_queue_id;
end;
$$;

revoke all on function public.complete_push_delivery(uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.complete_push_delivery(uuid, boolean, text) to service_role;

-- Supabase Vault values are added separately during environment setup.
-- Missing values intentionally make the scheduled dispatcher a safe no-op.
create or replace function private.dispatch_marketplace_push_queue()
returns bigint
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_project_url text;
  v_service_role_key text;
  v_dispatch_secret text;
  v_request_id bigint;
begin
  select decrypted_secret into v_project_url
  from vault.decrypted_secrets
  where name = 'agriva_push_delivery_project_url'
  limit 1;

  select decrypted_secret into v_service_role_key
  from vault.decrypted_secrets
  where name = 'agriva_push_delivery_service_role_key'
  limit 1;

  select decrypted_secret into v_dispatch_secret
  from vault.decrypted_secrets
  where name = 'agriva_push_delivery_secret'
  limit 1;

  if coalesce(v_project_url, '') = ''
     or coalesce(v_service_role_key, '') = ''
     or coalesce(v_dispatch_secret, '') = '' then
    return null;
  end if;

  select net.http_post(
    url := rtrim(v_project_url, '/') || '/functions/v1/push-delivery',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_role_key,
      'x-push-dispatch-secret', v_dispatch_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  ) into v_request_id;

  return v_request_id;
end;
$$;

revoke all on function private.dispatch_marketplace_push_queue() from public, anon, authenticated;

do $$
declare
  v_job_id bigint;
begin
  for v_job_id in
    select jobid from cron.job where jobname = 'agriva-marketplace-push-delivery'
  loop
    perform cron.unschedule(v_job_id);
  end loop;

  perform cron.schedule(
    'agriva-marketplace-push-delivery',
    '* * * * *',
    'select private.dispatch_marketplace_push_queue();'
  );
end;
$$;

comment on table public.push_delivery_queue is
  'Server-only outbox for retryable Web Push delivery; never readable by app users.';
comment on function public.claim_push_delivery_batch(integer) is
  'Atomically claims pending push deliveries for the service role worker.';
comment on function public.complete_push_delivery(uuid, boolean, text) is
  'Marks a push delivery complete or schedules exponential retry.';
