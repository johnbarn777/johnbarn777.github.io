import { test, expect, Page } from '@playwright/test';

declare global {
  interface Window {
    __skillsCarousel?: { index: number; reasons: string[] };
    __skillsCarouselOverride?: { autoplayMs?: number; resumeDelayMs?: number; loop?: boolean; disableViewportPause?: boolean };
  }
}

const selectors = {
  section: '#skills',
  viewport: '#skills-viewport',
  slides: '[data-slide-index]',
  currentSlide: '[data-slide-index][aria-current="true"]',
  dots: '[data-skill-dot]',
  dotSelected: '[data-skill-dot][aria-selected="true"]',
  prev: '#skills-prev',
  next: '#skills-next',
};

const gotoHome = async (page: Page, hash?: string) => {
  await page.addInitScript(({ autoplayMs, resumeDelayMs, disableViewportPause }) => {
    window.__skillsCarouselOverride = { autoplayMs, resumeDelayMs, disableViewportPause };
  }, { autoplayMs: 1500, resumeDelayMs: 700, disableViewportPause: true });
  await page.goto(hash ? `/${hash}` : '/');
  await expect(page.locator(selectors.viewport)).toBeVisible();
  await page.evaluate(() => {
    const section = document.getElementById('skills');
    if (section) {
      section.scrollIntoView({ behavior: 'auto', block: 'center' });
    }
  });
  await page.waitForTimeout(150);
  await expect(page.locator(selectors.currentSlide)).toBeVisible();
  await page.waitForFunction(() => typeof window.__skillsCarousel === 'object', { timeout: 3000 });
  await page.waitForFunction(() => {
    const state = window.__skillsCarousel;
    if (!state) return false;
    const reasons = state.reasons;
    if (!Array.isArray(reasons)) return false;
    return reasons.length === 0 || reasons.every(reason => reason === 'motion');
  }, { timeout: 5000 });
};

const getCurrentSlideIndex = async (page: Page) => {
  const index = await page.locator(selectors.currentSlide).getAttribute('data-slide-index');
  return Number(index ?? '-1');
};

const getSlideCount = async (page: Page) => page.locator(selectors.slides).count();

const waitForAutoplayAdvance = async (page: Page, expectedIndex: number, timeout = 10000) => {
  await expect
    .poll(async () => getCurrentSlideIndex(page), { timeout, message: 'Waiting for autoplay navigation' })
    .toBe(expectedIndex);
};

test.describe('Skills carousel', () => {
  test.setTimeout(45000);

  test('initial render shows single visible slide and selected dot', async ({ page }) => {
    await gotoHome(page);

    const slideCount = await getSlideCount(page);
    expect(slideCount).toBeGreaterThan(0);

    const dotsCount = await page.locator(selectors.dots).count();
    expect(dotsCount).toBe(slideCount);

    await expect(page.locator(selectors.dotSelected)).toHaveCount(1);
    await expect(page.locator(selectors.currentSlide)).toHaveAttribute('data-slide-index', '0');

    const visibleSlides = await page.evaluate(() => {
      const viewport = document.querySelector<HTMLElement>('#skills-viewport');
      if (!viewport) return 0;
      const slides = Array.from(
        viewport.querySelectorAll<HTMLElement>('[data-slide-index]')
      );
      const { left, right } = viewport.getBoundingClientRect();
      return slides.filter(slide => {
        const rect = slide.getBoundingClientRect();
        return rect.left >= left - 1 && rect.right <= right + 1;
      }).length;
    });

    expect(visibleSlides).toBe(1);
  });

  test('autoplay advances slides and loops from last to first', async ({ page }) => {
    await gotoHome(page);

    const totalSlides = await getSlideCount(page);
    const initialIndex = await getCurrentSlideIndex(page);

    await waitForAutoplayAdvance(page, (initialIndex + 1) % totalSlides);

    await page.locator(selectors.dots).last().click();
    await page.evaluate(() => {
      const active = document.activeElement;
      if (active && typeof (active as HTMLElement).blur === 'function') {
        (active as HTMLElement).blur();
      }
    });
    await page.mouse.move(0, 0);
    await waitForAutoplayAdvance(page, 0);
  });

  test('hover pause prevents autoplay until pointer leaves', async ({ page }) => {
    await gotoHome(page);
    const startIndex = await getCurrentSlideIndex(page);

    await page.hover(selectors.viewport);
    await page.waitForTimeout(5200);
    expect(await getCurrentSlideIndex(page)).toBe(startIndex);

    await page.hover('header');
    await waitForAutoplayAdvance(page, (startIndex + 1) % (await getSlideCount(page)));
  });

  test('focus inside carousel pauses autoplay until focus moves away', async ({ page }) => {
    await gotoHome(page);

    await page.focus(selectors.viewport);
    await page.keyboard.press('Tab');
    const focusedIndex = await getCurrentSlideIndex(page);

    await page.waitForTimeout(5200);
    expect(await getCurrentSlideIndex(page)).toBe(focusedIndex);

    await page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;
      active?.blur();
    });

    await waitForAutoplayAdvance(page, (focusedIndex + 1) % (await getSlideCount(page)));
  });

  test('reduced motion disables autoplay and smooth scrolling', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);
    const startIndex = await getCurrentSlideIndex(page);

    await page.waitForTimeout(3500);
    expect(await getCurrentSlideIndex(page)).toBe(startIndex);

    await page.emulateMedia({ reducedMotion: 'no-preference' });
  });

  test('keyboard dot navigation updates slide and selected state', async ({ page }) => {
    await gotoHome(page);

    const firstDot = page.locator(selectors.dots).first();
    await firstDot.focus();
    await expect(firstDot).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');

    await expect(page.locator(selectors.dotSelected)).toHaveCount(1);
    await expect(page.locator(selectors.currentSlide)).toHaveAttribute('data-slide-index', '1');

    const hash = await page.evaluate(() => window.location.hash);
    expect(hash).toContain('skills-cat');
  });

  test('hash navigation opens requested category on load', async ({ page }) => {
    await gotoHome(page, '#skills-cat-cloud');

    await expect
      .poll(async () => page.locator(selectors.currentSlide).getAttribute('id'), { timeout: 5000 })
      .toBe('skills-cat-cloud');
    await expect(page.locator(selectors.dotSelected)).toHaveAttribute('data-skill-dot', 'cloud');
  });

  test('document visibility pause stops autoplay until tab is visible', async ({ page }) => {
    await gotoHome(page);
    const startIndex = await getCurrentSlideIndex(page);

    await page.evaluate(() => {
      const descriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState');
      (window as any).__originalVisibilityDescriptor = descriptor;
      Object.defineProperty(Document.prototype, 'visibilityState', {
        configurable: true,
        get: () => 'hidden',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await page.waitForTimeout(5200);
    expect(await getCurrentSlideIndex(page)).toBe(startIndex);

    await page.evaluate(() => {
      const original: PropertyDescriptor | undefined = (window as any).__originalVisibilityDescriptor;
      if (original) {
        Object.defineProperty(Document.prototype, 'visibilityState', original);
      } else {
        Object.defineProperty(Document.prototype, 'visibilityState', {
          configurable: true,
          get: () => 'visible',
        });
      }
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await waitForAutoplayAdvance(page, (startIndex + 1) % (await getSlideCount(page)));
  });
});
