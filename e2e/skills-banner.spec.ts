import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const gotoHome = async (page: Page) => {
  await page.goto('/');
  await page.waitForSelector('[data-skills-banner]');
};

test('renders at least ten primary skill pills from data', async ({ page }) => {
  await gotoHome(page);
  const pills = page.locator('[data-skills-list] [data-skill-name]');
  expect(await pills.count()).toBeGreaterThanOrEqual(10);
});

test('mobile paddles toggle disabled state when scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoHome(page);

  const prev = page.locator('[data-skills-banner] [data-paddle="prev"]');
  const next = page.locator('[data-skills-banner] [data-paddle="next"]');
  const list = page.locator('[data-skills-list]');

  await expect(prev).toBeDisabled();
  await expect(next).toBeEnabled();

  await next.click();
  await page.waitForTimeout(200);

  await expect(prev).toBeEnabled();
  const scrollLeft = await list.evaluate(el => el.scrollLeft);
  expect(scrollLeft).toBeGreaterThan(0);
});

test('keyboard access focuses pills without scroll jumps', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoHome(page);

  const list = page.locator('[data-skills-list]');
  const firstPill = page.locator('[data-skill-name]').first();

  for (let i = 0; i < 10; i += 1) {
    if (await firstPill.evaluate(el => document.activeElement === el)) {
      break;
    }
    await page.keyboard.press('Tab');
  }

  await expect(firstPill).toBeFocused();

  const before = await list.evaluate(el => el.scrollLeft);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(50);
  const after = await list.evaluate(el => el.scrollLeft);
  expect(Math.abs(after - before)).toBeLessThanOrEqual(1);
});

test('prefers-reduced-motion avoids transform animations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await gotoHome(page);

  const pill = page.locator('[data-skill-name]').first();
  const transitionProperty = await pill.evaluate(el => getComputedStyle(el).transitionProperty);
  expect(transitionProperty).not.toMatch(/transform/);
});
