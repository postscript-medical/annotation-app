-- Local test users (LOCAL STACK ONLY). Appended to supabase/seed.sql by scripts/generate-seed.sh.
-- Both are confirmed email + password users with fixed ids, so tests can refer to them.
-- The passwords are public test values and meet the policy (15+ characters).
--
--   test-user-1@example.com  /  local-test-password-one
--   test-user-2@example.com  /  local-test-password-two
--
-- Only auth.users + auth.identities are created. The app account (ensure_account) is
-- created on first sign-in, as for any real user.

do $$
declare
  u record;
begin
  for u in
    select * from (values
      ('11111111-1111-4111-8111-111111111111'::uuid, 'test-user-1@example.com', 'local-test-password-one'),
      ('22222222-2222-4222-8222-222222222222'::uuid, 'test-user-2@example.com', 'local-test-password-two')
    ) as t(id, email, password)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      -- GoTrue fails to scan NULL into these, so they must be empty strings.
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token
    ) values (
      '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
      extensions.crypt(u.password, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{}', now(), now(),
      '', '', '', '', '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), u.id, u.id::text, 'email',
      jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
      now(), now(), now()
    );
  end loop;
end
$$;
