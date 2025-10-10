import { test, expect, Page } from '@playwright/test';

const gotoHome = async (page: Page) => {
  await page.goto('/');
  await expect(page.locator('#prowess')).toBeVisible();
  await page.evaluate(() => document.getElementById('prowess')?.scrollIntoView({ behavior: 'auto', block: 'center' }));
};

test.describe('Coding Prowess panel', () => {
  test('renders tabs and toggles panels via keyboard', async ({ page }) => {
    await gotoHome(page);
    const tablist = page.locator('#prowess [role="tablist"]');
    const tabs = page.locator('#prowess [role="tab"]');
    await expect(tablist).toHaveCount(1);
    await expect(tabs).toHaveCount(4);
    await expect(page.locator('#prowess [role="tab"]').first()).toHaveAttribute('aria-selected', 'true');

    await page.locator('#prowess [role="tab"]').first().focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(page.locator('#prowess [role="tab"]').nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#prowess [data-prowess-panel="repos"]')).toBeVisible();
    await expect(page.locator('#prowess [data-prowess-panel="highlights"]')).toHaveAttribute('hidden', '');
  });

  test('repos sparkline exposes accessible label', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#prowess [role="tab"]').nth(1).click();
    const svgs = page.locator('#prowess [data-prowess-panel="repos"] svg[role="img"]');
    await expect.poll(async () => svgs.count(), { message: 'Waiting for at least one sparkline' }).toBeGreaterThan(0);
    await expect(svgs.first()).toHaveAttribute('aria-label', /Weekly commits/);
  });

  test('tab buttons surface active styling when selected', async ({ page }) => {
    await gotoHome(page);
    const highlightsTab = page.locator('#prowess [role="tab"]').first();
    const reposTab = page.locator('#prowess [role="tab"]').nth(1);

    const initialBackground = await highlightsTab.evaluate(el => getComputedStyle(el).backgroundImage);
    expect(initialBackground).toContain('linear-gradient');

    await reposTab.click();
    await expect(reposTab).toHaveAttribute('aria-selected', 'true');
    await expect(highlightsTab).toHaveAttribute('aria-selected', 'false');

    const reposBackground = await reposTab.evaluate(el => getComputedStyle(el).backgroundImage);
    const highlightsBackground = await highlightsTab.evaluate(el => getComputedStyle(el).backgroundImage);

    expect(reposBackground).toContain('linear-gradient');
    expect(highlightsBackground).not.toContain('linear-gradient');
  });

  test('empty states do not crash when data missing', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#prowess [role="tab"]').nth(2).click();
    await expect(page.locator('#prowess [data-prowess-panel="leetcode"]')).toBeVisible();
  });
});
