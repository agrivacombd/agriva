-- AGRIVA search tracking RPC
-- Keeps aggregation server-side and avoids exposing an unrestricted write endpoint.
create or replace function public.track_search(p_query text, p_session_id text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare cleaned text; normalized text; uid uuid;
begin
  cleaned := regexp_replace(trim(coalesce(p_query,'')), '\s+', ' ', 'g');
  if length(cleaned) < 2 or length(cleaned) > 200 then return; end if;
  normalized := lower(cleaned);
  uid := auth.uid();
  insert into public.search_queries(query,normalized_query,user_id,session_id,search_count,first_seen_at,last_seen_at)
  values(cleaned,normalized,uid,p_session_id,1,now(),now())
  on conflict (normalized_query) do update set
    query=excluded.query,
    search_count=public.search_queries.search_count+1,
    last_seen_at=now();
end;
$$;
grant execute on function public.track_search(text,text) to anon, authenticated;
comment on function public.track_search is 'Aggregates non-sensitive site-search demand. AI opportunity generation is intentionally separate from the tracking write path.';
