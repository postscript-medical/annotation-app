-- Fixed-window rate-limit counter for src/lib/server/rate-limit.ts (auth-spec §6).
-- Keys are HMAC hashes made by the server; these functions never see an email, IP or user id.
-- Windows are aligned to the Unix epoch (e.g. 15-minute windows start at :00, :15, :30, :45 UTC),
-- so a burst across a boundary can reach twice the limit; acceptable for these limits.
-- Rows are deleted after 24 hours by purge_rate_limits (pg_cron).

-- Start of the current window for a window length in seconds.
create function public.rate_limit_window_start(p_window_seconds integer)
returns timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  select to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );
$$;

-- Adds one to the key's counter in the current window and returns the new count.
create function public.rate_limit_hit(p_key text, p_window_seconds integer)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if p_window_seconds is null or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'p_window_seconds must be between 1 and 86400' using errcode = '22023';
  end if;

  insert into public.rate_limits as r (key, window_start, count)
  values (p_key, public.rate_limit_window_start(p_window_seconds), 1)
  on conflict (key, window_start) do update set count = r.count + 1
  returning r.count into v_count;

  return v_count;
end;
$$;

-- The key's count in the current window, without changing it (0 if none).
create function public.rate_limit_count(p_key text, p_window_seconds integer)
returns integer
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_window_seconds is null or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'p_window_seconds must be between 1 and 86400' using errcode = '22023';
  end if;

  return coalesce((
    select r.count
    from public.rate_limits as r
    where r.key = p_key
      and r.window_start = public.rate_limit_window_start(p_window_seconds)
  ), 0);
end;
$$;

revoke all on function public.rate_limit_window_start(integer) from public, anon, authenticated;
revoke all on function public.rate_limit_hit(text, integer) from public, anon, authenticated;
revoke all on function public.rate_limit_count(text, integer) from public, anon, authenticated;

grant execute on function public.rate_limit_hit(text, integer) to service_role;
grant execute on function public.rate_limit_count(text, integer) to service_role;

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
end;
$$;
