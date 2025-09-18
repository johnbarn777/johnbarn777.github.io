import { test, expect } from '@playwright/test';

const experienceCards = () => '[data-experience-root] article';
const filterButton = (value: string) => `[data-filter="${value}"]`;

const expectCardCount = async (page, count: number) => {
  await expect(page.locator(experienceCards())).toHaveCount(count);
};

test.describe('Experience timeline filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expectCardCount(page, 3);
  });

  test('activating the IT filter highlights chip and narrows results', async ({ page }) => {
    const itFilter = page.locator(filterButton('IT Support'));

    await itFilter.click();

    await expect(itFilter).toHaveAttribute('aria-pressed', 'true');
    await expect(itFilter).toHaveClass(/is-active/);
    await expect(itFilter.locator('.experience-filter__remove')).toBeVisible();
    await expectCardCount(page, 1);
    await expect(page.locator(`${experienceCards()} h3`).first()).toContainText('IT Desktop Support Specialist');

    await itFilter.click();

    await expect(itFilter).toHaveAttribute('aria-pressed', 'false');
    await expect(itFilter).not.toHaveClass(/is-active/);
    await expect(itFilter.locator('.experience-filter__remove')).toHaveCount(0);
    await expectCardCount(page, 3);
  });

  test('switching between filters renders the matching experience', async ({ page }) => {
    const softwareFilter = page.locator(filterButton('Software'));
    await softwareFilter.click();
    await expectCardCount(page, 1);
    await expect(page.locator(`${experienceCards()} h3`).first()).toContainText('Full-Stack Software Developer');

    const aiFilter = page.locator(filterButton('AI/ML'));
    await aiFilter.click();
    await expectCardCount(page, 1);
    await expect(page.locator(`${experienceCards()} h3`).first()).toContainText('AI Trainer');
  });
});
