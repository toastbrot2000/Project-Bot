import { test, expect } from '@playwright/test';

test('admin-app smoke test', async ({ page }) => {
  await page.goto('/');
  const appRoot = page.getByTestId('app-root');
  await expect(appRoot).toBeVisible();
});
