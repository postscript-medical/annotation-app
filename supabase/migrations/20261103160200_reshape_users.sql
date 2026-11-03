-- Reshape users and user_app_states to the launch schema (data-model §3.1, §3.2).
--
-- This is also the cutover data migration (data-model §7, steps 2–7). On production it runs
-- AFTER scripts/cutover/create-auth-users.ts has created a Supabase Auth account for every kept
-- user and set users.auth_id; that script needs users.email and users.netlify_id, dropped here.
-- On local and staging the user tables are empty, so the data steps do nothing.

-- §7 step 2: remove accounts that aren't kept (no Supabase Auth account). App states cascade.
delete from public.users where auth_id is null;

-- §7 steps 3 and 6: no role mapping; drop personal, legacy and billing columns.
drop trigger set_users_timestamps on public.users;
drop trigger update_users_updated_at on public.users;

alter table public.users
  drop column email,
  drop column first_name,
  drop column last_name,
  drop column role,
  drop column show_tutorial,
  drop column netlify_id,
  drop column team_id,
  drop column original_source_id,
  drop column updated_at;

-- The unique constraint below replaces the plain index on auth_id.
drop index public.idx_users_auth_id;

-- users_auth_id_fkey (references auth.users on delete cascade) is kept from the baseline.
alter table public.users
  alter column auth_id set not null,
  add constraint users_auth_id_key unique (auth_id),
  alter column created_at set default now();

-- §7 step 5: one app state per user, keyed by user_id; keep the latest if there are duplicates.
drop trigger set_user_app_states_timestamps on public.user_app_states;
drop trigger update_user_app_states_updated_at on public.user_app_states;

delete from public.user_app_states as s
using (
  select
    id,
    row_number() over (
      partition by user_id
      order by updated_at desc, created_at desc, id desc
    ) as rn
  from public.user_app_states
) as ranked
where s.id = ranked.id
  and ranked.rn > 1;

alter table public.user_app_states
  drop constraint user_app_states_pkey,
  drop column id,
  drop column original_source_id,
  drop column created_at,
  drop column updated_at;

-- The primary key below replaces the plain index on user_id.
drop index public.idx_user_app_states_user_id;

alter table public.user_app_states
  add constraint user_app_states_pkey primary key (user_id);

insert into public.user_app_states (user_id)
select u.id
from public.users as u
where not exists (select 1 from public.user_app_states as s where s.user_id = u.id);

-- §7 step 4: a personal workspace and an owner membership for every user.
insert into public.workspaces (kind, personal_owner_id)
select 'personal', u.id
from public.users as u
where not exists (select 1 from public.workspaces as w where w.personal_owner_id = u.id);

insert into public.workspace_members (workspace_id, user_id, role)
select w.id, w.personal_owner_id, 'owner'
from public.workspaces as w
where w.kind = 'personal'
on conflict (workspace_id, user_id) do nothing;

-- §7 step 7: invariants data-model §5.1–5.3. Any failure aborts this migration.
do $$
declare
  failures integer;
begin
  -- §5.1 every user has exactly one app state (the primary key rules out more than one).
  select count(*) into failures
  from public.users as u
  where not exists (select 1 from public.user_app_states as s where s.user_id = u.id);
  if failures > 0 then
    raise exception 'Invariant 5.1 failed: % users without an app state', failures;
  end if;

  -- §5.2 every user has at least one membership.
  select count(*) into failures
  from public.users as u
  where not exists (select 1 from public.workspace_members as m where m.user_id = u.id);
  if failures > 0 then
    raise exception 'Invariant 5.2 failed: % users without a membership', failures;
  end if;

  -- §5.3 a personal workspace has exactly one member: its owner, with role owner.
  select count(*) into failures
  from public.workspaces as w
  where w.kind = 'personal'
    and (
      (select count(*) from public.workspace_members as m where m.workspace_id = w.id) <> 1
      or not exists (
        select 1
        from public.workspace_members as m
        where m.workspace_id = w.id
          and m.user_id = w.personal_owner_id
          and m.role = 'owner'
      )
    );
  if failures > 0 then
    raise exception 'Invariant 5.3 failed: % personal workspaces with the wrong membership', failures;
  end if;
end;
$$;
