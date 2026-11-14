import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const unknownPath = '/this-page-does-not-exist';

async function expectNoAxeViolations(page: Page) {
  const axeResults = await new AxeBuilder({ page }).analyze();
  expect(axeResults.violations).toEqual([]);
}

test.describe('site shell', () => {
  test('renders the header, main content and footer on the home page', async ({ page }) => {
    await page.goto('/');

    const banner = page.getByRole('banner');
    await expect(banner.getByRole('link', { name: 'Portfolio' })).toHaveAttribute('href', '/');

    const primaryNavigation = banner.getByRole('navigation', { name: 'Primary' });
    for (const sectionName of ['Projects', 'Experience', 'About', 'Contact']) {
      await expect(primaryNavigation.getByRole('link', { name: sectionName })).toBeVisible();
    }

    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
    await expect(page).toHaveTitle('Portfolio');
  });

  test('serves the not-found page with HTTP 404 for an unknown URL', async ({ page }) => {
    const response = await page.goto(unknownPath);

    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
    await expect(page).toHaveTitle('Page not found · Portfolio');

    await page.getByRole('link', { name: 'Back to home' }).click();
    await expect(page).toHaveURL('/');
  });

  test('makes the skip link the first tab stop and moves focus to main', async ({ page }) => {
    await page.goto('/');

    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeInViewport();

    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
  });
});

test.describe('accessibility', () => {
  test('has no axe violations on the home page', async ({ page }) => {
    await page.goto('/');
    await expectNoAxeViolations(page);
  });

  test('has no axe violations on the not-found page', async ({ page }) => {
    await page.goto(unknownPath);
    await expectNoAxeViolations(page);
  });
});
