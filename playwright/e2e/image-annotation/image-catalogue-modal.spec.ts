import { test, expect } from "@playwright/test";
import percySnapshot from "@percy/playwright";

import { ImageAnnotationPage } from "../shared/image-annotation-page";

test.beforeEach(async ({ page }) => {
  const imageAnnotationPage = new ImageAnnotationPage(page);

  await imageAnnotationPage.load();

  await imageAnnotationPage.openCatalogue();
});

test("Open catalogue", async ({ page }) => {
  await percySnapshot(page, "Image catalogue modal");
});

test("Close catalogue", async ({ page }) => {
  const closeCatalogue = page.getByTestId("close-catalogue");

  await closeCatalogue.hover();

  await closeCatalogue.click();

  await expect(page.getByRole("heading", { name: "Illustration catalogue" })).not.toBeVisible();

  await expect(page.getByTestId("tooltip")).not.toBeVisible();
});