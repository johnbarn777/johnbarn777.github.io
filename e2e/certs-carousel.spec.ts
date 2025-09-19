import { test, expect } from '@playwright/test';
import { certifications } from '../src/data/certs';

const selectors = {
  section: '[data-filter-section="certs"]',
  activeCard: '[data-filter-section="certs"] [data-cert-card].is-active',
  cards: '[data-filter-section="certs"] [data-cert-card]',
  verify: '[data-filter-section="certs"] [data-cert-card].is-active [data-cert-verify]',
  live: '[data-filter-section="certs"] [data-cert-live]',
  filterButton: (value: string) => `#certifications button[data-filter-value="${value}"]`,
};

test.describe('Certifications carousel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector(selectors.section);
  });

  test('initial state renders active detail with verify link', async ({ page }) => {
    const firstCert = certifications[0];
    const activeCard = page.locator(selectors.activeCard);
    await expect(activeCard).toBeVisible();
    await expect(activeCard).toHaveAttribute('data-cert-id', firstCert.id);
    await expect(activeCard.locator('[data-cert-detail]')).toBeVisible();

    const verifyLink = page.locator(selectors.verify);
    await expect(verifyLink).toHaveAttribute('href', firstCert.verifyUrl);
    await expect(verifyLink).toHaveAttribute('target', '_blank');
    await expect(verifyLink).toHaveAttribute('rel', /noopener/);
  });

  test('clicking another card activates its detail and verify URL', async ({ page }) => {
    const targetCert = certifications[2];
    const card = page.locator(`${selectors.cards}[data-cert-id="${targetCert.id}"]`);
    await card.click();
    await expect(card).toHaveClass(/is-active/);
    await expect(card.locator('[data-cert-detail]')).toBeVisible();

    const verifyHref = await card.locator('[data-cert-verify]').getAttribute('href');
    expect(verifyHref).toBe(targetCert.verifyUrl);

    const host = verifyHref ? new URL(verifyHref).host : '';
    expect(host).toBe(new URL(targetCert.verifyUrl).host);
  });

  test('keyboard navigation updates live region and supports V shortcut', async ({ page }) => {
    const viewport = page.locator('#certs-viewport');
    await viewport.focus();
    await viewport.press('ArrowRight');

    const secondCert = certifications[1];
    const activeCard = page.locator(selectors.activeCard);
    await expect(activeCard).toHaveAttribute('data-cert-id', secondCert.id);

    await expect(page.locator(selectors.live)).toContainText(`Now viewing ${secondCert.title} — ${secondCert.issuer}`);

    await page.keyboard.press('v');
    const verifyLink = page.locator(selectors.verify);
    await expect(verifyLink).toBeFocused();
  });

  test('category filters update track and reset active index', async ({ page }) => {
    const cloudButton = page.locator(selectors.filterButton('Cloud'));
    await cloudButton.click();

    const visibleCards = page.locator(`${selectors.cards}:not([hidden])`);
    await expect(visibleCards).toHaveCount(1);

    const activeCard = page.locator(selectors.activeCard);
    await expect(activeCard).toHaveAttribute('data-cert-id', 'cloud-architecture');
    await expect(activeCard.locator('[data-cert-detail]')).toBeVisible();
  });

  test('reduced motion keeps animations short and carousel functional', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForSelector(selectors.section);

    const durations = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[data-filter-section="certs"] [data-cert-card]')).map(card => {
        const style = window.getComputedStyle(card);
        return style.transitionDuration
          .split(',')
          .map(part => part.trim())
          .filter(Boolean)
          .map(value => {
            if (value.endsWith('ms')) {
              return parseFloat(value) / 1000;
            }
            if (value.endsWith('s')) {
              return parseFloat(value);
            }
            return Number(value) || 0;
          });
      });
    });

    const flattened = durations.flat();
    expect(flattened.every(value => value <= 0.1)).toBe(true);

    const secondCard = page.locator(`${selectors.cards}`).nth(1);
    await secondCard.click();
    await expect(secondCard).toHaveClass(/is-active/);

    await context.close();
  });
});
