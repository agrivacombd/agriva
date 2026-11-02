-- Extend the identity-application and module-grant catalogs for employer verification.
-- Existing transport applications already use the transport_partner applicant type.
alter table public.module_access_applications
 drop constraint if exists module_access_applications_module_check,
 drop constraint if exists module_access_applications_applicant_type_check,
 drop constraint if exists module_access_applicant_type_matches_module;
alter table public.module_access_applications
 add constraint module_access_applications_module_check
 check (module in ('plant_market','marketplace','sell_harvest','transport','farm_management','employer')),
 add constraint module_access_applications_applicant_type_check
 check (applicant_type in ('gardener','business','farmer','transport_partner','farm_operator','employer')),
 add constraint module_access_applicant_type_matches_module
 check (
  (module='plant_market' and applicant_type='gardener')
  or (module='marketplace' and applicant_type='business')
  or (module='sell_harvest' and applicant_type='farmer')
  or (module='transport' and applicant_type='transport_partner')
  or (module='farm_management' and applicant_type='farm_operator')
  or (module='employer' and applicant_type='employer')
 );
alter table public.user_module_grants
 drop constraint if exists user_module_grants_module_check;
alter table public.user_module_grants
 add constraint user_module_grants_module_check
 check (module in ('plant_market','marketplace','sell_harvest','buyer_demands','transport','farm_management','employer'));
comment on constraint module_access_applicant_type_matches_module on public.module_access_applications
 is 'Binds employer and transport identity applications to their respective module identities.';
