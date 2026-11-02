# PostScript Annotation App — Data Protection

> **Companions:** [data-model.md](data-model.md) (tables), [auth-spec.md](auth-spec.md) (sign-in, sessions, account page), [migration-plan.md](migration-plan.md) (phases, free-tier constraints).
> **Scope:** the new app after cutover. UK GDPR / EU GDPR, PECR (cookies), and the NZ Privacy Act 2020.
> **Status:** draft, 2026-10-21. Not legal advice. Items marked _(verify)_ need checking against the vendor's current terms or a professional.

---

## 1. Goal and the honest floor

**Goal:** hold as little personal data as possible, for as short a time as possible, and **no health data at all**.

**Zero isn't achievable**, because:
- Signing in needs an **email address**, which is personal data.
- Running sessions needs **identifiers** (user id, session id) tied to that address.
- Hosting and email providers process **IP addresses** and delivery metadata while serving requests.

So the target is **an email address plus the technical data needed to run the service**. Nothing about the user's identity, employer, patients or behaviour.

---

## 2. Data inventory

This table also serves as our record of processing.

| Data | Where | Why | Lawful basis | Retention |
|---|---|---|---|---|
| Email address | Supabase Auth (`auth.users`) | Sign-in, sign-in codes | Contract (Art. 6(1)(b)) | Until the account is deleted (§7) |
| Auth timestamps (created, confirmed, last sign-in) | `auth.users` | Running the account, export | Contract | As above |
| Email of a **not-yet-confirmed** sign-up | `auth.users` | Completing sign-up | Steps before a contract | **24 hours** (pg_cron) |
| Supabase session + refresh token (includes IP and user agent, held by Supabase) _(verify columns)_ | `auth.sessions`, `auth.refresh_tokens` | Keeping the user signed in | Contract | Until sign-out or the end of the session lifetime (8 h / 30 d) |
| Auth audit entries (IP, action) | `auth.audit_log_entries` | Supabase-side security | Legitimate interests (security) | **Off**, or 30 days (pg_cron) |
| Session policy (mode, started, last seen) | `session_policies` | Shared/personal device limits | Contract | Until the session ends, at most 30 days |
| Rate-limit counters (HMAC hashes of email / IP prefix) | `rate_limits` | Abuse prevention | Legitimate interests (security) | **24 hours** |
| Preferences (selected specialty, sub-specialty, illustration; tutorial shown) | `user_app_states` | Convenience | Contract | With the account |
| Platform role, workspace membership | `users`, `workspaces`, `workspace_members` | Authorization | Contract | With the account |
| Feedback message + account email as reply-to | Staff mailbox (sent via the email provider) | Support | Legitimate interests | Delete from the mailbox **12 months** after resolving |
| Request logs (IP, user agent, path) | Netlify, Supabase API logs | Operation, security | Legitimate interests | Vendor retention: Supabase free about 1 day, Netlify _(verify)_ |
| Email delivery logs (recipient, status) | Email provider | Delivery, debugging | Legitimate interests | Set to the **minimum** the provider allows (e.g. Postmark default 45 days, adjustable) |
| Database backups (contain the above) | Encrypted GitHub Actions artifact | Disaster recovery | Legitimate interests | **7 days** |

**Application logs** contain user ids and request ids only. No emails, IPs, codes or tokens (S17).

---

## 3. What we deliberately don't collect

| Not collected | How we make sure |
|---|---|
| Names, job titles, employer, organisation, country | Sign-up asks for an email address only. Old names are deleted at cutover ([data-model §7](data-model.md)). |
| **Annotated images, drawings, typed text, patient details** | Annotation, export and sharing all run in the browser. No endpoint accepts an image. CSP `connect-src 'self'` and a small request-body limit back that up. |
| Patient email addresses | No server-side email share. The device's share sheet, download or print are used instead (§4). |
| Payment data | No billing. A future "support this project" link goes to an external platform that stores nothing with us. |
| Analytics, tracking, advertising IDs | No analytics scripts. No third-party scripts at all. |
| Third-party requests that leak IPs | Fonts self-hosted (no Google Fonts), GSAP from npm, no Stripe.js, no CDNs. Illustrations go through our Netlify proxy. |
| Email open or click tracking | Turned off at the email provider. Plain links in templates. |

### 3.1 Health data

The app is a clinical tool, but **we process no health data**:
- Illustrations are generic anatomy from our own catalogue.
- What a clinician draws or types stays in their browser's memory and is gone when they leave the page.
- When they share, the image goes from their device to the destination they choose (their mail app, AirDrop, messaging, a printer). **The clinician, or their employer, is the controller of that patient communication. We aren't a party to it.** The Terms say this plainly.
- A user's chosen specialty says something about their profession, not about anyone's health.

So no DPIA is mandatory today. Record that screening conclusion here, and **revisit it if any feature ever sends an image or a patient detail to our servers** (cloud save, server rendering of 3D models with annotations, server-side email).

---

## 4. Processors and transfers

| Processor | Role | Location | Transfer mechanism | Status |
|---|---|---|---|---|
| Supabase | Auth + database | Data in **London (eu-west-2)**; company in the US | Supabase DPA with SCCs / UK addendum | Sign the DPA _(verify it's available on free)_ |
| Netlify | Hosting, server functions, request logs | US, global edge | Netlify DPA with SCCs / UK addendum | Sign the DPA |
| Email provider (choice pending, [migration-plan §11.1](migration-plan.md)) | Sign-in codes, feedback relay | Depends on the provider | Provider DPA | Choose one with a DPA and minimal log retention |
| Cloudinary | Illustration images | US/EU | Only Netlify's proxy talks to it; no user data in requests _(verify which headers are forwarded)_ | DPA optional, since no personal data |
| GitHub | CI, encrypted backup artifacts | US | GitHub DPA | Backups are encrypted before upload (`age`), and the key isn't held in GitHub |

**NZ Privacy Act (IPP 12):** disclosure overseas is allowed where the recipient is subject to comparable safeguards. The UK and EU are, and the US vendors are bound by contract (DPAs).

If we add CAPTCHA (Cloudflare Turnstile, [auth-spec §6](auth-spec.md)), it becomes a processor that sees visitor IPs. Add it to this table and the privacy notice first.

---

## 5. Cookies (PECR / ePrivacy)

| Cookie | Purpose | Strictly necessary? |
|---|---|---|
| `sb-<ref>-auth-token` | Keeps the user signed in | Yes |
| `ps_pending` | Holds the email between "send code" and "enter code", 15 min | Yes |
| _later:_ `ps_workspace` | Active workspace choice | Yes |

**Only strictly necessary cookies, so no consent banner.** The privacy notice lists them. No `localStorage` use for anything beyond UI conveniences (e.g. last tool selected), and never for identifiers.

---

## 6. Retention and deletion jobs

All jobs run as **pg_cron** inside Postgres. No extra service.

| Job | Schedule | Deletes |
|---|---|---|
| `purge_unconfirmed_signups` | nightly | `auth.users` unconfirmed for more than 24 h |
| `purge_expired_sessions` | nightly | `session_policies` past their lifetime + their `auth.sessions` |
| `purge_rate_limits` | hourly | `rate_limits` older than 24 h |
| `purge_auth_audit_log` | nightly | `auth.audit_log_entries` older than 30 days (only if it can't be disabled) |
| _proposed:_ `purge_inactive_accounts` | nightly | Accounts with no sign-in for **24 months**, after a warning email 30 days before (open question 2) |

Backups: the nightly encrypted `pg_dump` artifact expires after **7 days** (GitHub artifact retention). Deleted accounts therefore disappear from backups within a week. The one-off cutover rollback dump ([data-model §7](data-model.md)) is deleted when the old site is retired.

---

## 7. Data subject rights

| Right | How |
|---|---|
| Access / portability | `/account` → **Download my data** (JSON, [auth-spec §4.3](auth-spec.md)). |
| Erasure | `/account` → **Delete my account**. Immediate, and cascades through every table ([data-model §5.4](data-model.md)). Backups age out within 7 days. |
| Rectification | The only data is the email address. To change it, delete the account and sign up with the new one (nothing of value is lost). Or ask us. |
| Restriction, objection | By email to the privacy contact. Answered within one month. |
| Requests from people without an account | We hold nothing about them, unless their address was entered in a sign-up that was never confirmed (deleted within 24 h). |

---

## 8. Documents and obligations

- [ ] **Privacy notice** (`/privacy`): controller identity and contact, this inventory in plain language, processors, cookies, rights, retention, how to complain (ICO / NZ Privacy Commissioner).
- [ ] **Terms** (`/terms`): free service, provided as is. The user is responsible for patient communications they send from their device (§3.1). Acceptable use.
- [ ] **ICO data protection fee** (UK): most controllers must pay it. Check whether we're exempt _(verify)_.
- [ ] **UK / EU representative** (Art. 27): needed if the controller has no establishment in the UK or EU but offers the service there. The exemption for occasional, low-risk processing may apply _(verify, depends on open question 1)_.
- [ ] **NZ privacy officer:** name one (Privacy Act 2020, s 201).
- [ ] **DPAs signed** with each processor in §4.
- [ ] **Breach procedure:** assess within 24 h. Notify the ICO within 72 h where there's a risk to people. Notify the NZ Privacy Commissioner as soon as practicable for a notifiable breach. Keep a breach log even when nothing is reported.
- [ ] **This document** kept up to date as the record of processing and the DPIA screening.

---

## 9. When future features change the picture

| Feature | What changes | Before building |
|---|---|---|
| Organisation accounts ([data-model §6](data-model.md)) | Owners see member emails. Invites mean storing an invitee's email before they've agreed to anything. The organisation may become a controller of its members' data, with us as its processor. | Update the inventory, decide controller/processor roles, add a processor clause to the Terms for organisations, set invite retention (expired invites deleted). |
| Support link | Nothing, if it's an external link. | Make sure the link carries no user identifier. |
| Paid features | Billing data (Stripe customer link, invoices that the tax rules keep for 6–7 years in Stripe). | New billing plan; add Stripe as a processor; update retention. |
| Anything that sends images or patient details to our servers | **Special-category data.** | A full DPIA, an Art. 9 condition, encryption at rest, access logging. Avoid if at all possible. |

---

## 10. Open questions

1. **Controller:** which legal entity is the controller, and where is it established (UK, NZ, elsewhere)? This decides the ICO fee, the Art. 27 representative and the privacy notice wording.
2. **Inactive accounts:** delete after 24 months without a sign-in (with a warning email), or keep until the user deletes them? Deleting is better for storage limitation and costs one email per account.
3. **Feedback:** keep the in-app form (an email to staff), or replace it with a plain `mailto:` link so nothing passes through our server?
4. **Email provider's log retention and location:** part of choosing the provider ([migration-plan §11.1](migration-plan.md)).
