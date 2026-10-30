-- Cover the composite owner/plant foreign key used by garden activity logs.
create index if not exists garden_activity_logs_plant_owner_idx
  on public.garden_activity_logs (plant_id, owner_id);
