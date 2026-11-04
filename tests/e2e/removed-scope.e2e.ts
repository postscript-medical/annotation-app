import { expect, test } from '@playwright/test';

// The staff/admin area is out of scope (execution plan, scope change 2): its routes must not
// exist. Kept outside src/ because scripts/check-removed-scope.sh greps src/ for "/admin".
test.describe('removed scope', () => {
	for (const path of ['/admin', '/admin/specialties']) {
		test(`${path} returns 404 with a generic message`, async ({ request }) => {
			const response = await request.get(path);
			expect(response.status()).toBe(404);
			expect(response.headers()['x-content-type-options']).toBe('nosniff');
			expect(await response.text()).toContain("We couldn't find that page.");
		});
	}
});
