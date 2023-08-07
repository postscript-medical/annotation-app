import { test, expect } from '@playwright/experimental-ct-svelte';
import SignUpPlanCard from '../../src/components/SignUpPlanCard.svelte';
import { individualSubscriptionPlan } from '../fixtures/sign-up-plans';

test.use({ viewport: { width: 640, height: 500 } });

test("Individual subscription card", async ({ mount }) => {
  const component = await mount(
    SignUpPlanCard,
    {
      props: {
        plan: individualSubscriptionPlan
      }
    }
  );

  await expect(component).toContainText('Individual');
});