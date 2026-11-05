import { afterAll, describe, expect, it } from 'vitest';
import { load as appLayoutLoad } from '../../src/routes/(app)/+layout.server';
import {
	actions as annotateActions,
	load as annotateLoad
} from '../../src/routes/(app)/annotate/+page.server';
import {
	actions as accountActions,
	load as accountLoad
} from '../../src/routes/(app)/account/+page.server';
import { POST as exportPost } from '../../src/routes/(app)/account/export/+server';
import { actions as passwordActions } from '../../src/routes/(app)/account/password/+page.server';
import { load as authLayoutLoad } from '../../src/routes/(auth)/+layout.server';
import { actions as forgotActions } from '../../src/routes/(auth)/forgot-password/+page.server';
import { actions as resendActions } from '../../src/routes/(auth)/resend-confirmation/+page.server';
import { actions as signInActions } from '../../src/routes/(auth)/sign-in/+page.server';
import { actions as signUpActions } from '../../src/routes/(auth)/sign-up/+page.server';
import {
	actions as confirmActions,
	load as confirmLoad
} from '../../src/routes/auth/confirm/+page.server';
import { actions as logoutActions } from '../../src/routes/logout/+page.server';
import {
	actions as resetActions,
	load as resetLoad
} from '../../src/routes/reset-password/+page.server';
import { adminClient, sqlClient } from './helpers';
import { cells, matrixHelpers, type Row } from './matrix';

// auth-spec §7.3, the source of truth for authorization: every row × caller that exists so far.
// Still to come: feedback (2.6). (Privacy and terms are on the
// marketing site, not in the app.) /admin/** → 404 is checked end to end (tests/e2e/removed-scope.e2e.ts).

const admin = adminClient();
const sql = sqlClient();
const created: string[] = [];
const { check } = matrixHelpers(admin, sql, created);

afterAll(async () => {
	for (const id of created) await admin.auth.admin.deleteUser(id);
	await sql.end();
});

const toApp = { redirect: '/annotate' } as const;
const toForgot = { redirect: '/forgot-password' } as const;
const run = { allow: true } as const;
const email = () => `matrix-${crypto.randomUUID()}@example.com`;

const signedOutPages: Row[] = [
	'/sign-up',
	'/sign-in',
	'/forgot-password',
	'/resend-confirmation'
].map((path) => ({
	name: `${path} (page)`,
	path,
	handler: authLayoutLoad,
	expect: { anon: run, user: toApp }
}));

const rows: Row[] = [
	...signedOutPages,
	{
		name: '/sign-in (action)',
		path: '/sign-in',
		handler: signInActions.default,
		fields: () => ({ email: email(), password: 'not a real password' }),
		expect: { anon: run, user: toApp }
	},
	{
		name: '/sign-up (action)',
		path: '/sign-up',
		handler: signUpActions.default,
		// Too short: the action answers without calling HIBP or sending email.
		fields: () => ({ email: email(), password: 'short' }),
		expect: { anon: run, user: toApp }
	},
	{
		name: '/forgot-password (action)',
		path: '/forgot-password',
		handler: forgotActions.default,
		fields: () => ({ email: email() }),
		expect: { anon: run, user: toApp }
	},
	{
		name: '/resend-confirmation (action)',
		path: '/resend-confirmation',
		handler: resendActions.default,
		fields: () => ({ email: email() }),
		expect: { anon: run, user: toApp }
	},
	{
		name: '/auth/confirm (page)',
		path: '/auth/confirm?token_hash=0123456789abcdef&type=signup',
		handler: confirmLoad,
		expect: { anon: run, user: run }
	},
	{
		name: '/auth/confirm (verify)',
		path: '/auth/confirm',
		handler: confirmActions.default,
		fields: () => ({ token_hash: '0123456789abcdef', type: 'signup' }),
		expect: { anon: run, user: run }
	},
	{
		name: '/reset-password (page)',
		path: '/reset-password',
		handler: resetLoad,
		// A signed-in user without a fresh recovery marker is refused too; the allowed case
		// (recovery session) is in auth-flows.test.ts.
		expect: { anon: toForgot, user: toForgot }
	},
	{
		name: '/reset-password (action)',
		path: '/reset-password',
		handler: resetActions.default,
		fields: () => ({ password: 'copper meadow sparrow tuesday' }),
		expect: { anon: toForgot, user: toForgot }
	},
	{
		name: 'POST /logout',
		path: '/logout',
		handler: logoutActions.default,
		fields: () => ({}),
		expect: {
			anon: { redirect: '/sign-in' },
			user: {
				redirect: '/sign-in',
				check: async ({ self }) => {
					const [{ count }] = await sql`
						select count(*)::int from public.session_policies where session_id = ${self!.sessionId}
					`;
					expect(count).toBe(0);
				}
			}
		}
	},
	{
		name: '/account (page)',
		path: '/account',
		handler: accountLoad,
		expect: { anon: { redirect: '/sign-in?next=%2Faccount' }, user: run }
	},
	{
		name: '/account/password (page)',
		path: '/account/password',
		handler: appLayoutLoad,
		expect: { anon: { redirect: '/sign-in?next=%2Faccount%2Fpassword' }, user: run }
	},
	{
		name: '/account/password (change)',
		path: '/account/password',
		handler: passwordActions.default,
		// A wrong current password: the action runs and refuses it.
		fields: () => ({
			currentPassword: 'not my password',
			newPassword: 'copper meadow sparrow tuesday'
		}),
		expect: { anon: { redirect: '/sign-in?next=%2Faccount%2Fpassword' }, user: run }
	},
	{
		name: 'account?/signOutSession',
		path: '/account?/signOutSession',
		handler: accountActions.signOutSession,
		fields: ({ self, other }) => ({
			sessionId: other?.sessionId ?? self?.sessionId ?? crypto.randomUUID()
		}),
		expect: {
			anon: { redirect: '/sign-in?next=%2Faccount' },
			// Own session (this one): signed out.
			user: { redirect: '/sign-in' },
			// Someone else's session: 404, and it stays.
			other: {
				status: 404,
				check: async ({ other }) => {
					const [{ count }] = await sql`
						select count(*)::int from public.session_policies where session_id = ${other!.sessionId}
					`;
					expect(count).toBe(1);
				}
			}
		}
	},
	{
		name: 'account?/signOutEverywhere',
		path: '/account?/signOutEverywhere',
		handler: accountActions.signOutEverywhere,
		fields: () => ({}),
		expect: { anon: { redirect: '/sign-in?next=%2Faccount' }, user: { redirect: '/sign-in' } }
	},
	{
		name: 'POST /account/export',
		path: '/account/export',
		handler: exportPost,
		fields: () => ({}),
		expect: { anon: { redirect: '/sign-in?next=%2Faccount%2Fexport' }, user: run }
	},
	{
		name: 'account?/delete',
		path: '/account?/delete',
		handler: accountActions.delete,
		// A wrong password: the action runs and refuses it (deletion itself: account.test.ts).
		fields: ({ self }) => ({
			password: 'not my password',
			confirmEmail: `${self?.userId}@example.com`
		}),
		expect: { anon: { redirect: '/sign-in?next=%2Faccount' }, user: run }
	},
	{
		name: '/annotate (page)',
		path: '/annotate',
		handler: appLayoutLoad,
		expect: { anon: { redirect: '/sign-in?next=%2Fannotate' }, user: run }
	},
	{
		name: '/annotate (page load)',
		path: '/annotate',
		handler: annotateLoad,
		expect: { anon: { redirect: '/sign-in?next=%2Fannotate' }, user: run }
	},
	// Ids not in the catalogue: the action runs and refuses them (saving: annotate.test.ts). There
	// is no user id in the request, so there is no "other user's row" case to try.
	{
		name: 'annotate?/chooseSpecialty',
		path: '/annotate?/chooseSpecialty',
		handler: annotateActions.chooseSpecialty,
		fields: () => ({ specialtyId: crypto.randomUUID() }),
		expect: { anon: { redirect: '/sign-in?next=%2Fannotate' }, user: run }
	},
	{
		name: 'annotate?/chooseIllustration',
		path: '/annotate?/chooseIllustration',
		handler: annotateActions.chooseIllustration,
		fields: () => ({
			specialtyId: crypto.randomUUID(),
			subSpecialtyId: crypto.randomUUID(),
			illustrationId: crypto.randomUUID()
		}),
		expect: { anon: { redirect: '/sign-in?next=%2Fannotate' }, user: run }
	}
];

describe('authorization matrix (auth-spec §7.3)', () => {
	it.each(cells(rows))('%s as %s', async (_name, caller, row, expected) => {
		await check(row, caller, expected);
	});
});
