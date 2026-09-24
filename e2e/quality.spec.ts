import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const pages = ['/', '/tutoring', '/work/agent-eval', '/404'];

test.describe('layout', () => {
  for (const width of [375, 768, 1024, 1440]) {
    test(`no horizontal scroll at ${width}px`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      for (const path of pages) {
        await page.goto(path);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `${path} at ${width}px`).toBeLessThanOrEqual(0);
      }
      await context.close();
    });
  }
});

test.describe('accessibility', () => {
  for (const scheme of ['light', 'dark'] as const) {
    for (const path of pages) {
      test(`${path} has no axe violations in ${scheme} mode`, async ({ browser }) => {
        const context = await browser.newContext({ colorScheme: scheme, reducedMotion: 'reduce' });
        const page = await context.newPage();
        await page.goto(path);
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
        const summary = results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
        expect(summary).toEqual([]);
        await context.close();
      });
    }
  }

  test('one h1 per page and landmarks present', async ({ page }) => {
    for (const path of pages) {
      await page.goto(path);
      await expect(page.locator('h1'), path).toHaveCount(1);
      await expect(page.getByRole('banner'), path).toHaveCount(1);
      await expect(page.getByRole('main'), path).toHaveCount(1);
      await expect(page.getByRole('contentinfo'), path).toHaveCount(1);
    }
  });
});

test.describe('SEO and sharing', () => {
  test('home has meta, Open Graph, canonical, and Person JSON-LD', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Yohann Pittappillil · AI Engineer');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /earns its place in production/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://johnbarn777.github.io/');
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://johnbarn777.github.io/og.png');
    const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}');
    expect(ld['@type']).toBe('Person');
    expect(ld.name).toBe('Yohann Pittappillil');
    expect(ld.worksFor.name).toBe('Mark Anthony Group');
    expect(ld.alumniOf.name).toBe('Simon Fraser University');
  });

  test('sitemap, robots, icons, and share images are served', async ({ request }) => {
    for (const path of ['/sitemap-index.xml', '/robots.txt', '/favicon.svg', '/favicon.png', '/apple-touch-icon.png', '/og.png', '/og-tutoring.png']) {
      expect((await request.get(path)).status(), path).toBe(200);
    }
  });
});

/** Walks the built site. The suite's web server builds it first. */
function builtHtml(dir = 'dist'): { file: string; text: string }[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return builtHtml(p);
    return p.endsWith('.html') ? [{ file: p, text: readFileSync(p, 'utf8') }] : [];
  });
}

const visibleText = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');

test.describe('copy rules', () => {
  test('no em dashes anywhere in the built site', () => {
    const offenders = builtHtml().filter(({ text }) => text.includes('\u2014') || text.includes('&mdash;'));
    expect(offenders.map((o) => o.file)).toEqual([]);
  });

  test('no banned hype words or stale claims', () => {
    const banned = [
      /\bgame[- ]changer/i,
      /\brevolutioni[sz]e/i,
      /\bunlock/i,
      /\bleverag/i,
      /\brobust\b/i,
      /\bseamless/i,
      /\bcutting[- ]edge/i,
      /\bsynergy/i,
      /\bpassionate\b/i,
      /\binnovator\b/i,
      /\bninja\b/i,
      /\brockstar\b/i,
      /\bworld[- ]class\b/i,
      /\b10x\b/i,
      /Vinod Pinto/,
      /Full[- ]Stack Software Developer/i,
      /Outlier\.ai/,
      /seeking internships?/i,
    ];
    for (const { file, text } of builtHtml()) {
      const words = visibleText(text);
      for (const re of banned) expect(words, `${re} in ${file}`).not.toMatch(re);
    }
  });

  test('tutoring stays off the AI home page, apart from one bridge line', () => {
    const home = visibleText(readFileSync('dist/index.html', 'utf8'));
    for (const term of ['SAT', 'JEE', 'Reading Town', 'Tutor Doctor', 'Chisel']) {
      expect(home, term).not.toContain(term);
    }
    expect(home).toContain('That lives on its own page');
  });
});
