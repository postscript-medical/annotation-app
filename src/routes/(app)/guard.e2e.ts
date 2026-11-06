import { expect, test } from '@playwright/test';

// The (app) guard on the production build, signed out. Signed-in journeys come with the sign-in
// flows (1.10, 1.11).

test('a signed-out visitor to /annotate is sent to sign in, with next', async ({ request }) => {
	const response = await request.get('/annotate', { maxRedirects: 0 });
	expect(response.status()).toBe(303);
	expect(response.headers()['location']).toBe('/?next=%2Fannotate');
	expect(response.headers()['x-content-type-options']).toBe('nosniff');
	// No page and no catalogue data before the redirect.
	expect(await response.text()).not.toContain('subSpecialties');
});

test('client-side data requests are redirected too', async ({ request }) => {
	const response = await request.get('/annotate/__data.json', { maxRedirects: 0 });
	expect(response.ok()).toBe(true);
	const body = await response.json();
	expect(body).toMatchObject({ type: 'redirect', location: '/?next=%2Fannotate' });
});
