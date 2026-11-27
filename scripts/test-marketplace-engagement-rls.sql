begin;

do $$
declare
  t text;
begin
  foreach t in array array[
    'notifications','notification_preferences','push_subscriptions',
    'harvest_listing_inquiries','bulk_wholesaler_applications'
  ] loop
    if not exists (
      select 1 from pg_class c
      join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relname=t and c.relrowsecurity
    ) then
      raise exception 'RLS is not enabled on public.%', t;
    end if;
  end loop;

  if has_table_privilege('anon','public.notifications','SELECT') then
    raise exception 'anon unexpectedly has notifications SELECT';
  end if;
  if has_table_privilege('authenticated','public.notifications','INSERT') then
    raise exception 'authenticated unexpectedly has notifications INSERT';
  end if;
  if has_column_privilege('authenticated','public.notifications','user_id','UPDATE') then
    raise exception 'authenticated can update notification ownership';
  end if;
  if has_function_privilege('authenticated',
    'private.enqueue_marketplace_notification(uuid,text,text,text,text,text,jsonb)','EXECUTE') then
    raise exception 'authenticated can execute private notification enqueue function';
  end if;
  if has_function_privilege('anon',
    'private.enqueue_marketplace_notification(uuid,text,text,text,text,text,jsonb)','EXECUTE') then
    raise exception 'anon can execute private notification enqueue function';
  end if;

  if not exists (select 1 from pg_trigger where tgname='trg_notify_matching_harvest_demands' and not tgisinternal)
     or not exists (select 1 from pg_trigger where tgname='trg_notify_matching_buyer_demands' and not tgisinternal)
     or not exists (select 1 from pg_trigger where tgname='trg_notify_harvest_inquiry' and not tgisinternal)
     or not exists (select 1 from pg_trigger where tgname='trg_notify_wholesaler_application_status' and not tgisinternal)
  then
    raise exception 'One or more marketplace notification triggers are missing';
  end if;
end
$$;

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
(
  '10000000-0000-4000-8000-000000000001','authenticated','authenticated',
  'marketplace-rls-a@example.test','',now(),'{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,now(),now()
),
(
  '10000000-0000-4000-8000-000000000002','authenticated','authenticated',
  'marketplace-rls-b@example.test','',now(),'{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,now(),now()
);

insert into public.notification_preferences(user_id, in_app_enabled, push_enabled)
values ('10000000-0000-4000-8000-000000000001', false, true);

insert into public.notifications(user_id,event_type,title,dedupe_key,in_app_visible)
values ('10000000-0000-4000-8000-000000000002','matching_harvest','B user notification','rls-test-b',true);

select private.enqueue_marketplace_notification(
  '10000000-0000-4000-8000-000000000001',
  'matching_harvest',
  'A push-only notification',
  'Push-only message',
  '/dashboard',
  'rls-test-push-only',
  '{}'::jsonb
);

do $$
begin
  if not exists (
    select 1 from public.push_delivery_queue q
    join public.notifications n on n.id = q.notification_id
    where n.dedupe_key = 'rls-test-push-only'
      and q.user_id = '10000000-0000-4000-8000-000000000001'
      and q.status = 'pending'
  ) then
    raise exception 'Push-only notification was not queued for delivery';
  end if;
end
$$;

insert into public.bulk_wholesaler_applications (
  user_id,business_name,contact_name,phone,business_address,district,product_categories
) values (
  '10000000-0000-4000-8000-000000000001',
  'Test Wholesale A','Test Contact','01700000000','Test market address','Dhaka',array['rice']
);

set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);

do $$
declare
  v_count integer;
  v_rows integer;
begin
  select count(*) into v_count from public.notifications;
  if v_count <> 0 then
    raise exception 'Push-only notification leaked into in-app inbox: expected 0 rows, got %', v_count;
  end if;

  update public.notifications set read_at=now()
  where dedupe_key='rls-test-push-only';
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then raise exception 'User updated a push-only notification'; end if;

  select count(*) into v_count from public.bulk_wholesaler_applications;
  if v_count <> 1 then
    raise exception 'Wholesaler application RLS isolation failed: expected 1 row, got %', v_count;
  end if;

  begin
    update public.bulk_wholesaler_applications set status='approved'
    where user_id='10000000-0000-4000-8000-000000000001';
    raise exception 'Applicant unexpectedly self-approved';
  exception when insufficient_privilege then
    null;
  end;

  begin
    insert into public.bulk_wholesaler_applications (
      user_id,business_name,contact_name,phone,business_address,district,product_categories,status
    ) values (
      '10000000-0000-4000-8000-000000000001',
      'Self Approved Wholesale','Test Contact','01700000001','Test market address','Dhaka',array['rice'],'approved'
    );
    raise exception 'Applicant unexpectedly inserted an approved application';
  exception when insufficient_privilege then
    null;
  end;
end
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);

do $$
declare
  v_count integer;
  v_rows integer;
begin
  select count(*) into v_count from public.notifications;
  if v_count <> 1 then
    raise exception 'Visible notification isolation failed: expected 1 row, got %', v_count;
  end if;

  update public.notifications set read_at=now()
  where dedupe_key='rls-test-b';
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then raise exception 'Owner could not mark own visible notification read'; end if;

  update public.notifications set read_at=now()
  where dedupe_key='rls-test-push-only';
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then raise exception 'Another user updated a push-only notification'; end if;
end
$$;

reset role;
set local role service_role;
do $$
declare v_count integer;
begin
  select count(*) into v_count from public.notifications where dedupe_key='rls-test-push-only';
  if v_count <> 1 then
    raise exception 'Service worker role cannot read push-only notification payload';
  end if;
end
$$;
reset role;
rollback;
