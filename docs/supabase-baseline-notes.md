# Supabase baseline notes (step 0.1)

Recorded 2026-11-02. Source for [migration-execution-plan.md](migration-execution-plan.md) steps 0.1–0.3 and the cutover (3.5–3.7).

## Projects

| Name | Ref | Region | Created | Used by |
|---|---|---|---|---|
| Production | `iszvvxyspowcbcbynoht` | eu-west-2 | 2025-05-15 | Live site (built from `main`); its `SUPABASE_DATABASE_URL` points here |
| Staging | `vqwulukmgqifavsvtwcp` | eu-west-2 | 2025-03-27 | Second Netlify site (`migration-sveltekit`); the CLI is linked here |

Both run Postgres 15. Production is touched only by the user, or read-only with the user's say-so.

## How production works today

`main` does **not** use Supabase Auth:

- **Sign-in is Netlify Identity.** Functions get the user from `context.clientContext.user` (`sub` = Netlify id). Passwords live in Netlify Identity, not Supabase.
- **Most functions still use FaunaDB** (`faunadb` clients in `get-illustrations`, `get-management-data`, `delete-team-member` and others).
- **`get-protected-content` reads Supabase** `user_raw` and `user_app_state_raw` (Fauna dumps) with the **anon key**, matching on `data.data.netlifyID`.
- Production `auth.users` is empty. `public.users` has 207 rows.

The Supabase Auth and normalised-table work (`functions/auth-*.js`, `accept-team-invitation.js`, `functions/methods/supabase-*.js`, the reshaped front end) exists only in the ~20 commits on `migration-sveltekit` after `02a9c1c` and has only ever run against staging. It never shipped.

Consequence: existing users can't keep their passwords. At cutover each kept user gets a new Supabase Auth account and sets a password through "Forgot password" (plan scope change 4, 3.6, 3.7).

## Baseline migration

- `supabase/migrations/20261102172256_remote_schema.sql` (773 lines, 24 public tables), pulled from **staging**. The user confirmed staging's schema matches production, so it stands as the baseline. Production was not diffed against it.
- Staging's migration history already lists `20261102172256` as applied, so 0.2 has nothing to push.

## RLS and grants (staging)

> **Fixed on staging 2026-11-03** by the 1.4 migrations (`_lock_down`): RLS is on for all 11 remaining public tables, `anon` and `authenticated` have no privileges, and the `avatars` policies and bucket are gone. The 17 legacy tables were dropped. The notes below describe the baseline, which production still matches until cutover.

- RLS is **off** on all 24 public tables, with **no policies** on them.
- `anon` and `authenticated` have **full privileges** (`SELECT`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`) on all 24 tables (the baseline's `GRANT … TO "anon", "authenticated"` lines; confirmed with `has_table_privilege`). With RLS off, **anyone holding the anon key can read, change or empty every table** through the REST API. (An earlier check said "no grants": that query used `information_schema.role_table_grants`, which only shows grants visible to the querying role, and the CLI's read-only role sees none.)
- Two policies on `storage.objects` let **anyone upload to and read from the `avatars` bucket** (`TO PUBLIC`). The bucket is private, empty and unused by the app.
- Exposure is limited because **neither `main` nor this branch puts the anon key in the browser**: it's only in Netlify environment variables for the functions. Supabase treats the anon key as public, though, so this is S20 in practice: the new schema must revoke these grants as well as turning RLS on (1.4 step 5), and drop the avatar policies.
- **Production not checked.** The schema matches staging, so production very likely has the same grants, over its 207 `users` rows and the `*_raw` copies. One read-only query in the production SQL editor confirms it: `select count(*) filter (where has_table_privilege('anon', c.oid, 'SELECT')) from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind = 'r';`

## Staging data after the wipe

At the user's request (2026-11-02) all user data on staging was deleted in one transaction, because it mixed real and test users:

| Deleted | Rows |
|---|---|
| `auth.users` (with identities, 39 sessions, refresh and one-time tokens) | 57 |
| `public.users`, `public.user_app_states` | 50 each |
| `public.organizations` (with `teams`) | 43 each |
| `user_raw`, `organization_raw`, `team_raw`, `user_app_state_raw` | 32 each |
| `auth.audit_log_entries` (staging only; the production keep-the-log rule is unchanged) | 266 |

Kept: catalogue (3 specialties, 9 sub-specialties, 106 illustrations, 183 links and their `*_raw` copies), products, prices and subscription plans, and the schema. All user-data counts were checked at 0 afterwards.

## Staging Auth settings

From `supabase config diff` (remote values; anything not listed matches the default local `config.toml`):

| Setting | Staging | Note for later steps |
|---|---|---|
| `site_url` | `https://staging.app.postscriptmedical.com` | Matches G1 |
| `additional_redirect_urls` | none | Set in 1.10 |
| Confirm email (`enable_confirmations`) | on | As planned |
| `minimum_password_length` | Not actually known: `config diff` doesn't report this setting (found in 0.3), so "matches local 6" was an inference. Set to 15 in the staging dashboard on 2026-11-02 and confirmed by probe. | Keep 15 in `config.toml` from 1.10 |
| `otp_expiry` | 86400 s (24 h) | Review in 1.10 (recovery links) |
| Email `max_frequency` | 1 min | |
| Custom SMTP | on: Postmark (`smtp.postmarkapp.com:587`), sender `no-reply@postscriptmedical.com` / "PostScript" | Replaced by Lettermint in 0.6 |
| MFA TOTP enrol/verify | on | Unused by the new app; decide in 1.10 whether to switch off |
| SMS confirmations | on (SMS provider not set up) | Switch off in 1.10 |
| SSL enforcement | on | |
| `db.major_version` | 15 (local `config.toml` says 17) | Set local to 15 in 0.7 so the local stack matches |

Not compared by the CLI: the email rate limit (`auth.rate_limit.email_sent`) and network restrictions. Check them in the dashboard in 0.3.
