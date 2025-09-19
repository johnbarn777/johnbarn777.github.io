import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const getVisibleItems = async (page: Page, selector: string) => {
  return page.locator(`${selector}:not([hidden])`).count();
};

test.describe('Projects filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('defaults to all projects with no active chips', async ({ page }) => {
    const allButton = page.locator('#project-filters button[data-filter-value="All"]');
    await expect(allButton).toHaveAttribute('aria-pressed', 'true');

    const total = await page.locator('#projects-gallery [data-filter-item="projects"]').count();
    const visible = await getVisibleItems(page, '#projects-gallery [data-filter-item="projects"]');
    expect(visible).toBe(total);

    await expect(page.locator('#project-active-filters [data-filter-count]')).toContainText(
      `Showing ${total} of ${total}`
    );

    await expect(page.locator('#project-active-filters [data-filter-chips]')).toBeHidden();
  });

  test('supports multi-select filters, chips, and URL sync', async ({ page }) => {
    const mlButton = page.locator('#project-filters button[data-filter-value="ML"]');
    const mobileButton = page.locator('#project-filters button[data-filter-value="Mobile"]');
    const allButton = page.locator('#project-filters button[data-filter-value="All"]');

    await mlButton.click();

    await expect(mlButton).toHaveAttribute('aria-pressed', 'true');
    await expect(allButton).toHaveAttribute('aria-pressed', 'false');

    const chipWrapper = page.locator('#project-active-filters [data-filter-chips]');
    expect(await getVisibleItems(page, '#projects-gallery [data-filter-item="projects"]')).toBe(1);
    await expect(chipWrapper).toBeVisible();
    await expect(chipWrapper).toContainText('ML');

    await mobileButton.click();
    expect(await getVisibleItems(page, '#projects-gallery [data-filter-item="projects"]')).toBe(2);
    await expect(chipWrapper).toContainText('Mobile');

    await page.locator('#project-active-filters button[data-filter-remove="Mobile"]').click();
    expect(await getVisibleItems(page, '#projects-gallery [data-filter-item="projects"]')).toBe(1);

    await page.locator('#project-active-filters button[data-filter-clear]').click();

    expect(await getVisibleItems(page, '#projects-gallery [data-filter-item="projects"]')).toBe(
      await page.locator('#projects-gallery [data-filter-item="projects"]').count()
    );

    await expect(allButton).toHaveAttribute('aria-pressed', 'true');

    await page.waitForFunction(() => window.location.search.includes('p=') === false);
  });

  test('shows empty state for filters with no matches', async ({ page }) => {
    const toolsButton = page.locator('#project-filters button[data-filter-value="Tools"]');
    await toolsButton.click();

    const gallery = page.locator('#projects-gallery');
    await expect(gallery).toHaveAttribute('hidden', '');
    await expect(gallery).toHaveClass(/is-hidden/);

    const empty = page.locator('#projects-empty');
    await expect(empty).toBeVisible();
    await expect(page.locator('#projects-count')).toContainText('Showing 0');

    await page.locator('#projects-empty button[data-filter-clear]').click();
    await expect(page.locator('#projects-gallery')).toBeVisible();
    await expect(page.locator('#projects-empty')).toHaveAttribute('hidden', '');
  });
});


test.describe('Experience filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('defaults to all experiences', async ({ page }) => {
    const allButton = page.locator('#experience-filters button[data-filter-value="All"]');
    await expect(allButton).toHaveAttribute('aria-pressed', 'true');

    const total = await page.locator('#experience-list [data-filter-item="experience"]').count();
    const visible = await getVisibleItems(page, '#experience-list [data-filter-item="experience"]');
    expect(visible).toBe(total);
    await expect(page.locator('#experience-count')).toContainText(`Showing ${total} of ${total}`);
  });

  test('filters experience timeline and keeps hidden items out of tab order', async ({ page }) => {
    const aiButton = page.locator('#experience-filters button[data-filter-value="AI/ML"]');
    await aiButton.click();
    await expect(aiButton).toHaveAttribute('aria-pressed', 'true');

    expect(await getVisibleItems(page, '#experience-list [data-filter-item="experience"]')).toBe(2);

    const hiddenInteractive = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll<HTMLElement>(
          '#experience-list [data-filter-item="experience"][hidden] a, #experience-list [data-filter-item="experience"][hidden] button'
        )
      ).some(element => element.tabIndex >= 0)
    );
    expect(hiddenInteractive).toBe(false);

    await expect(page.locator('#experience-count')).toContainText('Showing 2 of 4');

    await page.locator('#experience-active-filters button[data-filter-clear]').click();
    expect(await getVisibleItems(page, '#experience-list [data-filter-item="experience"]')).toBe(
      await page.locator('#experience-list [data-filter-item="experience"]').count()
    );
  });
});
