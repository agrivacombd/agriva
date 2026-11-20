-- Phase 1: additive schema foundation for organization-scoped Marketplace sellers.
-- Intentionally nullable: legacy products/orders are not assigned to an organization
-- without an auditable, unambiguous mapping. Authorization enforcement is a later phase.

begin;

alter table public.products
  add column if not exists seller_organization_id uuid
    references public.organizations(id) on delete restrict;

alter table public.marketplace_orders
  add column if not exists seller_organization_id uuid
    references public.organizations(id) on delete restrict;

create index if not exists products_seller_organization_id_idx
  on public.products(seller_organization_id)
  where seller_organization_id is not null;

create index if not exists marketplace_orders_seller_organization_id_idx
  on public.marketplace_orders(seller_organization_id)
  where seller_organization_id is not null;

comment on column public.products.seller_organization_id is
  'Verified seller organization responsible for this listing. Nullable for legacy rows pending explicit mapping.';
comment on column public.marketplace_orders.seller_organization_id is
  'Organization scope snapshotted from the product at checkout. Nullable only for legacy orders pending explicit mapping; new checkout flow must populate it before org-scoped enforcement.';

commit;
