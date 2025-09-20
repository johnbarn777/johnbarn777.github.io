import { test, expect, Page } from '@playwright/test';

const selectors = {
  section: '#certifications',
  viewport: '#certs-viewport',
  cards: '.certs-card',
  activeCard: '.certs-card[aria-current="true"]',
  detailPanels: '[data-detail-index]',
  activeDetail: '[data-detail-index]:not([hidden])',
  verifyButton: '[data-cert-detail] [data-verify-button]',
  prev: '#certs-prev',
  next: '#certs-next',
  dots: '#certs-dots [role="tab"]',
  dotSelected: '#certs-dots [role="tab"][aria-selected="true"]',
  filters: '[data-cert-filter]',
};

const gotoCertifications = async (page: Page) => {
  await page.goto('/#certifications');
  const viewport = page.locator(selectors.viewport);
  await expect(viewport).toBeVisible();
  await viewport.evaluate(node => {
    node.scrollIntoView({ block: 'center', behavior: 'auto' });
  });
  await expect(page.locator(selectors.activeCard)).toHaveCount(1);
  await expect(page.locator(selectors.activeDetail)).toHaveCount(1);
};

const getActiveDatasetIndex = async (page: Page) => {
  const index = await page.locator(selectors.activeCard).first().getAttribute('data-index');
  return Number(index ?? '-1');
};

test.describe('Certifications coverflow', () => {
  test.beforeEach(async ({ page }) => {
    await gotoCertifications(page);
  });

  test('initial render marks first card active with detail and verify CTA', async ({ page }) => {
    await expect(page.locator(selectors.activeCard).first()).toHaveAttribute('data-index', '0');
    await expect(page.locator(selectors.activeDetail).first()).toHaveAttribute('data-detail-index', '0');
    await expect(page.locator(selectors.activeDetail).locator(selectors.verifyButton)).toBeVisible();
  });

  test('prev/next buttons update active card, detail, and selected dot', async ({ page }) => {
    await page.locator(selectors.next).click();
    await expect(page.locator(selectors.activeCard)).toHaveAttribute('data-index', '1');
    await expect(page.locator(selectors.activeDetail)).toHaveAttribute('data-detail-index', '1');
    await expect(page.locator(selectors.dotSelected)).toHaveAttribute('data-index', '1');

    await page.locator(selectors.prev).click();
    await expect(page.locator(selectors.activeCard)).toHaveAttribute('data-index', '0');
    await expect(page.locator(selectors.activeDetail)).toHaveAttribute('data-detail-index', '0');
    await expect(page.locator(selectors.dotSelected)).toHaveAttribute('data-index', '0');
  });

  test('clicking a non-active card centers and activates it', async ({ page }) => {
    const target = page.locator(`${selectors.cards}[data-index="2"]`).first();
    await target.scrollIntoViewIfNeeded();
    await target.click();
    await expect(target).toHaveAttribute('aria-current', 'true');
    await expect(page.locator(selectors.activeDetail)).toHaveAttribute('data-detail-index', '2');
  });

  test('dots support arrow navigation and activation via keyboard', async ({ page }) => {
    const firstDot = page.locator(selectors.dots).first();
    await firstDot.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press(' ');
    await expect(page.locator(selectors.activeCard)).toHaveAttribute('data-index', '1');
    await expect(page.locator(selectors.dotSelected)).toHaveAttribute('data-index', '1');
  });

  test('viewport keyboard shortcuts navigate and focus Verify button', async ({ page }) => {
    const totalDots = await page.locator(selectors.dots).count();
    await page.focus(selectors.viewport);
    const startIndex = await getActiveDatasetIndex(page);
    await page.keyboard.press('ArrowRight');
    const nextIndex = (startIndex + 1) % totalDots;
    await expect(page.locator(selectors.activeCard)).toHaveAttribute('data-index', String(nextIndex));
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator(selectors.activeCard)).toHaveAttribute('data-index', String(startIndex));
    await page.keyboard.press('v');
    await expect(page.locator(selectors.activeDetail).locator(selectors.verifyButton)).toBeFocused();
  });

  test('reduced motion keeps transitions short and interactions working', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await gotoCertifications(page);

    const durations = await page.evaluate(() => {
      return Array.from(document.querySelectorAll<HTMLElement>('.certs-card')).slice(0, 3).map(card => {
        const values = getComputedStyle(card).transitionDuration.split(',');
        return values.map(raw => {
          const trimmed = raw.trim();
          if (trimmed.endsWith('ms')) {
            return Number(trimmed.replace('ms', '')) / 1000;
          }
          if (trimmed.endsWith('s')) {
            return Number(trimmed.replace('s', ''));
          }
          return Number(trimmed);
        });
      });
    });

    for (const value of durations.flat()) {
      expect(value).toBeLessThanOrEqual(0.12);
    }

    await page.focus(selectors.viewport);
    const before = await getActiveDatasetIndex(page);
    await page.keyboard.press('ArrowRight');
    await expect
      .poll(async () => getActiveDatasetIndex(page))
      .not.toBe(before);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  });

  test('category filters reset the subset and detail to the first match', async ({ page }) => {
    const filters = page.getByRole('toolbar', { name: 'Certification categories' });
    await filters.getByRole('button', { name: 'Security' }).click();
    await expect(page.locator(selectors.activeCard)).toHaveAttribute('data-cert-category', 'Security');
    await expect(page.locator(selectors.activeDetail).locator('.cert-detail__title')).toHaveText(
      /Certified Information Systems Security Professional/i
    );
    await expect(page.locator(`${selectors.cards}:not([hidden])`)).toHaveCount(1);
    await expect(page.locator(`${selectors.dots}:not([hidden])`)).toHaveCount(1);

    await filters.getByRole('button', { name: 'All' }).click();
    await expect(page.locator(selectors.activeCard)).toHaveAttribute('data-index', '0');
    await expect(page.locator(selectors.dotSelected)).toHaveAttribute('data-index', '0');
  });
});
