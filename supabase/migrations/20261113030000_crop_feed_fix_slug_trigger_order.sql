-- PostgreSQL executes triggers of the same kind in name order.
-- Canonicalize the diagnosis and account name before computing the slug.
drop trigger if exists crop_feed_assign_slug_before_insert on public.crop_health_feed;
create trigger zz_crop_feed_assign_slug_before_insert before insert on public.crop_health_feed
for each row execute function public.crop_feed_assign_slug();
-- Reserve the slug permanently; existing slugs cannot be overwritten.
