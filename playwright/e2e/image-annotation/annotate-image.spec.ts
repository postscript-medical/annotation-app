import { test, expect } from "@playwright/test";
import percySnapshot from "@percy/playwright";

import { TOOL_SHAPE, TOOL_TEXT } from "../../../src/constants/defaults";
import { ImageAnnotationPage } from "../shared/image-annotation-page";

test.beforeEach(async ({ page }) => {
  const imageAnnotationPage = new ImageAnnotationPage(page);

  await imageAnnotationPage.load();
});

test("Load", async ({ page }) => {
  await page.waitForLoadState('networkidle');

  await percySnapshot(page, "Image annotation page");
});

test("Draw a line", async ({ page }) => {
  await page.mouse.move(300, 300);
  await page.mouse.down();
  await page.mouse.move(310, 310);
  await page.mouse.move(320, 320);
  await page.mouse.move(330, 330);
  await page.mouse.move(340, 340);
  await page.mouse.move(350, 350);
  await page.mouse.move(360, 360);
  await page.mouse.move(370, 370);
  await page.mouse.move(380, 380);
  await page.mouse.move(390, 390);
  await page.mouse.move(400, 400);
  await page.mouse.up();

  await percySnapshot(page, "Image annotation - Draw a line");
});


test("Add typed text", async ({ page }) => {
  const text = "Typed text test";

  await page.getByTestId(TOOL_TEXT).click();

  await page.mouse.click(500, 500);

  // Input is expected to be auto-focused
  await page.keyboard.type(text);

  await expect(page.locator("textarea")).toHaveValue(text);

  await percySnapshot(page, "Image annotation - Type some text");
});

test("Draw a square", async ({ page }) => {
  await page.getByTestId(TOOL_SHAPE).click();

  await page.mouse.move(300, 300);
  await page.mouse.down();
  await page.mouse.move(310, 310);
  await page.mouse.move(320, 320);
  await page.mouse.move(330, 330);
  await page.mouse.move(340, 340);
  await page.mouse.move(350, 350);
  await page.mouse.move(360, 360);
  await page.mouse.move(370, 370);
  await page.mouse.move(380, 380);
  await page.mouse.move(390, 390);
  await page.mouse.move(400, 400);
  await page.mouse.up();

  await percySnapshot(page, "Image annotation - Draw a square");
});