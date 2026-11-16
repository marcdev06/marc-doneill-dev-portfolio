import { test } from '@playwright/test';
import { expectNoAxeViolations, storeThemePreference } from './helpers';

test.describe('accessibility', () => {
  test('has no axe violations on the home page in the dark theme', async ({ page }) => {
    await page.goto('/');
    await expectNoAxeViolations(page);
  });

  test('has no axe violations on the home page in the light theme', async ({ page }) => {
    await storeThemePreference(page, 'light');
    await page.goto('/');
    await expectNoAxeViolations(page);
  });

  test('has no axe violations on the resume page', async ({ page }) => {
    await page.goto('/resume');
    await expectNoAxeViolations(page);
  });

  test('has no axe violations on the not-found page', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    await expectNoAxeViolations(page);
  });

  test.describe('with every section fully revealed', () => {
    test.use({ contextOptions: { reducedMotion: 'reduce' } });

    for (const theme of ['dark', 'light'] as const) {
      test(`has no axe violations on the home page in the ${theme} theme`, async ({ page }) => {
        await storeThemePreference(page, theme);
        await page.goto('/');
        await expectNoAxeViolations(page);
      });
    }
  });
});
