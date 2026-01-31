import { test, expect } from '@playwright/test';

test('backend smoke test', async ({ page }) => {
  // Strapi Admin
  await page.goto('/admin');
  // Expect title to contain Strapi or check for a known element
  // Since we can't easily add data-testid to Strapi Admin, we use title or text
  await expect(page).toHaveTitle(/Strapi/i);
});
