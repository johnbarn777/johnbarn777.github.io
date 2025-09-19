import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const gotoHome = async (page: Page) => {
  await page.goto('/');
  await page.waitForSelector('[data-skills-banner]');
  await page.locator('#skills').scrollIntoViewIfNeeded();
};

const getActiveCategory = async (page: Page) =>
  page.getAttribute('[data-skill-slide][aria-current="true"]', 'data-category');

const waitForAutoplayTick = (page: Page) => page.waitForTimeout(5200);
const waitForResume = (page: Page) => page.waitForTimeout(2200);

const skipIfSingleSlide = async (page: Page) => {
  const slideCount = await page.locator('[data-skill-slide]').count();
  test.skip(slideCount <= 1, 'Carousel requires more than one category.');
  return slideCount;
};

test('initial render shows first slide and dot selection', async ({ page }) => {
  await gotoHome(page);

  const slides = page.locator('[data-skill-slide]');
  const dots = page.locator('[data-skill-dot]');
  const activeSlide = page.locator('[data-skill-slide][aria-current="true"]');

  await expect(activeSlide).toHaveCount(1);
  await expect(dots.first()).toHaveAttribute('aria-selected', 'true');
  await expect(dots).toHaveCount(await slides.count());

  if (await slides.count() > 1) {
    const offscreen = await slides.nth(1).evaluate(slide => {
      const viewport = slide.closest('[data-skill-viewport]');
      if (!viewport) return false;
      const viewportRect = viewport.getBoundingClientRect();
      const rect = slide.getBoundingClientRect();
      return rect.left >= viewportRect.right - 1;
    });
    expect(offscreen).toBeTruthy();
  }
});

test('autoplay advances slides and wraps to the beginning', async ({ page }) => {
  await gotoHome(page);
  const totalSlides = await skipIfSingleSlide(page);

  const firstCategory = await getActiveCategory(page);
  await waitForAutoplayTick(page);
  const secondCategory = await getActiveCategory(page);
  expect(secondCategory).not.toBe(firstCategory);

  for (let step = 1; step < totalSlides; step += 1) {
    await waitForAutoplayTick(page);
  }
  const wrappedCategory = await getActiveCategory(page);
  expect(wrappedCategory).toBe(firstCategory);
});

test('hover pauses autoplay and resumes after pointer leaves', async ({ page }) => {
  await gotoHome(page);
  await skipIfSingleSlide(page);

  const beforeHover = await getActiveCategory(page);
  await page.hover('#skills-viewport');
  await waitForAutoplayTick(page);
  expect(await getActiveCategory(page)).toBe(beforeHover);

  await page.mouse.move(0, 0);
  await waitForResume(page);
  await waitForAutoplayTick(page);
  expect(await getActiveCategory(page)).not.toBe(beforeHover);
});

test('focus inside carousel pauses autoplay until focus leaves', async ({ page }) => {
  await gotoHome(page);
  await skipIfSingleSlide(page);

  const pill = page.locator('[data-skill-slide][aria-current="true"] [data-skill-name]').first();
  await pill.focus();
  const focusedCategory = await getActiveCategory(page);
  await waitForAutoplayTick(page);
  expect(await getActiveCategory(page)).toBe(focusedCategory);

  await page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null;
    active?.blur();
  });
  await waitForResume(page);
  await waitForAutoplayTick(page);
  expect(await getActiveCategory(page)).not.toBe(focusedCategory);
});

test('reduced motion setting disables autoplay', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await gotoHome(page);
  const initialCategory = await getActiveCategory(page);
  await page.waitForTimeout(6000);
  expect(await getActiveCategory(page)).toBe(initialCategory);
});

test('keyboard control via dots updates selection and slides', async ({ page }) => {
  await gotoHome(page);
  await skipIfSingleSlide(page);

  const dots = page.locator('[data-skill-dot]');
  await dots.first().focus();
  await page.keyboard.press('ArrowRight');
  const focusedTarget = await page.evaluate(() => document.activeElement?.getAttribute('data-target'));
  const expectedTarget = await dots.nth(1).getAttribute('data-target');
  expect(focusedTarget).toBe(expectedTarget);

  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);
  const activeCategory = await getActiveCategory(page);
  expect(activeCategory).toBe(expectedTarget);
  await expect(dots.nth(1)).toHaveAttribute('aria-selected', 'true');
});

test('URL hash opens the matching category on load', async ({ page }) => {
  await page.goto('/#skills-cat-cloud');
  await page.waitForSelector('[data-skills-banner]');
  await page.locator('#skills').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-skill-slide][aria-current="true"][data-category="cloud"]')).toBeVisible();
});

test('visibility change pauses autoplay until tab becomes visible', async ({ page }) => {
  await gotoHome(page);
  await skipIfSingleSlide(page);

  const beforePause = await getActiveCategory(page);
  await page.evaluate(() => {
    const descriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState');
    if (!descriptor?.get) return;
    (window as any).__skillsOriginalVisibilityGetter = descriptor.get;
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });

  await waitForAutoplayTick(page);
  expect(await getActiveCategory(page)).toBe(beforePause);

  await page.evaluate(() => {
    const original = (window as any).__skillsOriginalVisibilityGetter as (() => string) | undefined;
    if (!original) return;
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: original,
    });
    delete (window as any).__skillsOriginalVisibilityGetter;
  });

  await waitForResume(page);
  await waitForAutoplayTick(page);
  expect(await getActiveCategory(page)).not.toBe(beforePause);
});
