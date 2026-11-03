-- Server-only access (data-model §1.5; fixes S20 from architecture-baseline).
-- RLS on every public table with no policies, and no table, sequence or function privileges for
-- `anon` or `authenticated`. Only the server, with the secret key (service_role), reads or writes.

alter table public.users enable row level security;
alter table public.user_app_states enable row level security;
alter table public.specialties enable row level security;
alter table public.sub_specialties enable row level security;
alter table public.illustrations enable row level security;
alter table public.specialty_sub_specialties enable row level security;
alter table public.sub_specialty_illustrations enable row level security;
-- workspaces, workspace_members, session_policies and rate_limits: enabled when created.

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

-- Objects created later by migrations (owned by postgres) get no grants for the API roles either.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on functions from public, anon, authenticated;

-- The unused `avatars` bucket and its two open policies (supabase-baseline-notes.md).
drop policy if exists "Anyone can upload an avatar." on storage.objects;
drop policy if exists "Avatar images are publicly accessible." on storage.objects;

do $$
begin
  if exists (select 1 from storage.objects where bucket_id = 'avatars') then
    raise exception 'The avatars bucket is not empty; check its contents before deleting it.';
  end if;
  -- Storage blocks direct deletes unless this is set for the transaction.
  perform set_config('storage.allow_delete_query', 'true', true);
  delete from storage.buckets where id = 'avatars';
end;
$$;

-- Assert the end state.
do $$
declare
  offending text;
begin
  select string_agg(c.relname, ', ') into offending
  from pg_class as c
  where c.relnamespace = 'public'::regnamespace
    and c.relkind in ('r', 'p')
    and not c.relrowsecurity;
  if offending is not null then
    raise exception 'RLS is off on: %', offending;
  end if;

  select string_agg(c.relname, ', ') into offending
  from pg_class as c
  where c.relnamespace = 'public'::regnamespace
    and c.relkind in ('r', 'p', 'v', 'm')
    and (
      has_table_privilege('anon', c.oid, 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
      or has_table_privilege('authenticated', c.oid, 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
    );
  if offending is not null then
    raise exception 'anon or authenticated still has privileges on: %', offending;
  end if;
end;
$$;
