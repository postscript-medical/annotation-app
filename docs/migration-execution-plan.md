# Execution plan: SvelteKit + Supabase migration

## Context

[migration-plan.md](migration-plan.md) (with [auth-spec](auth-spec.md), [data-model](data-model.md), [data-protection](data-protection.md)) defines *what* the new app is: free, individual-first, device-only sharing, SvelteKit (Svelte 5, TS) on a new Netlify site, Supabase eu-west-2, free tiers, no hot fixes to production. This file turns its phases into an ordered list of small, shippable steps (each ≈ one commit/PR on `migration-sveltekit`), with decision gates and checks. Every step ends green: lint → typecheck → unit → integration → build → E2E, plus a push to `migration-sveltekit`, which deploys the second Netlify site automatically.

Current repo state: Svelte 3 + Rollup in `src/`, 33 Netlify functions in `functions/`, seed data in `db/`, Playwright E2E + component tests in `playwright/`, one workflow `.github/workflows/playwright.yml` (runs against a Netlify preview). `supabase/` initialised and linked to staging, with the baseline migration (0.1).

**What production really runs** (found in 0.1, details in [supabase-baseline-notes.md](supabase-baseline-notes.md)): `main` signs users in with **Netlify Identity**, most functions still use **FaunaDB**, and user data is read from the Supabase `*_raw` tables with the anon key. Production `auth.users` is empty. The Supabase Auth work in `functions/auth-*.js` exists only in the unreleased commits on this branch (after `02a9c1c`) and has only run against staging.

## Working rules

- **Claude never commits or pushes.** Claude makes the changes and reports them; you review, commit and push.
- **One step at a time.** Claude does a single numbered step (e.g. 1.4), reports what changed and how it was checked, then stops.
- **Phase boundaries need your go-ahead.** Claude doesn't start the next phase until you've committed the current one and confirmed.
- Anything that touches the production Supabase project, DNS, Lettermint, Netlify settings or Stripe is done by you, or by Claude only when you explicitly ask, step by step.

## Before Phase 0: what you need to do

| # | Action | Why / used in |
|---|---|---|
| P1 | ✅ Commit the current state: the `package.json` version bump and `docs/migration-execution-plan.md` | Clean starting point for 0.1 |
| P2 | ✅ Start Docker and make sure your user can reach it (`docker info` works without sudo) | `supabase start` for the local stack (0.7) and integration tests |
| P3 | ✅ Install the Supabase CLI (`npm i -D supabase` in 1.1, or a global install now) and run `supabase login` yourself | Linking projects (0.1, 0.2). The login is interactive; Claude can't do it. |
| P4 | ✅ Project refs: production `iszvvxyspowcbcbynoht`, staging `vqwulukmgqifavsvtwcp` (linked). Database passwords are typed by you when `supabase link` asks, never pasted into chat. | 0.1, 0.2 |
| P5 | ✅ Create the Lettermint account and sign its DPA; add its DNS records in Netlify DNS for `postscriptmedical.com` (domain verified in Lettermint, 2026-11-02) | 0.6 |
| P6 | In Netlify, add `staging.app.postscriptmedical.com` as the second site's custom domain, plus the DNS record | 0.6, 1.10, 1.14 |
| P7 | Secrets in the second Netlify site as each step asks (Supabase URL and keys, `RATE_LIMIT_HMAC_SECRET`, Lettermint SMTP). Claude will list them in the step that needs them. | 1.7 onwards |

Later (not blocking Phase 0): controller legal entity (G3) before `/privacy` is final; an `age` key pair for backups, held outside GitHub (3.3); Stripe dashboard access for the cutover (3.7).

## Scope changes agreed in this planning session

1. **Email provider: Lettermint** (EU-based, better fit for GDPR). Replaces open question §11.1.
2. **No staff/admin role in this migration.** Everything to do with `dm`, staff, `platform_role`, `requireStaff`, the `(admin)` route group and **everything under `/admin/**`** (specialties, sub-specialties, illustrations pages and actions), `admin_audit` and the catalogue admin UI is **removed** from this migration. The new app has no `/admin` routes at all; a request there is a plain 404. PostScript admin controls are a separate future body of work.
   - Every existing user (legacy `user`, `admin`, `dm`) becomes a plain user with a personal workspace.
   - Org/group roles stay on the **workspace** axis only (`workspace_members.role`: `owner` | `member`, later more), so organisations and groups (DM §6) remain additive.
   - Until the admin project ships, the catalogue (specialties, sub-specialties, illustrations) is changed **only by SQL migrations** in `supabase/migrations/` (reviewed in PRs), and Cloudinary uploads stay manual.
3. **Keep the Supabase auth audit log** as it is: not turned off and not purged by us. `purge_auth_audit_log` is dropped.
4. **Email + password sign-in, no magic links or codes.** The email address is the username (as today; no separate username is stored, so data minimisation holds). Replaces auth-spec §1 "Credentials" and §4.1.
   - **Sign-up:** `/sign-up` with email + password. "Confirm email" stays **on**: Supabase sends one confirmation email, and the account (`ensure_account`) is created on first verified sign-in. Signing up with an address that already has an account gets the same "check your email" response.
   - **Sign-in:** `/sign-in` with email + password + "shared device" choice. One generic error for any failure.
   - **Password reset:** `/forgot-password` (always the same response) → Recovery email (`{{ .TokenHash }}`) → scanner-safe `/auth/confirm` page (GET shows a button, POST verifies) → `/reset-password`. That page accepts only a session that our own `/auth/confirm` POST marked as a recovery session (`session_policies.recovery_verified_at`) in the last 15 minutes, and whose JWT `amr` is `otp` (fixes S14). The `amr` claim alone isn't enough: Supabase reports a recovery as `otp`, not `recovery` (found in 0.3). After the change, every other session is signed out.
   - **Change password** on `/account`: the current password is required.
   - **Existing users reset their password at cutover** (decided 2026-11-02). Their passwords are in Netlify Identity, not Supabase (see Context), so they can't be carried over. At cutover a script creates a confirmed Supabase Auth account for each kept user (no password) and links it to their `users` row. The cutover email asks them to set a password with "Forgot password". The old password-scramble step is not needed.
   - **Gone:** `/sign-in/code`, the `ps_pending` cookie, OTP settings, the Magic Link template, code lockout and resend.
   - **Password policy (G5), following NIST SP 800-63B-4 and NCSC guidance.** A password is the only authenticator here, so:
     - **At least 15 characters.** Up to 72 bytes (bcrypt's limit in Supabase Auth), which covers NIST's "allow at least 64 characters" for ordinary text.
     - **No composition rules** (no required digits or symbols), **no expiry**, no hints or security questions.
     - **Any characters allowed**, including spaces and emoji. Unicode NFKC-normalised before hashing, so the same password typed on different devices matches.
     - **Checked against breached passwords** with the Have I Been Pwned Pwned Passwords range API (k-anonymity): the server sends only the first 5 hex characters of the SHA-1 hash, with the `Add-Padding` header. The password, the user's email and the user's IP never leave our server. If HIBP is unreachable or slow (2 s timeout), the server falls back to a bundled list of the top ~100k common passwords plus app words (`postscript`, `postscriptmedical`) and the user's own email address.
     - **Usable with password managers:** paste allowed, `autocomplete="new-password"` / `"current-password"`, show-password toggle, hint text "Try three random words" (NCSC).
     - **Change is forced only on evidence of compromise**, not on a schedule.
     - Supabase's own leaked-password check is Pro plan only (confirmed in the dashboard in 0.3), so it isn't used; the HIBP check above replaces it. Supabase `minimum_password_length` is set to 15 as a backstop.
   - **No forced change at sign-in.** Because every existing user sets a new password through the policy at cutover, there is no sign-in policy check and no `must_change_password` flag.

Step 0.8 updates the docs to match all of the above.

---

## Decision gates

| # | Decision | Needed by | Default if not decided |
|---|---|---|---|
| G1 | ~~Domains (§11.3)~~ **Decided:** staging `https://staging.app.postscriptmedical.com`, production `https://app.postscriptmedical.com` | 0.6, 1.10, 3.7 | — |
| G2 | Existing user count (§11.4). The earlier figure of 11 isn't backed by production data: production `auth.users` is empty, `public.users` has 207 rows, and the real accounts are in Netlify Identity. Count from the live site's Netlify Identity list. | 3.5, 3.7 | Count before writing the runbook |
| G6 | Which legacy users get an account at cutover | 3.5 | Only `users` rows whose `netlify_id` matches a confirmed Netlify Identity user; everyone else's rows are deleted (data minimisation) |
| G3 | Controller legal entity (§11.5, DP §10.1) | 1.13 (`/privacy`) | Placeholder text; blocks cutover only |
| G4 | Shared-device idle (auth §10.1), feedback form vs `mailto:` (DP §10.3), inactive-account purge (DP §10.2) | 1.10, 2.6 | 60 min; keep the form; don't purge |
| G5 | ~~Password policy~~ **Decided:** NIST SP 800-63B-4 / NCSC (scope change 4); breached-password check via the HIBP range API with a bundled-list fallback | 1.7, 1.10 | — |

### Email budget (Lettermint free: 300/month)

With passwords, **sign-in sends no email.** Email goes out only for:

| Email | Expected volume |
|---|---|
| Sign-up confirmation | one per new account |
| Password reset | occasional, plus one per existing user in the weeks after cutover |
| Feedback to staff (if the form is kept, G4) | at most 5 per user per day by rate limit, in practice a few a month |
| Cutover announcement | one per kept user (G2, G6), once |

The cutover month carries two emails per existing user (announcement + reset). If G2 comes out above ~120 users, send the announcement in batches across days or months so the total stays under 300. Otherwise it's well under. If the quota did run out, only sign-up and password reset would stop; existing users could still sign in.

- Local and CI never send real email: messages go to the local Supabase Mailpit/Inbucket.
- Staging **shares production's quota**: Lettermint Free allows one project, one sending domain and one quota (checked in 0.6). Staging gets its own API token and a low hourly cap, and only a handful of real-email checks (1.14).
- `docs/operations.md` (3.3) includes a monthly look at Lettermint usage.

---

## Phase 0 — Groundwork

**0.1 Supabase CLI baseline.** ✅ Done 2026-11-02, see [supabase-baseline-notes.md](supabase-baseline-notes.md). `supabase init`, linked to **staging**, `supabase db pull` → `supabase/migrations/20261102172256_remote_schema.sql`. You confirmed staging's schema matches production, so the baseline stands; production wasn't linked. RLS, grants and staging Auth settings are recorded in the notes. All user data on staging was deleted (mixed real and test users). Production auth turned out to be Netlify Identity, which changed scope change 4, G2 and 3.6–3.7.

**0.2 Staging project in sync.** ✅ Nothing to push: staging's migration history already lists the baseline as applied.

**0.3 Verify free-tier behaviour on staging** (results go into data-model §4 / auth-spec §2). Run 2026-11-02. Done: pg_cron, cascade, `config push` coverage, `amr`, 72-byte limit, leaked-password protection (Pro only, so we use the HIBP range API ourselves). Asymmetric JWT keys are available on free (the dashboard shows "Migrate JWT secret"), but staging still signs with HS256. Minimum length 15 set in the staging dashboard and enforced (14 characters rejected). `config diff` doesn't report `minimum_password_length`, so settings are checked by probe or in the dashboard after a push. **Finding:** a recovery `verifyOtp` gives `amr` method `otp`, not `recovery`, so `/reset-password` (1.10) checks a server-side marker instead: `session_policies.recovery_verified_at` (decided 2026-11-02).
- `create extension pg_cron` works.
- Deleting unconfirmed `auth.users` rows from SQL cascades identities and one-time tokens.
- `supabase config push` covers templates, `minimum_password_length`, password requirements, rate limits and SMTP; list anything that is dashboard-only.
- Asymmetric JWT signing keys are available, so `getClaims()` verifies locally.
- The JWT `amr` claim shows `recovery` with a timestamp after `verifyOtp({ type: 'recovery' })`.
- Leaked-password protection really is unavailable on free.
- Supabase Auth accepts passwords up to 72 bytes and the `minimum_password_length = 15` setting.

**0.4 Move legacy code.** `git mv` `src`, `functions`, `public`, `rollup.config.js`, `playwright*`, `db` → `legacy/`. The old site is unaffected (it builds from `main`). The admin code is **deleted outright** rather than kept as reference: `screens/Admin*`, `components/admin/*`, `modals/EditSubSpecialtyModal.svelte`, `modals/InviteNewOrgModal.svelte`, and the functions `update-illustration-details`, `update-sub-specialty-details`, `get-illustrations*`, `get-organizations`, `invite-organization`, `delete-organization`. Done 2026-11-02. Also deleted: `methods/load-organizations.js` (used only by the admin organisations screen), and the admin imports, `/admin*` routes and `isUserDm` guard in `legacy/src/App.svelte`. `legacy/` is then **git-ignored and untracked** (`git rm -r --cached`): it lives only on your machine as a local reference, and its history stays in git (`main` and earlier commits). Anything that needs it in a fresh checkout or CI must be generated from it locally and committed (e.g. `supabase/seed.sql` in 0.7). `netlify.toml`, `package.json` scripts and the workflow are left as they are until 1.1–1.3.

**0.5 Second Netlify site.** Already set up: it deploys automatically when commits are pushed to `migration-sveltekit`. No setup step. (If a later step introduces a new secret, e.g. `RATE_LIMIT_HMAC_SECRET`, I'll say so in that step so you can add it.)

**0.6 Lettermint.** Account, DPA and DNS are done (P5; free tier: 300 emails a month, see "Email budget" above). Set delivery-log retention to the minimum and turn click/open tracking off. Configure Lettermint SMTP as Supabase custom SMTP on staging and set the Supabase project email rate limit to a per-hour cap well under the monthly budget. Check whether Lettermint also has a daily cap, and whether staging and production can have separate quotas.
- **Checked in Lettermint's docs (2026-11-02):**
  - Retention is **28 days, fixed on every plan** (message content, recipients, metadata; analytics events 90 days from 8 Nov 2026), so there is nothing to set.
  - Open/click tracking is **off by default and not available on Free**.
  - **No daily cap**, no fixed per-minute rate limit.
  - Free allows **1 project, 1 sending domain, 1 user**, so staging and production share one project and the one 300/month quota. Sandbox projects (which don't use quota) are paid-only.
  - **Not documented: what happens at 300** (rejected or queued). Ask Lettermint support.
- **SMTP for Supabase:**
  - host `smtp.lettermint.co`, port `587` (STARTTLS);
  - username `lettermint`;
  - password = a **Project API token** (`lm_…`), one per environment (`supabase-staging` now, `supabase-production` at cutover);
  - sender `no-reply@postscriptmedical.com`, name "PostScript".
  - Before SMTP works, "Enable SMTP" must be turned on in the project. Supabase can't set the `X-Lettermint-Route` header, so the project's **default route must be the transactional `outgoing` route**.
- **Supabase email rate limit:** staging **5 per hour** (enough for the 1.14 checks; it shares the quota); production set at cutover (3.7).
- **Done 2026-11-02.** Staging SMTP confirmed with `config diff`: host `smtp.lettermint.co`, port 587, user `lettermint`, sender `no-reply@postscriptmedical.com` / "PostScript", SMTP enabled. The rate limit (5/hour) was set in the dashboard; `config diff` doesn't compare it. A real send is tested in 1.14.

**0.7 Local stack and seed.** Set `db.major_version = 15` in `config.toml` to match staging and production; `supabase start`; generate `supabase/seed.sql` from `legacy/db/cardiology.js` + `gastroeterology.js` (one-off script in `scripts/`) plus two normal test users with known test passwords. Emails are read from local Mailpit/Inbucket.

**0.8 Docs update** for the scope changes above:
- migration-plan: §1 (email provider, password auth, no staff role), §2 diagram and §2.1 layout (drop `(admin)/`, `requireStaff`, `admin_audit`; public routes `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/auth/confirm`), §3 (no `admin_audit`, no `platform_role`, no `show_tutorial`), §4 (`auth-login` → `/sign-in` with password; `auth-password-reset-request` / `auth-password-reset` → `/forgot-password` + `/reset-password`, fixes S14 and S18; `update-illustration-details`, `update-sub-specialty-details`, `get-illustrations*` → delete; catalogue via SQL migrations), Phase 3 removed, §6/§7 tables, §9 email row (Lettermint 300/month, the budget above), §11.1–§11.3 closed, §11.4 still open (G2), §10 cutover (Netlify Identity → new Supabase Auth accounts, everyone resets their password).
- auth-spec: rewrite §1 (credentials), §2 (password settings, no OTP), §2.1 templates (Confirm Signup and Recovery with `{{ .TokenHash }}`; Magic Link unused), §3.1 cookies (no `ps_pending`), §4.1 sign-up / sign-in / reset flows, §4.3 change password and no last-`dm` check, §6 limits, §7.1–7.3 (only `user` and workspace roles; drop the `dm` column and `/admin/**` row; add the new routes to the matrix), §8 (existing users come from Netlify Identity: new Supabase Auth account per kept user, password set via "Forgot password"; no scramble), §9 (password reset kept, rewritten), §10.3 closed. Remove the audit-log purge row from §2.
- data-model: ER diagram and §2.1/§3 (drop `platform_role` enum/column and `admin_audit`), §4 (drop `purge_auth_audit_log`), §5.4 and §5.6, §7 step 3 (no role mapping; legacy `role` column just dropped), §7 new step before the reshape: create Supabase Auth users from the kept `users` rows (G6) and set `auth_id`, since production `auth.users` starts empty, `show_tutorial` removed from §2, §3.2 and §7 step 5.
- data-protection: §4 add Have I Been Pwned (Pwned Passwords range API) as an outside service that receives only a 5-character hash prefix from our server, so no personal data (state it in the privacy notice for transparency); §2 add the password hash (in `auth.users`, bcrypt, held by Supabase) and keep the audit log row with no purge job; §2 preferences row without the tutorial flag; §4 processor row = Lettermint (EU; message content, recipients and metadata kept 28 days, not configurable; no open/click tracking on Free); §5 cookie table without `ps_pending`; §6 drop the audit-log job; §10.4 closed.
- Memory: already updated with these decisions.

---

## Phase 1 — Scaffold, auth, account

**1.1 Scaffold.** `npx sv create` in the repo root: SvelteKit, Svelte 5, TS, Vite, `@sveltejs/adapter-netlify`, ESLint 9 flat config, Prettier 3, Vitest, Playwright; Husky 9 + lint-staged. Runtime deps: `@supabase/ssr`, `@supabase/supabase-js`, `zod`, `gsap`, `nodemailer` (Lettermint SMTP). CLIs in devDeps. Gone: faunadb, gotrue-js, node-fetch, mdsvex, svench, stripe, postmark, Rollup/Babel/core-js/whatwg-fetch, svelte-spa-router, sirv.

**1.2 Static shell.** `app.html` with no third-party scripts or styles; Montserrat self-hosted in `static/fonts`; port `legacy/public/global.css` and the favicon. `netlify.toml`: new build, keep the `/images/*` → Cloudinary redirect, drop `/api/*`.

**1.3 CI.** Replace `.github/workflows/playwright.yml` with `ci.yml`: lint → `svelte-check` → Vitest unit → `supabase start` + integration → build → Playwright (Chromium + WebKit) against `vite preview`. Percy only on PRs to `staging`/`main`.

**1.4 Schema migrations** (one file per concern; local + staging only, production untouched until 3.7):
1. enums `workspace_kind`, `workspace_role`, `session_mode`;
2. `workspaces`, `workspace_members`, `session_policies` (including the nullable `recovery_verified_at`), `rate_limits` with the checks and indexes from DM §3;
3. reshape `users` (keep `id`, `auth_id`, `created_at`; drop `email`, `first_name`, `last_name`, `role`, `team_id`, `netlify_id`, `original_source_id`, `show_tutorial`) and `user_app_states` (`user_id` PK; no `show_tutorial` either);
4. catalogue: composite PKs, `ordering`, drop `original_source_id`;
5. RLS on every public table, no policies; revoke the baseline's grants to `anon` and `authenticated` on every public table (and default privileges); drop the two `avatars` policies on `storage.objects` and the bucket (see [supabase-baseline-notes.md](supabase-baseline-notes.md)).

**1.5 RPCs and pg_cron.** `ensure_account`, `export_account`, `purge_unconfirmed_signups`, `purge_expired_sessions`, `purge_rate_limits`. All `security definer`, `search_path = ''`, execute granted to `service_role` only; `cron.schedule` calls. Integration tests: `ensure_account` idempotent and safe under concurrent calls, invariants DM §5.1–5.5, cascade on auth user deletion, each purge.

**1.6 Generated types.** `supabase gen types typescript --local > src/lib/types/db.ts`; CI fails if the regenerated output differs.

**1.7 `lib/server` core.** `supabase.ts` (`createSsrClient(event)` with httpOnly/secure/lax cookie options; `adminClient`), `errors.ts` (port of `legacy/functions/utils/error-handler.js`: codes, request ids, generic client messages), `validation.ts` (zod, including the shared password schema from G5), `password.ts` (NFKC normalisation, length check, HIBP range lookup with `Add-Padding` and a 2 s timeout, bundled-list fallback in `src/lib/server/data/common-passwords.txt`, email and app-word check; used by sign-up, reset and change password), `rate-limit.ts` (HMAC keys, IPv4 /24 or IPv6 /48 prefix, Postgres upsert counter), `log.ts` (user id and request id only; never passwords, emails or IPs). Unit tests for each.

**1.8 `hooks.server.ts` and `app.d.ts`.** Order per auth-spec §3.2: SSR client → `getClaims()` → `session_policies` lookup (no row → sign out; expiry or idle → sign out and `/sign-in?expired=1`; `last_seen_at` written at most every 5 min) → `locals.profile = { userId, workspaceId, workspaceRole }` (one join query, `ensure_account` fallback) → security headers. `kit.csp` nonce mode with `connect-src 'self'`; HSTS, nosniff, Referrer-Policy, Permissions-Policy; request body limit. **You, in the staging dashboard:** Project Settings → JWT Keys → "Migrate JWT secret", then rotate to the new ECC key, so `getClaims()` verifies locally (check that `alg` is no longer `HS256`). The local stack uses `signing_keys_path`.

**1.9 Guard.** `requireUser` in `lib/server/guards.ts`, used by `(app)/+layout.server.ts` and called again in every action.

**1.10 Auth flows.** All are form actions, with zod validation, email trimmed and lower-cased, and `next` limited to relative paths on our own site.
- `/sign-up`: email + password (G5: 15+ characters, breached check, "Try three random words" hint, show-password toggle, no "confirm password" field). A rejected password gets a specific, friendly reason ("too short", "this password has appeared in a data breach"). `signUp` with `emailRedirectTo` → `/auth/confirm`. The response is always "check your email to confirm", whether or not the address already exists.
- `/sign-in`: email + password + "This is a shared device" (default per auth-spec §1). `signInWithPassword` → `ensure_account` → insert `session_policies` → cookie `Max-Age` per mode → 303 to `next` or `/annotate`. An unconfirmed address gets the same generic error as a wrong password, plus a "resend confirmation" link that is rate-limited and always gives the same response.
- `/forgot-password`: email only, always "if an account exists, we've sent a link". `resetPasswordForEmail` with redirect to `/auth/confirm`.
- `/auth/confirm`: GET shows only a "Continue" button and the device choice (scanner-safe); POST runs `verifyOtp({ token_hash, type })`, then `ensure_account` and inserts the `session_policies` row with the chosen mode. For `signup` → signed in, account created. For `recovery` the row also gets `recovery_verified_at = now()` → `/reset-password`. Only this POST ever sets that column.
- `/reset-password`: only when this session's `session_policies.recovery_verified_at` is within the last 15 min **and** the JWT `amr` contains `otp`; otherwise 303 to `/forgot-password`. (Supabase reports a recovery as `amr` `otp`, so `amr` alone can't identify one; see auth-spec §2.) New password through the G5 checks, then `updateUser({ password })` → global sign-out of other sessions + delete their `session_policies` rows → set `recovery_verified_at = null` on this one, so the page can't be reused → continue signed in on this device.
- `/logout` action.
- Rate limits (auth-spec §6, rewritten): failed sign-ins 5 per email per 15 min and 20 per IP prefix per 15 min (generic error when hit); sign-up 5 per IP prefix per hour; forgot-password and resend-confirmation 3 per email per hour and 10 per IP prefix per hour (same response, nothing sent); confirm POST 20 per IP prefix per 15 min.
- Templates `supabase/templates/confirm-signup.html` and `recovery.html` (links built from `{{ .SiteURL }}` and `{{ .TokenHash }}`, no tracking). `config.toml`: email provider on, confirm email on, `minimum_password_length = 15`, `site_url` and the redirect allow-list per environment (local `http://localhost:5173`; staging `https://staging.app.postscriptmedical.com`; production `https://app.postscriptmedical.com`), then `config push` to staging. `config diff` can't confirm every setting (it doesn't report `minimum_password_length`), so after the push check the password length, templates and redirect list with a probe or in the dashboard. `PUBLIC_SITE_URL` follows the same values.
- Port the UI from `legacy/src/components/{SignInForm,CredentialsForm,CredentialsTerms}.svelte`, `legacy/src/modals/ForgotPasswordModal.svelte`, `legacy/src/screens/ResetPassword.svelte`. Replace `check-password-requirements.js` with the zod schema.

**1.11 Auth tests.** Integration: a matrix helper (anon / user / other user) over the auth-spec §7.3 rows, extended as routes land; rate-limit thresholds; `/reset-password` refuses a password session, a sign-up confirmation session (`amr` `otp` but no marker), a marker older than 15 min, and a second use after a successful reset. Unit tests for `password.ts`: 14 vs 15 characters, NFKC equivalence, the 72-byte limit, HIBP hit/miss with a mocked range response, HIBP timeout → bundled-list fallback, email-as-password rejected. No test calls the real HIBP API. E2E via Mailpit: sign up → confirm link → signed in and account created; sign in with password (personal and shared; shared is a session cookie); wrong password and unknown email give the same message; forgot → reset → old password fails, other sessions signed out; a passwordless account (as created at cutover) can set a password through forgot → reset and then sign in; an expired policy signs the user out.

**1.12 `/account`.** Shows the email. Change password at `/account/password` (current + new, new one through the G5 checks; the current one is checked with a throwaway server-side client whose session is revoked straight away, then `updateUser`, then other sessions signed out). Sessions list (signing out another user's session id → 404; "sign out everywhere" = global signOut + delete rows). Download my data (`export_account` → JSON attachment). Delete my account (current password + typed email, Admin `deleteUser`, clear cookies → `/sign-in?deleted=1`). A test per matrix row.

**1.13 Design system and legal pages.** Port the reusable components into `src/lib/components` **without the `Ps` prefix**: `PsButton` → `Button`, `PsTextInput` → `TextInput`, `PsDropdown` → `Dropdown`, `PsTooltip` → `Tooltip`, `PsTagsInput` → `TagsInput`, `PsHeader` → `Header`, `PsLogo` → `Logo`, `PsLink` → `Link`. `PsModal` and the existing `Modal.svelte` collide: merge them into one `Modal`. Also icons, `LoadingOverlay`, `ErrorMessage`. `PsButton.svench.svelte` is not ported. Update migration-plan §2.1 ("`Ps*` design system" → "design system"); drop `Portal.svelte` and the portal store. `/privacy` (DP §8 contents, cookies, processors including Lettermint, rights; G3) and `/terms` (free, as-is, user is responsible for patient communications).

**1.14 Deploy check.** On the staging site: sign up a real address end to end through Lettermint, sign in, reset the password; inspect cookies, headers and the console for CSP violations.

---

## Phase 2 — Clinician journey

**2.1 Port the sketchpad as-is.** `legacy/src/components/sketchpad/**` and helpers → `src/lib/sketchpad/`; undo store from `legacy/src/stores.js`; constants from `legacy/src/constants/sketch-pad.js`. Svelte 3 syntax compiles under Svelte 5, so no rewrite yet.

**2.2 Defect fixes.** `dpr = Math.min(window.devicePixelRatio || 1, 2)`; remove the `msSaveBlob`/IE branches in `generate-annotated-image.js`. Unit tests for `get-updated-actions`, `typed-text`, `get-pointer-location`.

**2.3 Catalogue repo and loader.** `lib/server/repos/catalogue.ts` (specialties → sub-specialties → illustrations, ordered), read-only. `annotate/+page.server.ts` loads it with `setHeaders({ 'cache-control': 'private, max-age=…' })`. No tenant filter. Port `filter-sort-illustrations.js` and `find-illustrations.js` with unit tests.

**2.4 `/annotate`.** Port `ImageAnnotation`, `ImageCatalogue`, `ImagesGrid*`, `ChooseSpecialtyModal`, `UserSettingsDropdown` (links to `/account`, logout form). Actions `?/chooseSpecialty` and `?/chooseIllustration` take **ids**, are validated against the catalogue, write only the caller's row from `locals.profile`, and show an error on failure (fixes the fire-and-forget defect). No tutorial flag is stored or loaded.

**2.5 Client-side share (`lib/share`).** `canShare({ files })` → `navigator.share` with the JPEG; otherwise download; print via `window.print()` and a print stylesheet. `ShareModal` without the email tab. Unit tests for the fallbacks; E2E asserts no request carries image data.

**2.6 Feedback.** `?/feedback` action: zod, 5 per user per day, HTML-escaped, sent to staff through Lettermint SMTP (`lib/server/email.ts`) with the account email as reply-to (or a `mailto:` link, per G4).

**2.7 Re-port E2E.** Adapt `legacy/playwright/e2e/image-annotation/*` and shared helpers to a new auth fixture (signs in a seeded test user with its password). Re-baseline Percy.

**2.8 Runes conversion.** With E2E green, convert the sketchpad and ported components to Svelte 5 runes (`$state`, `$derived`, `$props`, snippets); move stores to `.svelte.ts` modules where it helps. E2E must stay green.

---

## Phase 3 — Hardening and cutover

(The old Phase 3, staff catalogue under `/admin/**`, is removed; its legacy code was already deleted in 0.4.)

**3.1 Review.** Full authz matrix green; run `/security-review` and `/code-review` on the branch; fix findings.

**3.2 Logging audit.** Grep for emails, IPs and passwords in logs; confirm clients only see generic errors.

**3.3 Ops.** Nightly backup workflow (`pg_dump` → `age` → artifact, 7-day retention; it includes `auth.users` password hashes, which is one more reason for the encryption and short retention); optional weekly staging ping. Write `docs/operations.md`: backup and restore drill, cron jobs, logs, staging pausing, monthly Lettermint usage, and how to change the catalogue with a SQL migration until admin controls exist.

**3.4 Delete `legacy/`** (the local, git-ignored folder) once its tests are ported or dropped.

**3.5 Cutover runbook.** `docs/cutover-runbook.md`: ordered commands, checks and rollback (plan §10).

**3.6 Rehearsal on staging.** Restore a prod copy into staging. Run `scripts/cutover/create-auth-users.ts` (Admin `createUser` with `email_confirm: true` and no password for each kept user per G6, then set `users.auth_id`; idempotent, safe to re-run), then the cutover migration (DM §7, amended: every user → plain user with a personal workspace, rows not kept under G6 deleted, legacy `role`, `netlify_id` and `show_tutorial` columns dropped, in-transaction invariant assertions). Take one restored user through "Forgot password" → set a password → sign in. Merge `migration-sveltekit` → `staging`; full Playwright + Percy including WebKit/iPad against the staging site.

**3.7 Cutover.**
- Before: data spot-check against prod (user count from G2, known accounts); Stripe `cancel_at_period_end` on every active subscription and disable the old webhook.
- Day: encrypted rollback `pg_dump` → `create-auth-users.ts` on prod → cutover migration on prod → rotate Supabase API keys (update the new site's env) → migrate the production JWT secret to asymmetric keys and rotate, as on staging in 1.8 → merge `staging` → `main` → point `app.postscriptmedical.com` at the new site (and `staging.app.postscriptmedical.com` stays on the staging deploy) → production Supabase `SITE_URL` = `https://app.postscriptmedical.com`, redirect allow-list = `https://app.postscriptmedical.com/**` only → remove Stripe keys from both sites → smoke test (set a password for a real account through "Forgot password", then sign in) → send the cutover email to each kept user through Lettermint (G2, G6; batched if the email budget needs it): "PostScript has moved and is now free. Your account and settings have come with you, but your old password hasn't. Go to app.postscriptmedical.com, choose 'Forgot password' and enter this email address to set a new one. It needs at least 15 characters; three random words work well."
- After: keep the old site 1–2 weeks, then delete the rollback dump.

**3.8 Post-cutover.** DP §8 checklist (DPAs with Supabase, Netlify, Lettermint, GitHub; ICO fee check; NZ privacy officer; breach procedure); check the first month of Lettermint usage; mark docs as live.

---

## Critical files (new)

`supabase/{config.toml,templates/*,migrations/*,seed.sql}`, `src/hooks.server.ts`, `src/app.d.ts`, `src/lib/server/{supabase,guards,errors,validation,rate-limit,email,log}.ts`, `src/lib/server/repos/catalogue.ts`, `src/lib/sketchpad/**`, `src/lib/share/*`, `src/routes/(public|app)/**`, `.github/workflows/{ci,backup}.yml`, `scripts/cutover/*`, `docs/{cutover-runbook,operations}.md`.

Reused from legacy: `functions/utils/error-handler.js` (errors module), `src/components/sketchpad/**` and helpers, `src/methods/{filter,sort,find}-illustrations.js`, `generate-annotated-image.js`, `debouncer.js`, the `Ps*` components (renamed without the prefix), the sign-in / credentials / forgot-password / reset-password UI, `db/*.js` (seed), Playwright annotate specs.

## Verification

- Per step: `npm run lint && npm run check && npm run test:unit && npm run test:integration` (local Supabase) `&& npm run build && npx playwright test`.
- Per phase: deploy to the second Netlify site; manual sign-up, sign-in and reset with a real address; inspect cookies, CSP and headers; the Network tab shows no third-party hosts and no image uploads.
- An E2E check that `/admin` and `/admin/specialties` return 404.
- A grep check in CI for `dm`/`requireStaff`/`platform_role`/`admin_audit`/`routes/(admin)`/`/admin` in `src/` and new migrations, so the removed scope doesn't creep back in.
- Cutover: the staging rehearsal on a prod copy must pass the invariant assertions, a password set through "Forgot password" for a restored user followed by a sign-in, and full E2E before prod is touched.
