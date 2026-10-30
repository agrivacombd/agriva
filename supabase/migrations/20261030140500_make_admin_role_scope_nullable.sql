-- Dropping a composite primary key does not remove the NOT NULL attribute
-- it placed on each key column. Global assignments require NULL scope_id.
alter table public.admin_user_roles
  alter column scope_id drop not null;
