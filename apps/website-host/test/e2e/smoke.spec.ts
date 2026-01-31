import { test, expect } from '@playwright/test';

test('website-host smoke test', async ({ page }) => {
  await page.goto('/');
  const appRoot = page.getByTestId('website-host-root');
  await expect(appRoot).toBeVisible();
});
