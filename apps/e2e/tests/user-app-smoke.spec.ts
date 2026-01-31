import { test, expect } from '@playwright/test';

test('user-app smoke test - flow completion', async ({ page }) => {
  await page.goto('/');

  // 1. Initial greeting
  await expect(page.getByText('Hey there 👋! First things first—what brings you to Germany?')).toBeVisible();

  // 2. Click "Studying"
  await page.getByRole('button', { name: '🎓 Studying' }).click();

  // 3. Next question
  await expect(page.getByText('Awesome! Do you have a confirmed acceptance letter or job offer already?')).toBeVisible();

  // 4. Click "Yes, ready to roll!"
  await page.getByRole('button', { name: '✅ Yes, ready to roll!' }).click();

  // 5. Next question: Visit Germany
  await expect(page.getByText('Have you ever visited Germany or the Schengen area before?')).toBeVisible();

  // 6. Click "No, first time!"
  await page.getByRole('button', { name: '❌ No, first time!' }).click();

  // 7. Next: City or Countryside
  await expect(page.getByText('Do you plan to live in a city 🏙️ or countryside 🌳?')).toBeVisible();

  // 8. Click "Definitely city!"
  await page.getByRole('button', { name: '🏙️ Definitely city!' }).click();

  // 9. Next: Family or Pets
  await expect(page.getByText('Are you bringing your family or pets along 🐶🐱?')).toBeVisible();

  // 10. Click "Just me!"
  await page.getByRole('button', { name: '🚶 Just me!' }).click();

  // 11. Results page should be visible
  await expect(page.getByText('Great news! Here is what you need for your journey to Germany')).toBeVisible();
  await expect(page.getByText('University Acceptance Letter')).toBeVisible();
});
