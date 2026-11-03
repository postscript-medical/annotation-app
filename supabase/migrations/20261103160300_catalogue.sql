-- Catalogue to the launch schema (data-model §3.3). Read-only for the app; changed only by
-- reviewed SQL migrations until a separate admin project ships.
-- The join tables already have composite primary keys from the baseline.

-- Fauna ids are no longer needed (their unique constraints go with the columns).
alter table public.specialties drop column original_source_id;
alter table public.sub_specialties drop column original_source_id;
alter table public.illustrations drop column original_source_id;

-- Manual ordering inside a parent. The app sorts by (ordering, name), so with every value at 0
-- the order stays alphabetical, as in the legacy app.
alter table public.specialty_sub_specialties
  add column ordering integer not null default 0,
  add constraint specialty_sub_specialties_ordering_non_negative check (ordering >= 0);

alter table public.sub_specialty_illustrations
  add column ordering integer not null default 0,
  add constraint sub_specialty_illustrations_ordering_non_negative check (ordering >= 0);

-- The baseline's timestamp trigger functions, still used by the catalogue tables, had a mutable
-- search_path. They only call built-ins, so an empty search_path is safe.
alter function public.set_timestamps_on_insert() set search_path = '';
alter function public.set_timestamps_on_update() set search_path = '';
