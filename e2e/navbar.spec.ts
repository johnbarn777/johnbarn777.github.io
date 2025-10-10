import { test, expect } from '@playwright/test';

test.describe('navbar mobile toggle', () => {
  test.use({ viewport: { width: 360, height: 720 } });

  test('opens and closes the menu via toggle', async ({ page }) => {
    await page.goto('/');

    const nav = page.locator('nav.site-nav');
    const toggle = page.locator('[data-nav-toggle]');
    const panel = page.locator('[data-nav-panel]');

    await page.waitForFunction(() => (window as any).__navInitialized === true);
    await expect(toggle).toBeVisible();
    await expect(panel).toHaveAttribute('data-nav-state', 'closed');
    await expect(panel).not.toBeVisible();

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toHaveAttribute('data-nav-state', 'open');
    await expect(panel).toBeVisible();

    const firstLink = page.locator('.nav-links .nav-link').first();
    await firstLink.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).toHaveAttribute('data-nav-state', 'closed');
    await expect(panel).not.toBeVisible();
  });
});

test.describe('navbar desktop layout', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('displays navigation inline without toggle button', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('[data-nav-toggle]')).not.toBeVisible();
    await expect(page.locator('[data-nav-panel]')).toBeVisible();
    await expect(page.locator('.nav-links li')).toHaveCount(3);
  });
});
