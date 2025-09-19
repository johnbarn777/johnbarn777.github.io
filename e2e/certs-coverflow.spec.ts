import { test, expect, Page } from '@playwright/test';

const selectors = {
  section: '#certifications',
  viewport: '[data-certs-viewport]',
  card: '[data-cert-card]'
};

const getPreviewForCard = (page: Page, cardIndex = 0) =>
  page.locator(selectors.card).nth(cardIndex).locator('[data-cert-preview]');

const gotoCerts = async (page: Page) => {
  page.on('pageerror', error => {
    // eslint-disable-next-line no-console
    console.log('[pageerror]', error.message, error.stack);
  });
  await page.goto('/');
  const section = page.locator(selectors.section);
  await expect(section).toBeVisible();
  await section.scrollIntoViewIfNeeded();
  await expect(page.locator(selectors.viewport)).toBeVisible({ timeout: 5000 });
  await page.waitForFunction(() => {
    const items = Array.from(document.querySelectorAll('[data-filter-item]'));
    return items.length > 0 && items.some(item => !item.hasAttribute('hidden'));
  });
  await page.waitForTimeout(200);
};

test.describe('Certifications coverflow', () => {
  test('hover preview persists briefly after pointer leave', async ({ page }) => {
    await gotoCerts(page);

    const card = page.locator(selectors.card).first();
    const preview = getPreviewForCard(page);

    await expect(preview).toHaveAttribute('aria-hidden', 'true');

    await card.evaluate(element => {
      element.dispatchEvent(new Event('pointerenter', { bubbles: true }));
    });
    await expect(preview).toHaveAttribute('aria-hidden', 'false');

    await card.evaluate(element => {
      element.dispatchEvent(new Event('pointerleave', { bubbles: true }));
    });
    await page.waitForTimeout(120);
    await expect(preview).toHaveAttribute('aria-hidden', 'false');

    await page.waitForTimeout(220);
    await expect(preview).toHaveAttribute('aria-hidden', 'true');
  });

  test('focus preview closes with Escape and returns focus to card', async ({ page }) => {
    await gotoCerts(page);

    const card = page.locator(selectors.card).first();
    const preview = getPreviewForCard(page);

    await card.focus();
    await card.evaluate(element => {
      element.dispatchEvent(new Event('focusin', { bubbles: true }));
    });
    await expect(card).toBeFocused();
    await expect(preview).toHaveAttribute('aria-hidden', 'false');

    await page.keyboard.press('Escape');
    await expect(preview).toHaveAttribute('aria-hidden', 'true');
    await expect(card).toBeFocused();
  });

  test('verify link opens external site in new tab', async ({ page }) => {
    await gotoCerts(page);

    const card = page.locator(selectors.card).first();
    const preview = getPreviewForCard(page);

    await card.focus();
    await card.evaluate(element => {
      element.dispatchEvent(new Event('focusin', { bubbles: true }));
    });
    await expect(preview).toHaveAttribute('aria-hidden', 'false');

    const popupPromise = page.waitForEvent('popup');
    await preview.locator('.cert-preview__cta').click({ force: true });
    const popup = await popupPromise;
    await popup.waitForLoadState();

    const url = new URL(popup.url());
    expect(url.hostname).toContain('cloud.google.com');
    await popup.close();
  });

  test('reduced motion disables tilt transforms', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoCerts(page);

    const card = page.locator(selectors.card).first();
    const box = await card.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2 + 30);

    const tiltValue = await card.evaluate(el => el.style.getPropertyValue('--cert-tilt-x'));
    expect(['', '0deg']).toContain(tiltValue);

    await page.emulateMedia({ reducedMotion: 'no-preference' });
  });
});
