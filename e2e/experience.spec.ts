import { test, expect } from '@playwright/test';

test.describe('above the fold', () => {
  test('current role and headline are visible without scrolling', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Enterprise AI that earns\s*its place in production\./);
    const status = page.locator('#top .status');
    await expect(status).toContainText('AI Solutions Specialist');
    await expect(status).toContainText('Mark Anthony Group');
    await expect(status).toBeInViewport();
  });

  test('hero renders with JavaScript disabled', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'See the work' })).toBeVisible();
    // Scroll-revealed content must not stay hidden without JS.
    const opacity = await page.locator('#how .principle').first().evaluate((el) => getComputedStyle(el).opacity);
    expect(opacity).toBe('1');
    await context.close();
  });
});

test.describe('theme', () => {
  test('follows the system preference by default', async ({ browser }) => {
    for (const scheme of ['light', 'dark'] as const) {
      const context = await browser.newContext({ colorScheme: scheme });
      const page = await context.newPage();
      await page.goto('/');
      const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      expect(bg).toBe(scheme === 'dark' ? 'rgb(12, 12, 14)' : 'rgb(251, 251, 253)');
      await context.close();
    }
  });

  test('toggle flips the theme and the choice persists', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    const toggle = page.locator('header [data-theme-toggle]');
    await expect(toggle).toHaveAttribute('aria-label', 'Switch to dark theme');
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('header [data-theme-toggle]')).toHaveAttribute('aria-label', 'Switch to light theme');
  });
});

test.describe('motion', () => {
  test('reduced motion shows everything in its final state', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveClass(/\bmotion\b/);
    const hidden = await page.$$eval('[data-reveal]', (els) => els.filter((el) => getComputedStyle(el).opacity !== '1').length);
    expect(hidden).toBe(0);
    // Statement words are fully lit, not waiting for scroll.
    const dim = await page.$$eval('.statement .w:not(.k)', (els) => {
      const ink = getComputedStyle(document.body).color;
      return els.filter((el) => getComputedStyle(el).color !== ink).length;
    });
    expect(dim).toBe(0);
    await context.close();
  });
});

test.describe('interactive pieces', () => {
  test('terminal opens with the backtick key and runs commands', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard shortcut');
    await page.goto('/');
    await page.keyboard.press('`');
    const dialog = page.getByRole('dialog', { name: /yohann@portfolio/ });
    await expect(dialog).toBeVisible();
    const input = dialog.getByRole('combobox', { name: 'Command' });
    await expect(input).toBeFocused();
    const log = dialog.getByRole('log');
    await input.fill('/whoami');
    await input.press('Enter');
    await expect(log).toContainText('AI Solutions Specialist at Mark Anthony Group');
    // Bare words still work, like a shell.
    await input.fill('principles');
    await input.press('Enter');
    await expect(log).toContainText('Prove it before you pick it.');
    await input.fill('/nonsense');
    await input.press('Enter');
    await expect(log).toContainText('Unknown command: /nonsense');
    await input.fill('what is this');
    await input.press('Enter');
    await expect(log).toContainText('not a model');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('typing / opens the command menu', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard shortcut');
    await page.goto('/');
    await page.keyboard.press('`');
    const dialog = page.getByRole('dialog', { name: /yohann@portfolio/ });
    const input = dialog.getByRole('combobox', { name: 'Command' });
    await input.pressSequentially('/pri');
    const menu = dialog.getByRole('listbox', { name: 'Commands' });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('option')).toHaveCount(1);
    await input.press('Enter');
    await expect(dialog.getByRole('log')).toContainText('Simplest thing that works.');
    await input.pressSequentially('/');
    await expect(menu).toBeVisible();
    // Esc closes the menu first, then the terminal.
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(dialog).toBeVisible();
  });

  test('shift five times toggles Spider-Man mode', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard shortcut');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    for (let i = 0; i < 5; i++) await page.keyboard.press('Shift');
    await expect(page.locator('html')).toHaveAttribute('data-spidey', '');
    await expect(page.getByRole('status').filter({ hasText: 'Spider-Man mode' })).toBeVisible();
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-spidey', '');
    for (let i = 0; i < 5; i++) await page.keyboard.press('Shift');
    await expect(page.locator('html')).not.toHaveAttribute('data-spidey');
  });

  test('typing boy summons Kratos', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard shortcut');
    await page.goto('/');
    await page.keyboard.type('boy');
    const quote = page.getByRole('dialog', { name: /Kratos/ });
    await expect(quote).toBeVisible();
    await expect(quote).toContainText('We win because we are determined. Disciplined. Not because we feel ourselves superior.');
    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape');
    await expect(quote).toBeHidden();
  });

  test('closing the quote leaves Ghost of Sparta mode, and boy ends it', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard shortcut');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.keyboard.type('boy');
    const quote = page.getByRole('dialog', { name: /Kratos/ });
    await expect(quote).toBeVisible();
    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape');
    await expect(page.locator('html')).toHaveAttribute('data-sparta', '');
    await expect(page.locator('.gos-axe')).toHaveCount(1);
    // Only one mode at a time.
    for (let i = 0; i < 5; i++) await page.keyboard.press('Shift');
    await expect(page.locator('html')).toHaveAttribute('data-spidey', '');
    await expect(page.locator('html')).not.toHaveAttribute('data-sparta');
    await expect(page.locator('.gos-axe')).toHaveCount(0);
  });

  test('terminal opens from the footer button', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open the terminal' }).click();
    await expect(page.getByRole('dialog', { name: /yohann@portfolio/ })).toBeVisible();
    await page.getByRole('button', { name: 'Close terminal' }).click();
    await expect(page.getByRole('dialog', { name: /yohann@portfolio/ })).toBeHidden();
  });

  test('live page stats fill in', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-perf-panel]').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-perf="third"]')).toHaveText('0', { timeout: 5000 });
    await expect(page.locator('[data-perf="weight"]')).toHaveText(/^\d[\d,.]*$/);
  });

  test('recall demo explains both designs', async ({ page }) => {
    await page.goto('/work/agent-eval');
    const readout = page.locator('[data-readout]');
    await page.getByRole('button', { name: 'Retrieval-only search' }).click();
    await expect(readout).toContainText('Found 3 of 15');
    await expect(page.getByRole('button', { name: 'Retrieval-only search' })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Tool-calling agent' }).click();
    await expect(readout).toContainText('Found 15 of 15');
  });

  test('experience rows expand and collapse', async ({ page }) => {
    await page.goto('/#experience');
    const row = page.locator('#experience details').nth(2);
    await expect(row).not.toHaveAttribute('open', '');
    await row.locator('summary').click();
    await expect(row).toHaveAttribute('open', '');
    await expect(row.getByText('120+ automated test cases')).toBeVisible();
  });
});
