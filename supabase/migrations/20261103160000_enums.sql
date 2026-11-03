-- Launch enums (data-model §2.1).
-- `organization` exists from the start so promoting a personal workspace needs no ALTER TYPE.

create type public.workspace_kind as enum ('personal', 'organization');

create type public.workspace_role as enum ('owner', 'member');

create type public.session_mode as enum ('personal', 'shared');
