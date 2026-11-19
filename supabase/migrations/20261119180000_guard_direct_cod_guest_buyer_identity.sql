-- Apply the same buyer-only anonymous identity guard to direct single-product COD orders.
-- Cart checkout already runs this guard through marketplace_checkouts; direct COD
-- writes marketplace_orders without creating a marketplace_checkouts row.
begin;

drop trigger if exists marketplace_order_require_guest_buyer
  on public.marketplace_orders;

create trigger marketplace_order_require_guest_buyer
before insert on public.marketplace_orders
for each row
execute function public.require_guest_checkout_buyer_identity();

commit;
