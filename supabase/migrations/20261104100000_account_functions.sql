-- Account and retention functions (data-model §4).
-- All are `security definer` with an empty search_path, so every name is schema-qualified.
-- Only the server (service_role, secret key) may call them; pg_cron runs the purges as their
-- owner (postgres). See the scheduled_jobs migration.

-- Creates the app account for a verified Supabase Auth user: the users row, a personal workspace,
-- the owner membership and the app state. Idempotent, and safe when two requests call it at once:
-- the users insert is `on conflict do nothing`, and the row lock below serialises the rest per user.
-- If the user exists but has no memberships (e.g. after leaving an organisation, data-model §6.1),
-- a fresh personal workspace is created.
create function public.ensure_account(p_auth_id uuid)
returns public.users
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user public.users;
  v_workspace_id uuid;
begin
  if p_auth_id is null then
    raise exception 'p_auth_id is required' using errcode = '22004';
  end if;

  -- Fails with a foreign key violation (23503) if there is no such auth.users row.
  insert into public.users (auth_id)
  values (p_auth_id)
  on conflict (auth_id) do nothing;

  select u.* into strict v_user
  from public.users as u
  where u.auth_id = p_auth_id
  for update;

  insert into public.user_app_states (user_id)
  values (v_user.id)
  on conflict (user_id) do nothing;

  if not exists (select 1 from public.workspace_members as m where m.user_id = v_user.id) then
    insert into public.workspaces (kind, personal_owner_id)
    values ('personal', v_user.id)
    on conflict (personal_owner_id) do nothing
    returning id into v_workspace_id;

    -- A personal workspace without its owner's membership breaks invariant 5.3; repair it.
    if v_workspace_id is null then
      select w.id into strict v_workspace_id
      from public.workspaces as w
      where w.personal_owner_id = v_user.id;
    end if;

    insert into public.workspace_members (workspace_id, user_id, role)
    values (v_workspace_id, v_user.id, 'owner')
    on conflict (workspace_id, user_id) do nothing;
  end if;

  return v_user;
end;
$$;

comment on function public.ensure_account(uuid) is
  'Creates (or repairs) the app account for a verified auth user. Idempotent. Server only.';

-- Everything we hold about one person, for "Download my data" (auth-spec §4.3).
-- Email and auth timestamps from auth.users (never the password hash or tokens), the account,
-- workspaces and roles, app state, and sessions (mode and timestamps only).
-- Returns null if there is no such auth user.
create function public.export_account(p_auth_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'exported_at', now(),
    'login', jsonb_build_object(
      'email', a.email,
      'created_at', a.created_at,
      'email_confirmed_at', a.email_confirmed_at,
      'last_sign_in_at', a.last_sign_in_at
    ),
    'account', case when u.id is null then null else jsonb_build_object(
      'id', u.id,
      'created_at', u.created_at
    ) end,
    'workspaces', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', w.id,
          'kind', w.kind,
          'name', w.name,
          'personal', w.personal_owner_id = u.id,
          'role', m.role,
          'created_at', w.created_at,
          'joined_at', m.created_at
        )
        order by m.created_at
      )
      from public.workspace_members as m
      join public.workspaces as w on w.id = m.workspace_id
      where m.user_id = u.id
    ), '[]'::jsonb),
    'app_state', (
      select jsonb_build_object(
        'selected_specialty', case when sp.id is null then null
          else jsonb_build_object('id', sp.id, 'name', sp.name) end,
        'selected_sub_specialty', case when ss.id is null then null
          else jsonb_build_object('id', ss.id, 'name', ss.name) end,
        'selected_illustration', case when il.id is null then null
          else jsonb_build_object('id', il.id, 'name', il.name) end
      )
      from public.user_app_states as s
      left join public.specialties as sp on sp.id = s.selected_specialty_id
      left join public.sub_specialties as ss on ss.id = s.selected_sub_specialty_id
      left join public.illustrations as il on il.id = s.selected_illustration_id
      where s.user_id = u.id
    ),
    'sessions', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'mode', p.mode,
          'created_at', p.created_at,
          'last_seen_at', p.last_seen_at
        )
        order by p.created_at
      )
      from public.session_policies as p
      where p.user_id = u.id
    ), '[]'::jsonb)
  )
  from auth.users as a
  left join public.users as u on u.auth_id = a.id
  where a.id = p_auth_id;
$$;

comment on function public.export_account(uuid) is
  'JSON export of everything held about one person (rights of access and portability). Server only.';

-- Sign-ups never confirmed within 24 hours (data-protection §6). The auth.* children
-- (identities, one-time tokens, sessions) cascade. Confirmed users, including the passwordless
-- accounts created at cutover (email_confirm: true), are never touched.
create function public.purge_unconfirmed_signups()
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  delete from auth.users
  where email_confirmed_at is null
    and created_at < now() - interval '24 hours';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

comment on function public.purge_unconfirmed_signups() is
  'Deletes auth users unconfirmed for more than 24 hours. Run nightly by pg_cron.';

-- Session policies past their absolute lifetime (auth-spec §5: 8 h shared, 30 d personal) and
-- the matching Supabase sessions, whose refresh tokens cascade. Also Supabase sessions more than
-- a day old that never got a policy row (e.g. the policy insert failed after sign-in): the hook
-- already refuses them, so this only removes dead data. Returns policies + orphans deleted.
create function public.purge_expired_sessions()
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_deleted integer;
  v_orphans integer;
begin
  with expired as (
    delete from public.session_policies
    where (mode = 'shared' and created_at < now() - interval '8 hours')
       or (mode = 'personal' and created_at < now() - interval '30 days')
    returning session_id
  ),
  sessions as (
    delete from auth.sessions as s
    using expired as e
    where s.id = e.session_id
  )
  select count(*) into v_deleted from expired;

  -- A separate statement, so it sees the policy deletes above. The one-day margin keeps a
  -- sign-in that is still between creating its session and inserting its policy row safe.
  delete from auth.sessions as s
  where s.created_at < now() - interval '1 day'
    and not exists (select 1 from public.session_policies as p where p.session_id = s.id);
  get diagnostics v_orphans = row_count;

  return v_deleted + v_orphans;
end;
$$;

comment on function public.purge_expired_sessions() is
  'Deletes session policies past their absolute lifetime, their auth.sessions, and auth.sessions '
  'older than a day with no policy. Run nightly by pg_cron.';

-- Rate-limit counters older than 24 hours (auth-spec §6).
create function public.purge_rate_limits()
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  delete from public.rate_limits
  where window_start < now() - interval '24 hours';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

comment on function public.purge_rate_limits() is
  'Deletes rate-limit rows older than 24 hours. Run hourly by pg_cron.';

-- Execute for the server only. Default privileges (lock_down) already withhold it from the API
-- roles; this makes the intent explicit and doesn't depend on them.
revoke all on function public.ensure_account(uuid) from public, anon, authenticated;
revoke all on function public.export_account(uuid) from public, anon, authenticated;
revoke all on function public.purge_unconfirmed_signups() from public, anon, authenticated;
revoke all on function public.purge_expired_sessions() from public, anon, authenticated;
revoke all on function public.purge_rate_limits() from public, anon, authenticated;

grant execute on function public.ensure_account(uuid) to service_role;
grant execute on function public.export_account(uuid) to service_role;
grant execute on function public.purge_unconfirmed_signups() to service_role;
grant execute on function public.purge_expired_sessions() to service_role;
grant execute on function public.purge_rate_limits() to service_role;

-- Assert the end state: no function in public is callable by anon or authenticated, and the
-- service role can call each of the five.
do $$
declare
  offending text;
begin
  select string_agg(p.oid::regprocedure::text, ', ') into offending
  from pg_proc as p
  where p.pronamespace = 'public'::regnamespace
    and (
      has_function_privilege('anon', p.oid, 'EXECUTE')
      or has_function_privilege('authenticated', p.oid, 'EXECUTE')
    );
  if offending is not null then
    raise exception 'anon or authenticated can execute: %', offending;
  end if;

  select string_agg(f, ', ') into offending
  from unnest(array[
    'public.ensure_account(uuid)',
    'public.export_account(uuid)',
    'public.purge_unconfirmed_signups()',
    'public.purge_expired_sessions()',
    'public.purge_rate_limits()'
  ]) as f
  where not has_function_privilege('service_role', f::regprocedure, 'EXECUTE')
     or not (select prosecdef from pg_proc where oid = f::regprocedure);
  if offending is not null then
    raise exception 'Not security definer or not executable by service_role: %', offending;
  end if;
end;
$$;
