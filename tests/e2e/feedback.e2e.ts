import { expect, test, type Page } from '@playwright/test';
import {
	chooseFirstSpecialty,
	catalogue,
	signIn,
	stubImages,
	watchProblems
} from './annotate-support';
import { cleanUp, clearRateLimits, confirmedAccount, emailContaining } from './support';

// Feedback from /annotate (2.6): the modal, through `?/feedback`, to the local Mailpit.

test.beforeEach(async ({ page }) => {
	await clearRateLimits();
	await stubImages(page);
});
test.afterAll(cleanUp);

async function openFeedback(page: Page) {
	const { email } = await confirmedAccount();
	await signIn(page, email);
	await chooseFirstSpecialty(page);
	await page.getByTestId('close-catalogue').click();
	await expect(catalogue(page)).toBeHidden();
	await page.getByRole('button', { name: 'Feedback?' }).click();
	const modal = page.getByRole('dialog', { name: /feedback or would like to report a bug/ });
	await expect(modal).toBeVisible();
	return { email, modal };
}

test('sends feedback to staff, replying to the account', async ({ page }) => {
	const problems = watchProblems(page);
	const { email, modal } = await openFeedback(page);
	const marker = `e2e-feedback-${crypto.randomUUID()}`;

	await expect(modal.getByRole('button', { name: 'Send' })).toBeDisabled();
	await modal.getByLabel('Your message').fill(`${marker}: the eraser <b>sticks</b>`);
	await modal.getByRole('button', { name: 'Send' }).click();

	await expect(page.getByRole('dialog', { name: 'Thank you.' })).toBeVisible();
	await expect(page.getByRole('status')).toContainText('Your message has been sent.');
	const mail = await emailContaining(marker);
	expect(mail?.Subject).toBe('[PostScript] Feedback');
	expect(mail?.ReplyTo.map((to) => to.Address)).toEqual([email]);
	expect(mail?.Text).toContain(`${marker}: the eraser <b>sticks</b>`);

	// The footer's Close (the X is also named "Close").
	await page.getByRole('dialog').locator('footer').getByRole('button', { name: 'Close' }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
	expect(problems).toEqual([]);
});

test('a failed send shows an error and keeps the message', async ({ page }) => {
	const { modal } = await openFeedback(page);
	await page.route('**/annotate?/feedback', (route) => route.abort());

	await modal.getByLabel('Your message').fill('please keep this');
	await modal.getByRole('button', { name: 'Send' }).click();

	await expect(modal.getByRole('alert')).toContainText("We couldn't send your feedback");
	await expect(modal.getByLabel('Your message')).toHaveValue('please keep this');
});
