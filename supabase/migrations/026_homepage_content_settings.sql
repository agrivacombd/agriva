-- AGRIVA homepage content settings managed from Super Admin.
insert into public.site_settings(key,value,description) values
 ('homepage_hero_title','কৃষির প্রতিটি ধাপে আপনার পাশে AGRIVA.','Main homepage hero headline'),
 ('homepage_hero_subtitle','বীজ ও কৃষি উপকরণ খুঁজুন, ফসলের বিষয়ে সহায়তা নিন, নিজের খামারের হিসাব রাখুন—কৃষির প্রয়োজনীয় ডিজিটাল টুলস এক জায়গায়, সহজ বাংলায়।','Main homepage hero description')
on conflict (key) do nothing;

create or replace function public.admin_update_site_setting(p_key text,p_value text)
returns public.site_settings
language plpgsql security definer set search_path=public
as $$
declare result public.site_settings;
begin
 if auth.uid() is null or not public.is_admin() then raise exception 'Admin role required'; end if;
 if p_key not in ('site_name','support_phone','support_email','homepage_notice','homepage_hero_title','homepage_hero_subtitle','cod_enabled','online_payment_enabled') then raise exception 'Setting key is not editable'; end if;
 if p_value is null or length(p_value)>1000 then raise exception 'Invalid setting value'; end if;
 if p_key in ('cod_enabled','online_payment_enabled') and p_value not in ('true','false') then raise exception 'Boolean setting must be true or false'; end if;
 if p_key in ('site_name','homepage_hero_title') and length(trim(p_value))=0 then raise exception 'Required setting cannot be empty'; end if;
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

create or replace function public.get_public_site_settings()
returns table(key text,value text)
language sql stable security definer set search_path=public
as $$
  select s.key,s.value from public.site_settings s
  where s.key in ('site_name','support_phone','support_email','homepage_notice','homepage_hero_title','homepage_hero_subtitle','cod_enabled')
$$;
grant execute on function public.get_public_site_settings() to anon, authenticated;
