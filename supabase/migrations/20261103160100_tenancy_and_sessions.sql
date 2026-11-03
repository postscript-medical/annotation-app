-- Workspaces, memberships, session policies and rate limits (data-model §3.1, §3.4).
-- Server-only tables: RLS on with no policies; grants are revoked in the lock-down migration.

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  kind public.workspace_kind not null default 'personal',
  name text,
  personal_owner_id uuid unique references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint workspaces_personal_owner_matches_kind
    check ((kind = 'personal') = (personal_owner_id is not null)),
  constraint workspaces_name_required_unless_personal
    check (kind = 'personal' or name is not null),
  constraint workspaces_name_length
    check (name is null or char_length(name) between 1 and 200)
);

comment on table public.workspaces is
  'The tenant. One personal workspace per user at launch; organisations later (data-model §6.1).';

alter table public.workspaces enable row level security;

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role public.workspace_role not null,
  created_at timestamptz not null default now(),
  constraint workspace_members_pkey primary key (workspace_id, user_id)
);

-- No unique constraint on user_id: multi-workspace membership later needs no schema change.
create index workspace_members_user_id_idx on public.workspace_members (user_id);

alter table public.workspace_members enable row level security;

create table public.session_policies (
  -- The Supabase JWT `session_id` claim.
  session_id uuid primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  mode public.session_mode not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  -- Set only by the /auth/confirm POST for a recovery link; cleared after the reset (auth-spec §2).
  recovery_verified_at timestamptz
);

create index session_policies_user_id_idx on public.session_policies (user_id);
create index session_policies_created_at_idx on public.session_policies (created_at);

alter table public.session_policies enable row level security;

create table public.rate_limits (
  -- HMAC-hashed key, e.g. `signin:email:<hash>` (auth-spec §6). Never a raw email or IP.
  key text not null,
  window_start timestamptz not null,
  count integer not null default 1,
  constraint rate_limits_pkey primary key (key, window_start),
  constraint rate_limits_key_length check (char_length(key) between 1 and 200),
  constraint rate_limits_count_positive check (count >= 1)
);

create index rate_limits_window_start_idx on public.rate_limits (window_start);

alter table public.rate_limits enable row level security;
