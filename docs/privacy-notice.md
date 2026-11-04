# PostScript annotation app: privacy notice (draft)

> **For:** the marketing site, replacing https://www.postscriptmedical.com/privacy-policy when the new app goes live. The app links there; it has no privacy page of its own.
> **Source of truth:** [data-protection.md](data-protection.md) (inventory, processors, retention, rights). Keep this notice in step with it.
> **Status:** draft, 2026-11-04. **Not legal advice: have it reviewed before publishing.** Square brackets mark facts to confirm or decisions still open.
> **Changes from the current policy:** no payment details, names, phone numbers, postal addresses, marketing or targeted advertising (the app is free and collects an email address and a password only); images are no longer emailed through us; processors, retention periods and regulators are named.

---

## Who we are

The PostScript annotation app (app.postscriptmedical.com) is run by **PostScript Medical Limited**, 18 The Broadway East Lane, Wembley, Middlesex, HA9 8JU, England [company number: to add]. We are the controller of the personal data described here.

Questions, or requests about your data: **admin@postscriptmedical.com**. [If we appoint a separate privacy contact or NZ privacy officer, name them here.]

This notice covers the app only. Our marketing website has its own cookie policy.

## The short version

- To use the app you give us **an email address and a password**. That is all we ask for.
- We **never receive your annotated images, drawings or anything about your patients**. Annotating, saving and sharing all happen on your device.
- We use **no analytics, no advertising and no tracking**, and only the cookies needed to keep you signed in.
- You can **download your data** or **delete your account** yourself, at any time, from your account page.

## What we collect and why

| What | Why | Legal basis | How long we keep it |
|---|---|---|---|
| Your email address | It is your username; we send you sign-up confirmation and password-reset emails | Contract | Until you delete your account |
| Your password, stored only as a one-way hash (we never see or store the password itself) | Signing you in | Contract | Until you delete your account or change your password |
| When your account was created, confirmed and last signed in | Running your account | Contract | Until you delete your account |
| An email address and password from a sign-up that was **never confirmed** | Finishing sign-up | Steps before a contract | Deleted after **24 hours** |
| Your signed-in sessions: personal or shared device, when each started and was last used | Signing you out after the time limit you chose | Contract | Until the session ends (at most 30 days) |
| Your last chosen specialty, sub-specialty and illustration | Opening the app where you left off | Contract | Until you delete your account |
| Security records kept by our authentication provider: sign-in events with an IP address [and possibly the email address: to verify] | Protecting accounts and investigating misuse | Legitimate interests (security) | [Retention to confirm: these records are kept by Supabase and may outlast account deletion] |
| Short-lived counters made from a scrambled (keyed hash) form of your email address or network | Limiting repeated sign-in attempts and email requests | Legitimate interests (security) | **24 hours** |
| Messages you send us through the feedback form, with your email address so we can reply | Support | Legitimate interests | Deleted **12 months** after the matter is resolved |
| Technical logs kept by our hosting providers (IP address, browser, page requested) | Running and securing the service | Legitimate interests | As set by the provider; typically days |
| Email delivery records (recipient, message, delivery status) | Making sure our emails arrive | Legitimate interests | **28 days** |
| Encrypted backups of our database | Recovering from a failure | Legitimate interests | **7 days** |

[Inactive accounts: decide whether accounts with no sign-in for 24 months are deleted, after a warning email, or kept until you delete them (data-protection open question 2), and say so here.]

## What we don't collect

- Your name, job, employer, organisation or country.
- **Anything you draw or type in the app, and any patient information.** It stays in your browser and is gone when you leave the page.
- Patients' email addresses. When you share an image, it goes from your device to the place you choose (your email app, a messaging app, a printer). **You, or your employer, are responsible for that communication with your patient; we are not part of it.**
- Payment details: the app is free.
- Anything for analytics, advertising or tracking.

## Cookies

We use two cookies, both **strictly necessary**, so we don't ask for consent:

| Cookie | Purpose | How long |
|---|---|---|
| `sb-…-auth-token` | Keeps you signed in | 30 days on a personal device; until you close the browser on a shared device |
| `ps_session_mode` | Remembers whether you chose "personal" or "shared device", so the sign-in cookie lasts the right time | As above |

No other cookies, and no local storage used to identify you.

## Who processes your data for us

| Provider | What they do | Where |
|---|---|---|
| Supabase | Accounts and database | Data stored in London (UK); Supabase is a US company |
| Netlify | Hosting the app | US and worldwide edge network |
| Lettermint | Sending our confirmation, password-reset and feedback emails | EU |
| GitHub | Storing our encrypted backups | US |

Each works under a data processing agreement. Where data may be handled outside the UK or EU, the transfer is covered by the UK/EU standard contractual clauses.

**Breached-password check:** when you choose a password, our server checks whether it has appeared in a known data breach using the Have I Been Pwned "Pwned Passwords" service. Only the first five characters of a one-way hash of the password are sent. Your password, your email address and your IP address are never sent, so Have I Been Pwned receives no personal data about you.

We do not sell or share your data with anyone else, except where the law requires it.

## Your rights

You can:

- **Get a copy of your data:** account page → *Download my data* (a JSON file).
- **Delete your account:** account page → *Delete my account*. Everything linked to your account is deleted immediately; our backups age out within 7 days.
- **Correct your data:** the only data is your email address. To change it, delete your account and sign up with the new address, or ask us.
- **Object to or restrict processing**, or ask anything else about your data: email admin@postscriptmedical.com. We reply within one month.

## Complaints

Please contact us first. You can also complain to a data protection regulator:

- **UK:** the Information Commissioner's Office (ICO), ico.org.uk.
- **New Zealand:** the Office of the Privacy Commissioner, privacy.org.nz.
- **EU:** the data protection authority where you live or work.

## Changes

We will update this notice when the app or the providers change, and tell account holders by email about changes that matter.

Last updated: [date of publication]
