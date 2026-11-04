-- Sign out one session from the account page (auth-spec §4.3): its policy row and the Supabase
-- session (refresh tokens cascade) go together, and only if the session belongs to the caller.
-- The server passes the caller's own users.id (from locals.profile); a session id that isn't
-- theirs changes nothing and returns false, which the app reports as 404 (auth-spec §7.3).

create function public.revoke_session(p_user_id uuid, p_session_id uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_auth_id uuid;
begin
  delete from public.session_policies as p
  where p.session_id = p_session_id
    and p.user_id = p_user_id
  returning (select u.auth_id from public.users as u where u.id = p.user_id) into v_auth_id;

  if v_auth_id is null then
    return false;
  end if;

  delete from auth.sessions as s
  where s.id = p_session_id
    and s.user_id = v_auth_id;

  return true;
end;
$$;

comment on function public.revoke_session(uuid, uuid) is
  'Ends one of the caller''s own sessions (policy row + auth session). Server only.';

revoke all on function public.revoke_session(uuid, uuid) from public, anon, authenticated;
grant execute on function public.revoke_session(uuid, uuid) to service_role;

do $$
begin
  if has_function_privilege('anon', 'public.revoke_session(uuid, uuid)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.revoke_session(uuid, uuid)', 'EXECUTE')
     or not has_function_privilege('service_role', 'public.revoke_session(uuid, uuid)', 'EXECUTE') then
    raise exception 'revoke_session has the wrong privileges';
  end if;
end;
$$;
