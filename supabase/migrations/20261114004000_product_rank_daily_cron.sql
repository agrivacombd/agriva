-- Install and configure one DB-local daily task, without external HTTP or AI calls.
-- Cron uses PostgreSQL UTC time: 20:30 UTC = 02:30 Asia/Dhaka.
create extension if not exists pg_cron;
select cron.schedule(
  'agriva-product-rank-hybrid-maintenance',
  '30 20 * * *',
  'select public.maintain_product_rank_history();'
);
