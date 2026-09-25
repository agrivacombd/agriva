-- Payment-safe marketplace order model. Run after database/marketplace.sql.
-- Adds the checkout fields used by the payment/order API.
alter table if exists marketplace_orders add column if not exists product_id uuid references products(id);
alter table if exists marketplace_orders add column if not exists farmer_id uuid references profiles(id);
alter table if exists marketplace_orders add column if not exists buyer_id uuid references profiles(id);
alter table if exists marketplace_orders add column if not exists reseller_id uuid references reseller_profiles(user_id);
alter table if exists marketplace_orders add column if not exists quantity integer;
alter table if exists marketplace_orders add column if not exists unit_price numeric(12,2);
alter table if exists marketplace_orders add column if not exists total_amount numeric(12,2);
alter table if exists marketplace_orders add column if not exists commission_percent numeric(5,2);
alter table if exists marketplace_orders add column if not exists commission_amount numeric(12,2);
alter table if exists marketplace_orders add column if not exists attribution_code text;
alter table if exists marketplace_orders add column if not exists attribution_expires_at timestamptz;
alter table if exists marketplace_orders add column if not exists payment_reference text;
alter table if exists marketplace_orders add column if not exists paid_at timestamptz;

alter table if exists reseller_commissions add column if not exists order_id uuid references marketplace_orders(id) on delete cascade;

create index if not exists marketplace_orders_buyer_idx on marketplace_orders(buyer_id, created_at desc);
create index if not exists marketplace_orders_reseller_idx on marketplace_orders(reseller_id, created_at desc);
create index if not exists marketplace_orders_status_idx on marketplace_orders(status);

-- Commission is released only after successful payment; application code should
-- move pending -> available after the configured fulfillment/hold period.
