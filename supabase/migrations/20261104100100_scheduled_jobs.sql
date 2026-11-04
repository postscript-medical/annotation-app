-- Retention jobs (data-protection §6), run by pg_cron inside Postgres as postgres.
-- pg_cron is in shared_preload_libraries on hosted Supabase and in the local image; on Supabase
-- it is installed into pg_catalog (its objects live in the `cron` schema either way).
-- Times are UTC, staggered so the jobs don't start together. cron.schedule with a job name
-- updates the existing job, so re-running this is safe.

create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'purge-rate-limits',
  '7 * * * *',
  'select public.purge_rate_limits()'
);

select cron.schedule(
  'purge-unconfirmed-signups',
  '17 3 * * *',
  'select public.purge_unconfirmed_signups()'
);

select cron.schedule(
  'purge-expired-sessions',
  '27 3 * * *',
  'select public.purge_expired_sessions()'
);

-- The Supabase auth audit log is kept and deliberately not purged (auth-spec §2).

do $$
declare
  v_count integer;
begin
  select count(*) into v_count
  from cron.job
  where jobname in ('purge-rate-limits', 'purge-unconfirmed-signups', 'purge-expired-sessions')
    and active;
  if v_count <> 3 then
    raise exception 'Expected 3 active retention jobs, found %', v_count;
  end if;
end;
$$;
