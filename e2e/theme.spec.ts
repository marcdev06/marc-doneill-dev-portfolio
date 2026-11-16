import { expect, test } from '@playwright/test';
import { storeThemePreference } from './helpers';

test.describe('theme', () => {
  test('starts dark, switches to light and keeps it after a reload', async ({ page }) => {
    await page.goto('/');
    const rootElement = page.locator('html');
    await expect(rootElement).toHaveAttribute('data-bs-theme', 'dark');

    await page.getByRole('button', { name: 'Switch to light theme' }).click();
    await expect(rootElement).toHaveAttribute('data-bs-theme', 'light');

    await page.reload();
    await expect(rootElement).toHaveAttribute('data-bs-theme', 'light');
    await expect(page.getByRole('button', { name: 'Switch to dark theme' })).toBeVisible();

    await page.getByRole('button', { name: 'Switch to dark theme' }).click();
    await expect(rootElement).toHaveAttribute('data-bs-theme', 'dark');
  });

  test('ignores a light operating-system preference on the first visit', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'dark');
  });

  test('applies a saved theme before any bundle runs, so nothing flashes', async ({ page }) => {
    await storeThemePreference(page, 'light');
    await page.route(/\/_next\/static\/chunks\/.+\.js$/, (route) => route.abort());

    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'light');
    const bodyBackground = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    );
    expect(bodyBackground).toBe('rgb(244, 246, 242)');
  });
});
