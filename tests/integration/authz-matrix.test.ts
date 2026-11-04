import { afterAll, describe, expect, it } from 'vitest';
import { load as appLayoutLoad } from '../../src/routes/(app)/+layout.server';
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
// Still to come: /privacy and /terms (1.13), /account/** (1.12), annotate actions and feedback
// (2.4, 2.6). /admin/** → 404 is checked end to end (tests/e2e/removed-scope.e2e.ts).

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
		name: '/annotate (page)',
		path: '/annotate',
		handler: appLayoutLoad,
		expect: { anon: { redirect: '/sign-in?next=%2Fannotate' }, user: run }
	}
];

describe('authorization matrix (auth-spec §7.3)', () => {
	it.each(cells(rows))('%s as %s', async (_name, caller, row, expected) => {
		await check(row, caller, expected);
	});
});
