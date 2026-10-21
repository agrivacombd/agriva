-- AGRIVA admin content controls: site settings and product categories.
create table if not exists public.site_settings (
  key text primary key check (length(key) between 1 and 80),
  value text not null default '',
  description text not null default '',
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;
alter table public.product_categories enable row level security;
drop policy if exists "site_settings_admin_read" on public.site_settings;
create policy "site_settings_admin_read" on public.site_settings for select using (public.is_admin());
drop policy if exists "product_categories_public_read" on public.product_categories;
create policy "product_categories_public_read" on public.product_categories for select using (is_active or public.is_admin());

insert into public.site_settings(key,value,description) values
 ('site_name','AGRIVA','Public brand name'),
 ('support_phone','','Public support phone number'),
 ('support_email','support@agriva.com.bd','Public support email'),
 ('homepage_notice','','Optional homepage announcement; leave blank to hide'),
 ('cod_enabled','true','Cash on delivery checkout toggle'),
 ('online_payment_enabled','false','Online payment must remain disabled until provider is verified')
on conflict (key) do nothing;

create or replace function public.admin_update_site_setting(p_key text,p_value text)
returns public.site_settings
language plpgsql security definer set search_path=public
as $$
declare result public.site_settings;
begin
 if auth.uid() is null or not public.is_admin() then raise exception 'Admin role required'; end if;
 if p_key not in ('site_name','support_phone','support_email','homepage_notice','cod_enabled','online_payment_enabled') then raise exception 'Setting key is not editable'; end if;
 if p_value is null or length(p_value)>1000 then raise exception 'Invalid setting value'; end if;
 if p_key in ('cod_enabled','online_payment_enabled') and p_value not in ('true','false') then raise exception 'Boolean setting must be true or false'; end if;
 if p_key='site_name' and length(trim(p_value))=0 then raise exception 'Site name cannot be empty'; end if;
 -- Keep online payment disabled until a separately verified provider integration is enabled.
 if p_key='online_payment_enabled' and p_value='true' then raise exception 'Online payments require a separately verified payment integration'; end if;
 insert into public.site_settings(key,value,updated_by,updated_at)
 values(p_key,trim(p_value),auth.uid(),now())
 on conflict(key) do update set value=excluded.value,updated_by=excluded.updated_by,updated_at=excluded.updated_at
 returning * into result;
 insert into public.admin_audit_log(admin_id,action,entity_type,metadata)
 values(auth.uid(),'site_setting.updated','site_setting',jsonb_build_object('key',p_key,'value',case when p_key in ('support_phone','support_email') then '[redacted/contact]' else result.value end));
 return result;
end; $$;
grant execute on function public.admin_update_site_setting(text,text) to authenticated;

create or replace function public.admin_save_product_category(
 p_category_id uuid,p_name text,p_slug text,p_description text,p_is_active boolean,p_sort_order integer
)
returns public.product_categories
language plpgsql security definer set search_path=public
as $$
declare result public.product_categories;
begin
 if auth.uid() is null or not public.is_admin() then raise exception 'Admin role required'; end if;
 if nullif(trim(p_name),'') is null or nullif(trim(p_slug),'') is null then raise exception 'Name and slug are required'; end if;
 if trim(p_slug) !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then raise exception 'Slug must use lowercase letters, numbers and hyphens'; end if;
 if length(trim(p_name))>100 or length(trim(p_slug))>120 or length(coalesce(p_description,''))>1000 then raise exception 'Category field is too long'; end if;
 if p_category_id is null then
   insert into public.product_categories(name,slug,description,is_active,sort_order)
   values(trim(p_name),trim(p_slug),coalesce(trim(p_description),''),coalesce(p_is_active,true),coalesce(p_sort_order,100))
   returning * into result;
 else
   update public.product_categories set name=trim(p_name),slug=trim(p_slug),description=coalesce(trim(p_description),''),is_active=coalesce(p_is_active,true),sort_order=coalesce(p_sort_order,100),updated_at=now()
   where id=p_category_id returning * into result;
   if not found then raise exception 'Category not found'; end if;
 end if;
 insert into public.admin_audit_log(admin_id,action,entity_type,entity_id,metadata)
 values(auth.uid(),case when p_category_id is null then 'category.created' else 'category.updated' end,'product_category',result.id,
 jsonb_build_object('name',result.name,'slug',result.slug,'is_active',result.is_active));
 return result;
end; $$;
grant execute on function public.admin_save_product_category(uuid,text,text,text,boolean,integer) to authenticated;

-- Public homepage may read only explicitly approved public settings.
create or replace function public.get_public_site_settings()
returns table(key text,value text)
language sql stable security definer set search_path=public
as $$
  select s.key,s.value from public.site_settings s
  where s.key in ('site_name','support_phone','support_email','homepage_notice','cod_enabled')
$$;
grant execute on function public.get_public_site_settings() to anon, authenticated;
