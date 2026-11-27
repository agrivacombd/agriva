-- Marketplace engagement: private in-app notifications, matching events, inquiries and wholesaler applications.
-- This migration is committed for review only; it has NOT been applied to any Supabase project.

create schema if not exists private;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in (
    'matching_harvest', 'matching_demand', 'demand_response',
    'harvest_inquiry', 'bulk_request', 'bulk_invitation', 'bulk_quote', 'wholesaler_application'
  )),
  title text not null check (char_length(title) between 1 and 160),
  body text not null default '' check (char_length(body) <= 500),
  href text not null default '/dashboard' check (href like '/%'),
  data jsonb not null default '{}'::jsonb,
  dedupe_key text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists notifications_user_dedupe_uidx
  on public.notifications(user_id, dedupe_key) where dedupe_key is not null;
create index if not exists notifications_user_created_idx
  on public.notifications(user_id, created_at desc);
create index if not exists notifications_unread_idx
  on public.notifications(user_id, created_at desc) where read_at is null;

alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update(read_at) on public.notifications to authenticated;
drop policy if exists notifications_read_own on public.notifications;
create policy notifications_read_own on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists notifications_mark_own_read on public.notifications;
create policy notifications_mark_own_read on public.notifications
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));


-- Realtime is used only for the user's own notification rows; RLS remains authoritative.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
     ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end
$$;

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  in_app_enabled boolean not null default true,
  matching_harvest_enabled boolean not null default true,
  matching_demand_enabled boolean not null default true,
  demand_response_enabled boolean not null default true,
  inquiry_enabled boolean not null default true,
  wholesale_enabled boolean not null default true,
  push_enabled boolean not null default false,
  digest_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.notification_preferences enable row level security;
revoke all on public.notification_preferences from anon, authenticated;
grant select, insert, update on public.notification_preferences to authenticated;
drop policy if exists notification_preferences_read_own on public.notification_preferences;
create policy notification_preferences_read_own on public.notification_preferences
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists notification_preferences_insert_own on public.notification_preferences;
create policy notification_preferences_insert_own on public.notification_preferences
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists notification_preferences_update_own on public.notification_preferences;
create policy notification_preferences_update_own on public.notification_preferences
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth_key text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, endpoint)
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);
alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon, authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;
drop policy if exists push_subscriptions_own_all on public.push_subscriptions;
create policy push_subscriptions_own_all on public.push_subscriptions
  for all to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create table if not exists public.harvest_listing_inquiries (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.harvest_listings(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  channel text not null check (channel in ('phone', 'whatsapp', 'message')),
  message text not null default '' check (char_length(message) <= 1000),
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now(),
  unique(listing_id, buyer_id, channel)
);
create index if not exists harvest_inquiries_seller_idx
  on public.harvest_listing_inquiries(seller_id, created_at desc);
create index if not exists harvest_inquiries_buyer_idx
  on public.harvest_listing_inquiries(buyer_id, created_at desc);
alter table public.harvest_listing_inquiries enable row level security;
revoke all on public.harvest_listing_inquiries from anon, authenticated;
grant select, insert on public.harvest_listing_inquiries to authenticated;
grant update(status) on public.harvest_listing_inquiries to authenticated;
drop policy if exists harvest_inquiries_parties_read on public.harvest_listing_inquiries;
create policy harvest_inquiries_parties_read on public.harvest_listing_inquiries
  for select to authenticated using (
    buyer_id = (select auth.uid()) or seller_id = (select auth.uid())
  );
drop policy if exists harvest_inquiries_buyer_create on public.harvest_listing_inquiries;
create policy harvest_inquiries_buyer_create on public.harvest_listing_inquiries
  for insert to authenticated with check (
    buyer_id = (select auth.uid())
    and seller_id <> (select auth.uid())
    and status = 'new'
    and exists (
      select 1 from public.harvest_listings l
      where l.id = listing_id and l.owner_id = seller_id and l.status = 'available'
    )
  );
drop policy if exists harvest_inquiries_seller_update on public.harvest_listing_inquiries;
create policy harvest_inquiries_seller_update on public.harvest_listing_inquiries
  for update to authenticated using (seller_id = (select auth.uid()))
  with check (seller_id = (select auth.uid()));

create table if not exists public.bulk_wholesaler_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null check (char_length(trim(business_name)) between 2 and 120),
  contact_name text not null check (char_length(trim(contact_name)) between 2 and 100),
  phone text not null check (char_length(trim(phone)) between 7 and 24),
  business_address text not null check (char_length(trim(business_address)) between 5 and 300),
  district text not null check (char_length(trim(district)) between 2 and 80),
  product_categories text[] not null check (cardinality(product_categories) between 1 and 20),
  service_districts text[] not null default '{}' check (cardinality(service_districts) <= 64),
  monthly_capacity numeric check (monthly_capacity is null or monthly_capacity > 0),
  note text not null default '' check (char_length(note) <= 1000),
  status text not null default 'pending' check (status in ('pending', 'under_review', 'approved', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);
create index if not exists bulk_wholesaler_applications_status_idx
  on public.bulk_wholesaler_applications(status, created_at desc);
alter table public.bulk_wholesaler_applications enable row level security;
revoke all on public.bulk_wholesaler_applications from anon, authenticated;
grant select, insert, update on public.bulk_wholesaler_applications to authenticated;
drop policy if exists wholesaler_application_read_own on public.bulk_wholesaler_applications;
create policy wholesaler_application_read_own on public.bulk_wholesaler_applications
  for select to authenticated using (user_id = (select auth.uid()) or bulk_is_admin());
drop policy if exists wholesaler_application_create_own on public.bulk_wholesaler_applications;
create policy wholesaler_application_create_own on public.bulk_wholesaler_applications
  for insert to authenticated with check (
    user_id = (select auth.uid()) and status = 'pending'
  );
drop policy if exists wholesaler_application_update_own_pending on public.bulk_wholesaler_applications;
create policy wholesaler_application_update_own_pending on public.bulk_wholesaler_applications
  for update to authenticated using (
    user_id = (select auth.uid()) and status = 'pending'
  ) with check (
    user_id = (select auth.uid()) and status = 'pending'
  );
drop policy if exists wholesaler_application_admin_review on public.bulk_wholesaler_applications;
create policy wholesaler_application_admin_review on public.bulk_wholesaler_applications
  for update to authenticated using (bulk_is_admin())
  with check (bulk_is_admin());

create or replace function private.enqueue_marketplace_notification(
  p_user_id uuid, p_event_type text, p_title text, p_body text, p_href text,
  p_dedupe_key text, p_data jsonb default '{}'::jsonb
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_enabled boolean;
  v_category_enabled boolean;
begin
  if p_user_id is null then return; end if;
  select coalesce(in_app_enabled, true),
    case p_event_type
      when 'matching_harvest' then coalesce(matching_harvest_enabled, true)
      when 'matching_demand' then coalesce(matching_demand_enabled, true)
      when 'demand_response' then coalesce(demand_response_enabled, true)
      when 'harvest_inquiry' then coalesce(inquiry_enabled, true)
      when 'bulk_request' then coalesce(wholesale_enabled, true)
      when 'bulk_invitation' then coalesce(wholesale_enabled, true)
      when 'bulk_quote' then coalesce(wholesale_enabled, true)
      when 'wholesaler_application' then coalesce(wholesale_enabled, true)
      else true
    end
  into v_enabled, v_category_enabled
  from public.notification_preferences where user_id = p_user_id;
  if not found then v_enabled := true; v_category_enabled := true; end if;
  if not v_enabled or not v_category_enabled then return; end if;

  insert into public.notifications(user_id, event_type, title, body, href, dedupe_key, data)
  values (p_user_id, p_event_type, p_title, coalesce(p_body, ''), coalesce(p_href, '/dashboard'),
          p_dedupe_key, coalesce(p_data, '{}'::jsonb))
  on conflict (user_id, dedupe_key) where dedupe_key is not null do nothing;
end;
$$;

create or replace function private.notify_matching_harvest_demands()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
declare d record;
begin
  if new.status <> 'available' or new.moderation_status <> 'approved' then return new; end if;
  for d in
    select bd.id, bd.buyer_id, bd.crop_name
    from public.buyer_demands bd
    where bd.status = 'active'
      and (bd.response_deadline is null or bd.response_deadline >= current_date)
      and lower(trim(bd.crop_name)) = lower(trim(new.crop_name))
      and lower(trim(bd.district)) = lower(trim(new.district))
      and (bd.upazila is null or bd.upazila = '' or new.upazila is null or bd.upazila = new.upazila)
      and bd.buyer_id <> new.owner_id
  loop
    perform private.enqueue_marketplace_notification(
      d.buyer_id, 'matching_harvest', 'আপনার চাহিদার ফসল পাওয়া গেছে',
      new.crop_name || ' — ' || new.district || ' এলাকায় নতুন ফসলের পোস্ট এসেছে।',
      '/sell-harvest', 'harvest:' || new.id::text || ':buyer:' || d.buyer_id::text,
      jsonb_build_object('listing_id', new.id, 'demand_id', d.id)
    );
  end loop;
  return new;
end;
$$;

create or replace function private.notify_matching_buyer_demands()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
declare f record;
begin
  if new.status <> 'active' then return new; end if;
  for f in
    select distinct hl.owner_id
    from public.harvest_listings hl
    where hl.status = 'available' and hl.moderation_status = 'approved'
      and lower(trim(hl.crop_name)) = lower(trim(new.crop_name))
      and lower(trim(hl.district)) = lower(trim(new.district))
      and (new.upazila is null or new.upazila = '' or hl.upazila is null or hl.upazila = new.upazila)
      and hl.owner_id <> new.buyer_id
  loop
    perform private.enqueue_marketplace_notification(
      f.owner_id, 'matching_demand', 'আপনার এলাকায় ক্রেতার নতুন চাহিদা',
      new.crop_name || ' — ' || new.district || ' এলাকায় ক্রেতা ফসল খুঁজছেন।',
      '/buyer-demands', 'demand:' || new.id::text || ':farmer:' || f.owner_id::text,
      jsonb_build_object('demand_id', new.id)
    );
  end loop;
  return new;
end;
$$;

create or replace function private.notify_buyer_demand_response()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
declare v_buyer_id uuid; v_crop text;
begin
  select buyer_id, crop_name into v_buyer_id, v_crop
  from public.buyer_demands where id = new.demand_id and status = 'active';
  if v_buyer_id is not null then
    perform private.enqueue_marketplace_notification(
      v_buyer_id, 'demand_response', 'আপনার চাহিদায় নতুন সাড়া এসেছে',
      v_crop || ' চাহিদায় একজন কৃষক আগ্রহ জানিয়েছেন।',
      '/buyer-demands', 'demand-response:' || new.id::text,
      jsonb_build_object('demand_id', new.demand_id, 'response_id', new.id)
    );
  end if;
  return new;
end;
$$;

create or replace function private.notify_harvest_inquiry()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
declare v_crop text;
begin
  select crop_name into v_crop from public.harvest_listings where id = new.listing_id;
  perform private.enqueue_marketplace_notification(
    new.seller_id, 'harvest_inquiry', 'আপনার ফসলে একজন ক্রেতার আগ্রহ',
    coalesce(v_crop, 'আপনার ফসল') || ' পোস্টে একজন ক্রেতা যোগাযোগ করতে চেয়েছেন।',
    '/sell-harvest', 'harvest-inquiry:' || new.id::text,
    jsonb_build_object('listing_id', new.listing_id, 'inquiry_id', new.id, 'channel', new.channel)
  );
  return new;
end;
$$;

create or replace function private.notify_bulk_request_wholesalers()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
declare w record;
begin
  if new.status <> 'open' or (tg_op = 'UPDATE' and old.status = new.status) then return new; end if;
  for w in
    select bw.user_id
    from public.bulk_wholesalers bw
    where bw.status = 'verified'
      and exists (
        select 1 from public.bulk_invitations bi
        where bi.request_id = new.id and bi.wholesaler_id = bw.user_id
          and bi.revoked_at is null and bi.expires_at > now()
      )
  loop
    perform private.enqueue_marketplace_notification(
      w.user_id, 'bulk_request', 'নতুন পাইকারি চাহিদার আমন্ত্রণ',
      new.product_name || ' — ' || new.district || ' এলাকায় নতুন bulk demand এসেছে।',
      '/custom-order', 'bulk-request:' || new.id::text || ':wholesaler:' || w.user_id::text,
      jsonb_build_object('request_id', new.id)
    );
  end loop;
  return new;
end;
$$;

create or replace function private.notify_bulk_invitation()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
declare v_product text; v_status text;
begin
  select product_name, status into v_product, v_status
  from public.bulk_requests where id = new.request_id;
  if v_status = 'open' and new.revoked_at is null and new.expires_at > now() then
    perform private.enqueue_marketplace_notification(
      new.wholesaler_id, 'bulk_invitation', 'আপনাকে bulk demand-এ আমন্ত্রণ জানানো হয়েছে',
      coalesce(v_product, 'পাইকারি পণ্য') || ' চাহিদার জন্য AGRIVA-তে quotation দিন।',
      '/custom-order', 'bulk-invitation:' || new.id::text,
      jsonb_build_object('request_id', new.request_id, 'invitation_id', new.id)
    );
  end if;
  return new;
end;
$$;

create or replace function private.notify_bulk_quote()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
declare v_buyer_id uuid; v_product text;
begin
  select br.buyer_id, br.product_name into v_buyer_id, v_product
  from public.bulk_requests br where br.id = new.request_id and br.status in ('open', 'selected');
  if v_buyer_id is not null then
    perform private.enqueue_marketplace_notification(
      v_buyer_id, 'bulk_quote', 'আপনার পাইকারি চাহিদায় quotation এসেছে',
      coalesce(v_product, 'আপনার চাহিদা') || ' বিষয়ে একজন verified wholesaler quotation দিয়েছেন।',
      '/custom-order', 'bulk-quote:' || new.id::text,
      jsonb_build_object('request_id', new.request_id, 'quote_id', new.id)
    );
  end if;
  return new;
end;
$$;

revoke all on function private.enqueue_marketplace_notification(uuid, text, text, text, text, text, jsonb) from public, anon, authenticated;
revoke all on function private.notify_matching_harvest_demands() from public, anon, authenticated;
revoke all on function private.notify_matching_buyer_demands() from public, anon, authenticated;
revoke all on function private.notify_buyer_demand_response() from public, anon, authenticated;
revoke all on function private.notify_harvest_inquiry() from public, anon, authenticated;
revoke all on function private.notify_bulk_request_wholesalers() from public, anon, authenticated;
revoke all on function private.notify_bulk_invitation() from public, anon, authenticated;
revoke all on function private.notify_bulk_quote() from public, anon, authenticated;

drop trigger if exists trg_notify_matching_harvest_demands on public.harvest_listings;
create trigger trg_notify_matching_harvest_demands
  after insert on public.harvest_listings
  for each row execute function private.notify_matching_harvest_demands();
drop trigger if exists trg_notify_matching_buyer_demands on public.buyer_demands;
create trigger trg_notify_matching_buyer_demands
  after insert on public.buyer_demands
  for each row execute function private.notify_matching_buyer_demands();
drop trigger if exists trg_notify_buyer_demand_response on public.buyer_demand_responses;
create trigger trg_notify_buyer_demand_response
  after insert on public.buyer_demand_responses
  for each row execute function private.notify_buyer_demand_response();
drop trigger if exists trg_notify_harvest_inquiry on public.harvest_listing_inquiries;
create trigger trg_notify_harvest_inquiry
  after insert on public.harvest_listing_inquiries
  for each row execute function private.notify_harvest_inquiry();
drop trigger if exists trg_notify_bulk_request_wholesalers on public.bulk_requests;
create trigger trg_notify_bulk_request_wholesalers
  after insert or update of status on public.bulk_requests
  for each row execute function private.notify_bulk_request_wholesalers();
drop trigger if exists trg_notify_bulk_invitation on public.bulk_invitations;
create trigger trg_notify_bulk_invitation
  after insert on public.bulk_invitations
  for each row execute function private.notify_bulk_invitation();
drop trigger if exists trg_notify_bulk_quote on public.bulk_quotes;
create trigger trg_notify_bulk_quote
  after insert on public.bulk_quotes
  for each row execute function private.notify_bulk_quote();


create or replace function private.sync_wholesaler_application_approval()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = 'approved' and old.status is distinct from new.status then
    insert into public.bulk_wholesalers(user_id, status, verified_at)
    values (new.user_id, 'verified', now())
    on conflict (user_id) do update
      set status = 'verified', verified_at = now();
  end if;
  return new;
end;
$$;

create or replace function private.notify_wholesaler_application_status()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  if new.status is distinct from old.status and new.status in ('approved', 'rejected', 'under_review') then
    perform private.enqueue_marketplace_notification(
      new.user_id, 'wholesaler_application',
      case new.status
        when 'approved' then 'আপনার wholesaler আবেদন অনুমোদিত হয়েছে'
        when 'rejected' then 'আপনার wholesaler আবেদন সম্পর্কে আপডেট'
        else 'আপনার wholesaler আবেদন যাচাই চলছে'
      end,
      case new.status
        when 'approved' then 'আপনি এখন verified wholesaler হিসেবে AGRIVA-র bulk demand-এ quotation দিতে পারবেন।'
        when 'rejected' then 'আবেদনের বিষয়ে আরও তথ্যের জন্য AGRIVA support-এর সঙ্গে যোগাযোগ করুন।'
        else 'AGRIVA টিম আপনার ব্যবসার তথ্য যাচাই করছে।'
      end,
      '/wholesaler/apply', 'wholesaler-application:' || new.id::text || ':' || new.status,
      jsonb_build_object('application_id', new.id, 'status', new.status)
    );
  end if;
  return new;
end;
$$;

revoke all on function private.sync_wholesaler_application_approval() from public, anon, authenticated;
revoke all on function private.notify_wholesaler_application_status() from public, anon, authenticated;

drop trigger if exists trg_sync_wholesaler_application_approval on public.bulk_wholesaler_applications;
create trigger trg_sync_wholesaler_application_approval
  after update of status on public.bulk_wholesaler_applications
  for each row execute function private.sync_wholesaler_application_approval();
drop trigger if exists trg_notify_wholesaler_application_status on public.bulk_wholesaler_applications;
create trigger trg_notify_wholesaler_application_status
  after update of status on public.bulk_wholesaler_applications
  for each row execute function private.notify_wholesaler_application_status();

create or replace function private.notify_bulk_quote_approved()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
declare v_product text;
begin
  if new.status = 'approved' and old.status is distinct from new.status then
    select product_name into v_product from public.bulk_requests where id = new.request_id;
    perform private.enqueue_marketplace_notification(
      new.wholesaler_id, 'bulk_quote', 'আপনার quotation ক্রেতা গ্রহণ করেছেন',
      coalesce(v_product, 'আপনার quotation') || ' বিষয়ে ক্রেতা quotation অনুমোদন করেছেন।',
      '/custom-order', 'bulk-quote-approved:' || new.id::text,
      jsonb_build_object('request_id', new.request_id, 'quote_id', new.id)
    );
  end if;
  return new;
end;
$$;
revoke all on function private.notify_bulk_quote_approved() from public, anon, authenticated;
drop trigger if exists trg_notify_bulk_quote_approved on public.bulk_quotes;
create trigger trg_notify_bulk_quote_approved
  after update of status on public.bulk_quotes
  for each row execute function private.notify_bulk_quote_approved();

comment on table public.notifications is 'Private in-app marketplace notifications. Rows are created by trusted database triggers.';
comment on table public.notification_preferences is 'Per-user in-app and push notification preferences.';
comment on table public.push_subscriptions is 'Opt-in browser push endpoints; sending is handled server-side only.';
comment on table public.harvest_listing_inquiries is 'Tracks buyer contact intent for harvest listings.';
comment on table public.bulk_wholesaler_applications is 'Self-service wholesaler onboarding; approval remains admin-controlled.';
