-- Cover foreign-key lookups on the newly introduced feature-control tables.
create index if not exists product_form_feature_settings_updated_by_idx
  on public.product_form_feature_settings(updated_by);
create index if not exists admin_feature_permission_grants_granted_by_idx
  on public.admin_feature_permission_grants(granted_by);
create index if not exists admin_feature_permission_grants_revoked_by_idx
  on public.admin_feature_permission_grants(revoked_by);
create index if not exists product_form_feature_audit_actor_id_idx
  on public.product_form_feature_audit(actor_id);
create index if not exists product_form_feature_audit_target_user_id_idx
  on public.product_form_feature_audit(target_user_id);
