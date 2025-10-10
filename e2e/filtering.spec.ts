import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const getVisibleItems = async (page: Page, selector: string) => {
  return page.locator(`${selector}:not([hidden])`).count();
};

const getMatchingCount = async (page: Page, tags: string[]) => {
  return page.evaluate(
    ({ tags }) => {
      const items = Array.from(
        document.querySelectorAll<HTMLElement>('#projects-gallery [data-filter-item="projects"]')
      );
      if (tags.length === 0) {
        return items.length;
      }
      return items.filter(item => {
        const raw = item.dataset.tags || '';
        const values = raw
          .split(',')
          .map(token => token.trim())
          .filter(Boolean);
        if (!values.length) return false;
        return tags.some(tag => values.includes(tag));
      }).length;
    },
    { tags }
  );
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
    const mlExpected = await getMatchingCount(page, ['ML']);
    expect(await getVisibleItems(page, '#projects-gallery [data-filter-item="projects"]')).toBe(mlExpected);
    expect(mlExpected).toBeGreaterThan(0);
    await expect(chipWrapper).toBeVisible();
    await expect(chipWrapper).toContainText('ML');
    await expect(page.locator('#projects-count')).toContainText(`Showing ${mlExpected}`);

    await mobileButton.click();
    const mlMobileExpected = await getMatchingCount(page, ['ML', 'Mobile']);
    expect(await getVisibleItems(page, '#projects-gallery [data-filter-item="projects"]')).toBe(mlMobileExpected);
    expect(mlMobileExpected).toBeGreaterThanOrEqual(mlExpected);
    await expect(chipWrapper).toContainText('Mobile');
    await expect(page.locator('#projects-count')).toContainText(`Showing ${mlMobileExpected}`);

    const visibleTitles = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll<HTMLElement>('#projects-gallery [data-filter-item="projects"]:not([hidden])')
      ).map(item => ({
        title: item.querySelector<HTMLElement>('.card-title')?.innerText ?? '',
        hasProjectCardClass: item.classList.contains('project-card'),
      }))
    );
    expect(visibleTitles.every(item => item.hasProjectCardClass)).toBe(true);
    expect(visibleTitles.every(item => item.title.length > 0)).toBe(true);

    await page.locator('#project-active-filters button[data-filter-remove="Mobile"]').click();
    expect(await getVisibleItems(page, '#projects-gallery [data-filter-item="projects"]')).toBe(mlExpected);

    await page.locator('#project-active-filters button[data-filter-clear]').click();

    expect(await getVisibleItems(page, '#projects-gallery [data-filter-item="projects"]')).toBe(
      await page.locator('#projects-gallery [data-filter-item="projects"]').count()
    );

    await expect(allButton).toHaveAttribute('aria-pressed', 'true');

    await page.waitForFunction(() => window.location.search.includes('p=') === false);
  });

  test('project filter buttons adapt colors between light and dark themes', async ({ page }) => {
    const parseRgb = (value: string): [number, number, number] => {
      const matches = value.match(/\d+/g);
      if (!matches) return [0, 0, 0];
      const [r = 0, g = 0, b = 0] = matches.map(Number);
      return [r, g, b];
    };

    const luminance = ([r, g, b]: [number, number, number]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

    const mlButton = page.locator('#project-filters button[data-filter-value="ML"]');
    const inactiveLightColor = await mlButton.evaluate(element => getComputedStyle(element).color);

    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    });

    await page.waitForTimeout(50);

    const inactiveDarkColor = await mlButton.evaluate(element => getComputedStyle(element).color);
    expect(inactiveDarkColor).not.toBe(inactiveLightColor);

    const lightLuma = luminance(parseRgb(inactiveLightColor));
    const darkLuma = luminance(parseRgb(inactiveDarkColor));
    expect(darkLuma - lightLuma).toBeGreaterThan(45);

    await mlButton.click();
    const mlColor = await mlButton.evaluate(element => getComputedStyle(element).color);
    expect(luminance(parseRgb(mlColor))).toBeGreaterThan(200);
  });

  test('shows empty state for filters with no matches', async ({ page }) => {
    const zeroFilter = await (async () => {
      const values = await page.$$eval(
        '#project-filters [data-filter-value]',
        buttons =>
          buttons
            .map(button => (button.getAttribute('data-filter-value') || '').trim())
            .filter(value => value && value !== 'All')
      );
      for (const value of values) {
        const matchCount = await getMatchingCount(page, [value]);
        if (matchCount === 0) {
          return value;
        }
      }
      return null;
    })();

    if (!zeroFilter) {
      const fallbackFilter = await page.evaluate(() => {
        const button = document.querySelector<HTMLElement>(
          '#project-filters [data-filter-value]:not([data-filter-value="All"])'
        );
        return button?.getAttribute('data-filter-value') || null;
      });
      expect(fallbackFilter).not.toBeNull();
      const fallbackButton = page.locator(
        `#project-filters button[data-filter-value="${fallbackFilter!}"]`
      );
      await fallbackButton.click();

      const gallery = page.locator('#projects-gallery');
      await expect(gallery).toBeVisible();
      await expect(gallery).not.toHaveAttribute('hidden', '');
      await expect(page.locator('#projects-empty')).toHaveAttribute('hidden', '');
      await expect(page.locator('#projects-count')).not.toContainText('Showing 0');
      return;
    }

    const filterValue = zeroFilter!;
    const targetButton = page.locator(`#project-filters button[data-filter-value="${filterValue}"]`);
    await targetButton.click();

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
