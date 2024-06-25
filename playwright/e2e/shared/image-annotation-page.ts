import { expect, type Locator, type Page } from '@playwright/test';

import { annotate } from "../../../src/constants/urls";
import { TOOL_CATALOGUE } from "../../../src/constants/defaults";

export class ImageAnnotationPage {
  readonly page: Page;
  readonly catalogueButton: Locator;

  constructor (page: Page) {
    this.page = page;
    this.catalogueButton = this.page.getByTestId(TOOL_CATALOGUE);
  }

  async load () {
    const illustration = this.page.waitForResponse("**/images/annotation-app/illustrations/**/*");

    await this.page.goto(`/#/${annotate}`);

    await illustration;

    await expect(this.page.getByTestId("loading-overlay")).not.toBeVisible();
  }

  async openCatalogue () {
    await this.catalogueButton.click();

    await this.page.waitForLoadState('networkidle');

    await expect(this.page.getByRole("heading", { name: "Illustration catalogue" })).toBeVisible();
  }

  async closeCatalogue () {}
}