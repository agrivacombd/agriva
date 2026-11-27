-- Remove direct PostgREST reads of buyer contact numbers.
-- Public phone sharing is intentionally disabled until a separately reviewed,
-- consent-aware server-side contact path exists.
revoke select on table public.buyer_demands from public, anon, authenticated;
revoke select (contact_phone) on table public.buyer_demands from public, anon, authenticated;

grant select (
  id,
  buyer_id,
  crop_name,
  variety,
  quantity,
  unit,
  price_type,
  target_price,
  district,
  upazila,
  delivery_method,
  need_mode,
  need_date,
  need_start_date,
  need_end_date,
  response_deadline,
  allow_partial,
  notes,
  contact_phone_public,
  status,
  created_at,
  updated_at
) on table public.buyer_demands to anon, authenticated;
