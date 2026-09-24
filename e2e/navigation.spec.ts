import { test, expect } from '@playwright/test';

const pages = ['/', '/tutoring', '/work/agent-eval', '/writing', '/404'];

test.describe('links and calls to action', () => {
  for (const path of pages) {
    test(`every link on ${path} resolves`, async ({ page, request }) => {
      await page.goto(path);
      const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')!));
      expect(hrefs.length).toBeGreaterThan(3);

      for (const href of new Set(hrefs)) {
        if (href.startsWith('mailto:')) {
          expect(href).toMatch(/^mailto:yohannvinod@gmail\.com(\?subject=.+)?$/);
          continue;
        }
        if (/^https?:\/\//.test(href)) continue; // external: checked by humans, not CI

        const url = new URL(href, page.url());
        if (url.pathname !== new URL(page.url()).pathname || !url.hash) {
          const res = await request.get(url.pathname);
          expect(res.status(), `${href} should load`).toBe(200);
        }
        if (url.hash && url.hash !== '#') {
          const id = decodeURIComponent(url.hash.slice(1));
          if (url.pathname === new URL(page.url()).pathname) {
            await expect(page.locator(`[id="${id}"]`), `${href} target exists`).toHaveCount(1);
          } else {
            const target = await request.get(url.pathname);
            expect(await target.text(), `${href} target exists`).toContain(`id="${id}"`);
          }
        }
      }
    });
  }

  test('hero CTAs go to real sections', async ({ page }) => {
    await page.goto('/');
    const hero = page.locator('#top');
    await expect(hero.getByRole('link', { name: 'See the work' })).toHaveAttribute('href', '#work');
    await expect(hero.getByRole('link', { name: 'Get in touch' })).toHaveAttribute('href', '#contact');
    await expect(page.locator('#work')).toHaveCount(1);
    await expect(page.locator('#contact')).toHaveCount(1);
  });

  test('contact offers email, LinkedIn, and GitHub', async ({ page }) => {
    await page.goto('/#contact');
    const contact = page.locator('#contact');
    await expect(contact.getByRole('link', { name: 'yohannvinod@gmail.com' })).toHaveAttribute('href', 'mailto:yohannvinod@gmail.com');
    await expect(contact.getByRole('link', { name: /LinkedIn/ })).toHaveAttribute('href', 'https://linkedin.com/in/yohannp');
    await expect(contact.getByRole('link', { name: /GitHub/ })).toHaveAttribute('href', 'https://github.com/johnbarn777');
  });

  test('unknown routes render the 404 page', async ({ page }) => {
    const res = await page.goto('/definitely-not-a-page');
    expect(res?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('no place in production');
    await expect(page.getByRole('link', { name: 'Back to the homepage' })).toHaveAttribute('href', '/');
  });
});

test.describe('navigation', () => {
  test('desktop nav jumps to sections', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop nav only');
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Experience' }).click();
    await expect(page).toHaveURL(/#experience$/);
    await expect(page.locator('#experience')).toBeInViewport();
  });

  test('mobile menu opens, closes with Escape, and navigates', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile menu only');
    await page.goto('/');
    const button = page.getByRole('button', { name: 'Open menu' });
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await button.click();
    await expect(page.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true');
    const menu = page.getByRole('navigation', { name: 'Mobile' });
    await expect(menu.getByRole('link', { name: 'Projects' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false');

    await page.getByRole('button', { name: 'Open menu' }).click();
    await menu.getByRole('link', { name: 'Projects' }).click();
    await expect(page).toHaveURL(/#projects$/);
    await expect(page.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false');
  });

  test('skip link moves focus to main content', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard test');
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main$/);
  });
});
