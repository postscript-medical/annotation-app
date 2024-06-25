import { expect, type Locator, type Page } from '@playwright/test';

import {
  privacy_policy,
  terms_and_conditions
} from '../../../src/constants/urls';

export class LegalLinks {
  readonly page: Page;
  readonly termsLink: Locator;
  readonly privacyLink: Locator;

  constructor (page: Page) {
    this.page = page;
    this.termsLink = page.locator('a', { hasText: 'terms of use' });
    this.privacyLink = page.locator('a', { hasText: 'privacy policy' });
  }

  async verifyLinks () {
    await expect(this.termsLink).toHaveAttribute('href', terms_and_conditions);

    await expect(this.privacyLink).toHaveAttribute('href', privacy_policy);
  }
}