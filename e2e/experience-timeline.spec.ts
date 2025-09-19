import { test, expect } from '@playwright/test';

const experienceCards = '#experience-list [data-filter-item="experience"]';
const filterButton = (value: string) => `#experience-filters button[data-filter-value="${value}"]`;

const expectCardCount = async (page, count: number) => {
  await expect(page.locator(`${experienceCards}:not([hidden])`)).toHaveCount(count);
};

test.describe('Experience timeline filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expectCardCount(page, 4);
  });

  test('activating the IT filter shows chips and narrows results', async ({ page }) => {
    const itFilter = page.locator(filterButton('IT Support'));
    const chipRegion = page.locator('#experience-active-filters [data-filter-chips]');

    await itFilter.click();

    await expect(itFilter).toHaveAttribute('aria-pressed', 'true');
    await expect(itFilter).toHaveClass(/is-active/);
    await expectCardCount(page, 1);
    await expect(chipRegion).toBeVisible();
    await expect(chipRegion.locator('button[data-filter-remove="IT Support"]')).toBeVisible();
    await expect(page.locator(`${experienceCards}:not([hidden]) h3`).first()).toContainText(
      'IT Desktop Support Specialist'
    );

    await chipRegion.locator('button[data-filter-clear]').click();

    await expect(itFilter).toHaveAttribute('aria-pressed', 'false');
    await expectCardCount(page, 4);
    await expect(chipRegion).toBeHidden();
  });

  test('combining filters expands the visible experiences', async ({ page }) => {
    const softwareFilter = page.locator(filterButton('Software'));
    await softwareFilter.click();
    await expectCardCount(page, 1);
    await expect(page.locator(`${experienceCards}:not([hidden]) h3`).first()).toContainText(
      'Full-Stack Software Developer'
    );

    const aiFilter = page.locator(filterButton('AI/ML'));
    await aiFilter.click();
    await expect(softwareFilter).toHaveAttribute('aria-pressed', 'true');
    await expect(aiFilter).toHaveAttribute('aria-pressed', 'true');
    await expectCardCount(page, 3);
    const chipWrapper = page.locator('#experience-active-filters [data-filter-chips]');
    await expect(chipWrapper).toContainText('Software');
    await expect(chipWrapper).toContainText('AI/ML');
  });

  test('experience grid adapts between single and double columns', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    const wideTops = await page.$$eval(
      '#experience-list [data-filter-item="experience"]',
      nodes => nodes.slice(0, 2).map(node => node.getBoundingClientRect().top)
    );
    expect(Math.abs(wideTops[0] - wideTops[1])).toBeLessThan(10);

    await page.setViewportSize({ width: 640, height: 900 });
    await page.waitForTimeout(150);
    const narrowTops = await page.$$eval(
      '#experience-list [data-filter-item="experience"]',
      nodes => nodes.slice(0, 2).map(node => node.getBoundingClientRect().top)
    );
    expect(narrowTops[1]).toBeGreaterThan(narrowTops[0] + 20);
  });
});
