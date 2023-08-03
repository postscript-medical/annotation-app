import { test, expect } from '@playwright/experimental-ct-svelte';
import SignUpPlans from '../../src/components/SignUpPlans.svelte';
import { individualSubscriptionPlan } from '../fixtures/sign-up-plans';

test.use({ viewport: { width: 640, height: 500 } });

test('Mocked successful response', async ({ mount, page }) => {
  await page.route(
    ".netlify/functions/get-subscription-plans",
    (route) => {
      route.fulfill(
        {
          body: JSON.stringify(
            {
              subscriptionPlans: {
                data: [individualSubscriptionPlan]
              }
            }
          )
        }
      );
    }
  );
  const component = await mount(SignUpPlans);
  await expect(component).toContainText('On');
});