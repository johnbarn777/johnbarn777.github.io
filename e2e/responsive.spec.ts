import { test, expect } from '@playwright/test';

const scenarios = [
  { name: 'desktop', size: { width: 1280, height: 720 }, tolerance: 0 },
  { name: 'small-phone', size: { width: 360, height: 720 }, tolerance: 8 },
  { name: 'tiny-phone', size: { width: 320, height: 720 }, tolerance: 48 },
];

for (const { name, size, tolerance } of scenarios) {
  test(`layout clips horizontal overflow @${name}`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto('/');

    const result = await page.evaluate(() => {
      const getOverflow = (el: Element | null) => (el ? window.getComputedStyle(el).overflowX : '');
      const docEl = document.documentElement;
      const body = document.body;

      window.scrollTo({ left: 9999, behavior: 'instant' });
      const scrolled = window.scrollX;

      return {
        rootOverflow: getOverflow(docEl),
        bodyOverflow: getOverflow(body),
        scrolled,
        docScrollWidth: docEl.scrollWidth,
        docClientWidth: docEl.clientWidth,
        bodyScrollWidth: body.scrollWidth,
        bodyClientWidth: body.clientWidth,
      };
    });

    expect.soft(['clip', 'hidden']).toContain(result.rootOverflow);
    expect.soft(['clip', 'hidden']).toContain(result.bodyOverflow);
    expect(result.scrolled).toBe(0);
    const docOverflow = result.docScrollWidth - result.docClientWidth;
    const bodyVsDoc = result.bodyScrollWidth - result.docClientWidth;
    const bodyOverflow = result.bodyScrollWidth - result.bodyClientWidth;

    expect.soft(docOverflow).toBeGreaterThanOrEqual(0);
    expect.soft(bodyVsDoc).toBeGreaterThanOrEqual(0);
    expect(docOverflow).toBeLessThanOrEqual(tolerance);
    expect(bodyVsDoc).toBeLessThanOrEqual(tolerance);
    expect(bodyOverflow).toBeLessThanOrEqual(tolerance);
  });
}

test('layout stays within viewport @device', async ({ page }) => {
  await page.goto('/');
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const docDelta = doc.scrollWidth - doc.clientWidth;
    const bodyDelta = document.body.scrollWidth - doc.clientWidth;
    return { docDelta, bodyDelta };
  });

  expect(overflow.docDelta).toBeLessThanOrEqual(1);
  expect(overflow.bodyDelta).toBeLessThanOrEqual(1);
});
