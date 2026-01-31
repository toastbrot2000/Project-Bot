import { test, expect } from '@playwright/test';

test('user-app smoke test', async ({ page }) => {
  await page.goto('/');
  const appRoot = page.getByTestId('user-app-root');
  await expect(appRoot).toBeVisible();
});
