import { test, expect } from '@playwright/test';

const selectors = {
  section: '#certifications',
  marquee: '.certs-marquee',
  track: '.certs-track',
  visibleCards: '.certs-item:not([aria-hidden]) .cert-card',
};

test.describe('Certifications marquee', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#certifications');
    await expect(page.locator(selectors.section)).toBeVisible();
    await page.locator(selectors.section).evaluate(node => {
      node.scrollIntoView({ block: 'center', behavior: 'auto' });
    });
  });

  test('renders a horizontal banner of certification links with logos', async ({ page }) => {
    const cards = page.locator(selectors.visibleCards);
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
    await expect(cards.first()).toHaveAttribute('href', /https?:/);
    await expect(cards.first()).toHaveAttribute('target', '_blank');
    await expect(cards.first().locator('img')).toHaveAttribute('width', '64');
    await expect(cards.first().locator('img')).toHaveAttribute('height', '64');
  });

  test('duplicates are hidden from assistive tech and removed from tab order', async ({ page }) => {
    const duplicateWrappers = page.locator('.certs-item[aria-hidden="true"]');
    const duplicateCount = await duplicateWrappers.count();
    expect(duplicateCount).toBeGreaterThan(0);
    for (let index = 0; index < duplicateCount; index += 1) {
      const wrapper = duplicateWrappers.nth(index);
      await expect(wrapper).toHaveAttribute('aria-hidden', 'true');
      await expect(wrapper.locator('.cert-card')).toHaveAttribute('tabindex', '-1');
    }
  });

  test('marquee animates by default and pauses for reduced motion', async ({ page }) => {
    const animationName = await page.evaluate(() => {
      const track = document.querySelector<HTMLElement>('.certs-track');
      return track ? getComputedStyle(track).animationName : null;
    });
    expect(animationName).toBe('certs-marquee');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await page.locator(selectors.section).evaluate(node => {
      node.scrollIntoView({ block: 'center', behavior: 'auto' });
    });
    const reducedAnimationName = await page.evaluate(() => {
      const track = document.querySelector<HTMLElement>('.certs-track');
      return track ? getComputedStyle(track).animationName : null;
    });
    expect(reducedAnimationName).toBe('none');
  });
});
