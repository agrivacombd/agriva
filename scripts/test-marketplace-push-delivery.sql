\set ON_ERROR_STOP on

do $$
begin
  if to_regclass('public.push_delivery_queue') is null then
    raise exception 'push_delivery_queue table is missing';
  end if;

  if not exists (
    select 1 from pg_class
    where oid = 'public.push_delivery_queue'::regclass and relrowsecurity
  ) then
    raise exception 'push delivery queue RLS is not enabled';
  end if;

  if has_table_privilege('anon', 'public.push_delivery_queue', 'SELECT')
     or has_table_privilege('authenticated', 'public.push_delivery_queue', 'SELECT')
     or has_table_privilege('service_role', 'public.push_delivery_queue', 'SELECT')
     or has_table_privilege('anon', 'public.push_delivery_queue', 'INSERT')
     or has_table_privilege('authenticated', 'public.push_delivery_queue', 'INSERT')
     or has_table_privilege('service_role', 'public.push_delivery_queue', 'INSERT') then
    raise exception 'client roles must not access the push delivery queue';
  end if;

  if has_table_privilege('anon', 'public.push_subscriptions', 'SELECT')
     or has_table_privilege('authenticated', 'public.push_subscriptions', 'SELECT')
     or has_table_privilege('anon', 'public.push_subscriptions', 'INSERT')
     or has_table_privilege('authenticated', 'public.push_subscriptions', 'INSERT')
     or not has_table_privilege('service_role', 'public.push_subscriptions', 'SELECT')
     or not has_table_privilege('service_role', 'public.push_subscriptions', 'INSERT')
     or not has_table_privilege('service_role', 'public.push_subscriptions', 'DELETE') then
    raise exception 'browser push subscriptions must be server-managed only';
  end if;

  if not has_function_privilege('service_role', 'public.claim_push_delivery_batch(integer)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.claim_push_delivery_batch(integer)', 'EXECUTE')
     or has_function_privilege('anon', 'public.claim_push_delivery_batch(integer)', 'EXECUTE') then
    raise exception 'push claim RPC grants are not least-privilege';
  end if;

  if not has_function_privilege('service_role', 'public.complete_push_delivery(uuid,boolean,text)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.complete_push_delivery(uuid,boolean,text)', 'EXECUTE')
     or has_function_privilege('anon', 'public.complete_push_delivery(uuid,boolean,text)', 'EXECUTE') then
    raise exception 'push completion RPC grants are not least-privilege';
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgname = 'trg_queue_marketplace_push_delivery'
      and tgrelid = 'public.notifications'::regclass
      and not tgisinternal
  ) then
    raise exception 'notification outbox trigger is missing';
  end if;

  if not exists (
    select 1 from cron.job
    where jobname = 'agriva-marketplace-push-delivery'
      and schedule = '* * * * *'
      and active
  ) then
    raise exception 'one-minute push delivery cron job is missing';
  end if;

  if not exists (
    select 1 from pg_extension where extname = 'pg_net'
  ) then
    raise exception 'pg_net extension is not installed';
  end if;
end
$$;

select 'Marketplace push delivery security checks passed' as result;

-- Exercise the real database outbox lifecycle with synthetic users only.
-- Everything is wrapped in a transaction and rolled back; no provider/VAPID
-- credentials, production records, or external network calls are involved.
begin;

do $$
declare
  v_user_id uuid := 'f4d8c1a2-8a51-4b62-9b6d-202611280001';
  v_disabled_user_id uuid := 'f4d8c1a2-8a51-4b62-9b6d-202611280002';
  v_notification_id uuid;
  v_success_notification_id uuid;
  v_job record;
  v_attempt integer;
  v_queue public.push_delivery_queue%rowtype;
begin
  insert into auth.users (
    id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values
    (v_user_id, 'authenticated', 'authenticated', 'push-queue-ci@example.invalid',
     '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
    (v_disabled_user_id, 'authenticated', 'authenticated', 'push-disabled-ci@example.invalid',
     '', now(), '{}'::jsonb, '{}'::jsonb, now(), now());

  insert into public.notification_preferences(user_id, push_enabled)
  values (v_user_id, true), (v_disabled_user_id, false);

  insert into public.notifications(user_id, event_type, title, body, href)
  values (v_user_id, 'matching_harvest', 'CI retry fixture', 'Synthetic only', '/notifications')
  returning id into v_notification_id;

  select * into v_queue
  from public.push_delivery_queue
  where notification_id = v_notification_id;
  if not found or v_queue.status <> 'pending' or v_queue.attempt_count <> 0 then
    raise exception 'push notification trigger did not enqueue one pending job';
  end if;

  -- First claim succeeds; a second overlapping claim cannot return the same job.
  select * into v_job from public.claim_push_delivery_batch(20);
  if not found or v_job.notification_id <> v_notification_id or v_job.attempt_count <> 1 then
    raise exception 'first atomic claim did not return the expected job';
  end if;
  if exists (select 1 from public.claim_push_delivery_batch(20)) then
    raise exception 'processing job was claimed twice';
  end if;

  -- Transient provider failures schedule retry with exponential backoff.
  perform public.complete_push_delivery(v_job.queue_id, false, 'synthetic transient failure');
  select * into v_queue from public.push_delivery_queue where id = v_job.queue_id;
  if v_queue.status <> 'pending' or v_queue.attempt_count <> 1
     or v_queue.available_at <= now() or v_queue.last_error <> 'synthetic transient failure' then
    raise exception 'transient failure did not schedule a delayed retry';
  end if;

  -- Advance only this synthetic row to make each retry deterministic and fast.
  for v_attempt in 2..5 loop
    update public.push_delivery_queue set available_at = now() where id = v_job.queue_id;
    select * into v_job from public.claim_push_delivery_batch(20);
    if not found or v_job.queue_id <> v_queue.id or v_job.attempt_count <> v_attempt then
      raise exception 'retry claim % was not returned with the expected attempt count', v_attempt;
    end if;
    perform public.complete_push_delivery(v_job.queue_id, false, 'synthetic exhausted attempt');
  end loop;

  select * into v_queue from public.push_delivery_queue where id = v_job.queue_id;
  if v_queue.status <> 'failed' or v_queue.attempt_count <> 5 or v_queue.locked_at is not null then
    raise exception 'delivery was not terminally failed after five attempts';
  end if;

  -- Successful delivery is terminal and records delivered_at.
  insert into public.notifications(user_id, event_type, title, body, href)
  values (v_user_id, 'matching_demand', 'CI success fixture', 'Synthetic only', '/notifications')
  returning id into v_success_notification_id;
  select * into v_job from public.claim_push_delivery_batch(20);
  if not found or v_job.notification_id <> v_success_notification_id then
    raise exception 'success fixture was not claimable';
  end if;
  perform public.complete_push_delivery(v_job.queue_id, true, null);
  select * into v_queue from public.push_delivery_queue where id = v_job.queue_id;
  if v_queue.status <> 'delivered' or v_queue.delivered_at is null or v_queue.last_error is not null then
    raise exception 'successful delivery was not finalized correctly';
  end if;

  -- Push-disabled recipients must not get an outbox row.
  insert into public.notifications(user_id, event_type, title, body, href)
  values (v_disabled_user_id, 'matching_harvest', 'CI disabled fixture', 'Synthetic only', '/notifications');
  if exists (
    select 1 from public.push_delivery_queue q
    join public.notifications n on n.id = q.notification_id
    where n.user_id = v_disabled_user_id
  ) then
    raise exception 'push-disabled recipient was incorrectly enqueued';
  end if;
end
$$;

rollback;

select 'Marketplace push delivery outbox lifecycle integration checks passed' as result;
