-- AGRIVA immutable payout settlement helpers.
create or replace function public.approve_commission_payout(p_payout_id uuid)
returns public.commission_payouts language plpgsql security definer set search_path=public as $$
declare p public.commission_payouts;
begin
 if not public.is_admin() then raise exception 'Admin role required'; end if;
 update public.commission_payouts set status='approved',approved_at=now(),approved_by=auth.uid() where id=p_payout_id and status='requested' returning * into p;
 if not found then raise exception 'Payout not found or already processed'; end if;
 return p;
end;$$;
grant execute on function public.approve_commission_payout(uuid) to authenticated;

create or replace function public.complete_commission_payout(p_payout_id uuid,p_payment_reference text)
returns public.commission_payouts language plpgsql security definer set search_path=public as $$
declare p public.commission_payouts; remaining numeric; c record;
begin
 if not public.is_admin() then raise exception 'Admin role required'; end if;
 select * into p from public.commission_payouts where id=p_payout_id for update;
 if not found or p.status not in ('approved','requested') then raise exception 'Payout is not payable'; end if;
 if p.status='requested' then update public.commission_payouts set status='approved',approved_at=now(),approved_by=auth.uid() where id=p.id; end if;
 remaining:=p.amount;
 for c in select id,amount from public.reseller_commissions where reseller_id=p.reseller_id and status='approved' order by created_at asc,id asc for update loop
   exit when remaining<=0;
   if c.amount<=remaining then update public.reseller_commissions set status='paid',updated_at=now() where id=c.id; remaining:=remaining-c.amount; end if;
 end loop;
 if remaining>0 then raise exception 'Insufficient approved commission balance'; end if;
 update public.commission_payouts set status='paid',paid_at=now(),payment_reference=p_payment_reference where id=p.id returning * into p;
 return p;
end;$$;
grant execute on function public.complete_commission_payout(uuid,text) to authenticated;
