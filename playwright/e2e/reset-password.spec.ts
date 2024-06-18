import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

const resetUrl = '/#/reset-password';
const verifyUrl = '/.netlify/identity/verify';

test('No token provided', async ({ page, baseURL }) => {
  const url = (baseURL || '') + '#/';

  await page.goto(resetUrl);

  await expect(page).toHaveURL(url);
});

test('Invalid token', async ({ page }) => {
  const responsePromise = page.waitForResponse(verifyUrl);

  await page.goto(resetUrl + '?token=invalid');

  await responsePromise;

  await expect(page.getByText('User not found')).toBeVisible();

  await percySnapshot(page, 'Reset password - invalid token')
});

// test('Verify the reset password form', async ({ page }) => {
//   await page.route(verifyUrl, (route) => {
//     /**
//      * This is not working as GoTrue tries to create a user
//      * immediately after sending the verify token.
//      * We need to be able to mock a tokenResponse to create a
//      * new user inside GoTrue-js
//      */
//     route.fulfill({
//       body: JSON.stringify(
//         {
//           response: {
//             api: {
//               apiURL: "https://example.netlify.com/.netlify/identity",
//               _sameOrigin: true,
//               defaultHeaders: {}
//             },
//             url: () => "https://example.netlify.com/.netlify/identity",
//             token: {
//               access_token: "example-jwt-token",
//               token_type: "bearer",
//               expires_in: 3600,
//               refresh_token: "example-refresh_token",
//               expires_at: 1526107729000
//             },
//             id: "example-id",
//             aud: "",
//             role: "",
//             email: "example@netlify.com",
//             confirmed_at: "2018-05-12T05:48:49Z",
//             invited_at: "2018-05-04T23:40:00Z",
//             recovery_sent_at: "2018-05-12T05:48:13Z",
//             app_metadata: {
//               provider: "email"
//             },
//             user_metadata: {},
//             created_at: "2018-05-04T23:40:00Z",
//             updated_at: "2018-05-04T23:40:00Z"
//           }
//         }
//       )
//     })
//   });

//   await page.goto(resetUrl + '?token=3nYODsNWv_ogD5ncla7OCw');

//   await expect(page.getByText("Validation successfull.")).toBeVisible();

//   await percySnapshot(page, 'Reset password - new password form');
// });
