-- Drop every legacy table (decided 2026-11-03, execution plan 1.4): the Fauna dumps (`*_raw`,
-- some hold names and email addresses), the import log, organisations and teams, and billing.
-- Only the launch schema remains. On production this runs at cutover, after the encrypted
-- rollback pg_dump; the old site stops reading Supabase at that point anyway.
-- No CASCADE: if anything unexpected still depends on these tables, the migration fails.

drop table
  public.illustration_raw,
  public.migration_failures,
  public.organization_raw,
  public.product_prices,
  public.products_raw,
  public.restricted_organization_specialties,
  public.specialty_raw,
  public.sub_specialty_raw,
  public.subscription_plan_products,
  public.subscription_plans_raw,
  public.team_raw,
  public.teams,
  public.organizations,
  public.products,
  public.subscription_plans,
  public.user_app_state_raw,
  public.user_raw;

-- Invariant data-model §5.5: no public table has a column holding an email address, a name of a
-- person, or an IP address.
do $$
declare
  offending text;
begin
  select string_agg(format('%I.%I', table_name, column_name), ', ') into offending
  from information_schema.columns
  where table_schema = 'public'
    and column_name ~ '(^|_)(email|first_name|last_name|full_name|ip|ip_address)$';
  if offending is not null then
    raise exception 'Invariant 5.5 failed: personal-data columns remain: %', offending;
  end if;
end;
$$;
