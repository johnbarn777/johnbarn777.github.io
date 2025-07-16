import { test, expect } from '@playwright/test';

test('homepage layout has no horizontal overflow', async ({ page }) => {
  await page.goto('/');
  const hasOverflow = await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(hasOverflow).toBe(false);
});

