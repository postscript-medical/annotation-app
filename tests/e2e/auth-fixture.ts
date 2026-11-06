import { test as base } from '@playwright/test';
import { signIn, stubImages } from './annotate-support';
import { admin, clearRateLimits, sql } from './support';

// The auth fixture (2.7, replaces legacy `auth.setup.ts`): `page` is signed in as a seeded test
// user (scripts/seed-test-users.sql) with its password, with an illustration already chosen, so a
// spec starts where a returning user does. Snapshots stay stable because the user never changes.
//
// Workers and both browsers share this user at the same time, so specs using this fixture must not
// change its selection or sign out everywhere. A spec that does needs its own `confirmedAccount()`.

const TEST_USER = {
	authId: '22222222-2222-4222-8222-222222222222',
	email: 'test-user-2@example.com',
	password: 'local-test-password-two'
};

export const test = base.extend<object, { testUser: typeof TEST_USER }>({
	testUser: [
		// eslint-disable-next-line no-empty-pattern -- Playwright requires a destructuring pattern here.
		async ({}, use) => {
			const { error } = await admin.rpc('ensure_account', { p_auth_id: TEST_USER.authId });
			if (error) throw error;
			const [path] = await sql<{ specialty: string; sub: string; illustration: string }[]>`
				select s.specialty_id as specialty, s.sub_specialty_id as sub, i.illustration_id as illustration
				from public.specialty_sub_specialties as s
				join public.sub_specialty_illustrations as i using (sub_specialty_id)
				order by 1, 2, 3
				limit 1`;
			await sql`
				update public.user_app_states
				set selected_specialty_id = ${path.specialty},
					selected_sub_specialty_id = ${path.sub},
					selected_illustration_id = ${path.illustration}
				where user_id = (select id from public.users where auth_id = ${TEST_USER.authId})`;
			await use(TEST_USER);
		},
		{ scope: 'worker' }
	],

	page: async ({ page, testUser }, use) => {
		await clearRateLimits();
		await stubImages(page);
		await signIn(page, testUser.email, testUser.password);
		await use(page);
	}
});

export { expect } from '@playwright/test';
