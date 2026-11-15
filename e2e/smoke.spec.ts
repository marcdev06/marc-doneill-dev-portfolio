import { expect, test } from '@playwright/test';
import { homeTitle } from './helpers';

const unknownPath = '/this-page-does-not-exist';

test.describe('site shell', () => {
  test('renders the header, every home section and the footer', async ({ page, isMobile }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(homeTitle);
    const banner = page.getByRole('banner');
    await expect(banner.getByRole('link', { name: 'Marc Balatayo' })).toHaveAttribute('href', '/');

    if (!isMobile) {
      const primaryNavigation = banner.getByRole('navigation', { name: 'Primary' });
      for (const sectionName of ['Experience', 'About', 'Contact']) {
        await expect(primaryNavigation.getByRole('link', { name: sectionName })).toBeVisible();
      }
      await expect(primaryNavigation.getByRole('link', { name: 'Projects' })).toHaveCount(0);
    }

    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Building software that makes life easier for every Filipino.',
      }),
    ).toBeVisible();
    for (const sectionId of ['experience', 'skills', 'about', 'contact']) {
      await expect(page.locator(`section#${sectionId}`)).toHaveCount(1);
    }
    await expect(page.getByRole('contentinfo')).toContainText('Design inspired by Motionfolio');
  });

  test('serves the not-found page with HTTP 404 for an unknown URL', async ({ page }) => {
    const response = await page.goto(unknownPath);

    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
    await expect(page).toHaveTitle('Page not found · Marc Doneill Balatayo');

    await page.getByRole('link', { name: 'Back to home' }).click();
    await expect(page).toHaveURL('/');
  });

  test('makes the skip link the first tab stop, above the fixed header', async ({ page }) => {
    await page.goto('/');

    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeInViewport();
    const topElementName = await skipLink.evaluate((skipLinkElement) => {
      const skipLinkBox = skipLinkElement.getBoundingClientRect();
      const topElement = document.elementFromPoint(
        skipLinkBox.left + skipLinkBox.width / 2,
        skipLinkBox.top + skipLinkBox.height / 2,
      );
      return topElement?.textContent;
    });
    expect(topElementName).toBe('Skip to main content');

    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
  });
});

test.describe('resume', () => {
  test('serves the generated PDF', async ({ request }) => {
    const response = await request.get('/resume.pdf');

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/pdf');
  });

  test('renders the printable resume page in the light theme', async ({ page }) => {
    await page.goto('/resume');

    await expect(page).toHaveTitle('Resume · Marc Doneill Balatayo');
    const resumeSheet = page.getByRole('article', { name: 'Marc Doneill Balatayo' });
    await expect(resumeSheet).toHaveAttribute('data-bs-theme', 'light');
    await expect(resumeSheet.getByRole('heading', { level: 2 })).toHaveText([
      'Experience',
      'Skills',
      'Education',
    ]);
    await expect(page.getByRole('link', { name: 'Download resume' })).toHaveAttribute(
      'href',
      '/resume.pdf',
    );
  });
});
