import { expect, test } from '@playwright/test';
import { expectHeadingBelowHeader, readRenderedLines } from './helpers';

const sectionHeadings = [
  { linkName: 'Experience', headingName: 'Experience' },
  { linkName: 'About', headingName: 'About' },
  { linkName: 'Contact', headingName: "Let's build something" },
];

test.describe('desktop navigation', () => {
  test.skip(({ isMobile }) => isMobile, 'The desktop links are hidden on phones');

  for (const { linkName, headingName } of sectionHeadings) {
    test(`lands on ${linkName} with its heading below the header`, async ({ page }) => {
      await page.goto('/');

      await page
        .getByRole('navigation', { name: 'Primary' })
        .getByRole('link', { name: linkName })
        .click();

      await expect(page).toHaveURL(new RegExp(`#${linkName.toLowerCase()}$`));
      await expectHeadingBelowHeader(page.getByRole('heading', { level: 2, name: headingName }));
    });
  }
});

test.describe('mobile menu', () => {
  test.skip(({ isMobile }) => !isMobile, 'The menu button only shows on phones');

  test('opens a dialog that traps focus and closes with Escape', async ({ page }) => {
    await page.goto('/');
    const menuButton = page.getByRole('button', { name: 'Open menu' });

    await menuButton.click();
    const menuDialog = page.getByRole('dialog', { name: 'Menu' });
    await expect(menuDialog).toBeVisible();

    for (let tabPressCount = 0; tabPressCount < 6; tabPressCount += 1) {
      await page.keyboard.press('Tab');
      const isFocusInsideMenu = await menuDialog.evaluate((dialogElement) =>
        dialogElement.contains(document.activeElement),
      );
      expect(isFocusInsideMenu).toBe(true);
    }

    await page.keyboard.press('Escape');
    await expect(menuDialog).toBeHidden();
    await expect(menuButton).toBeFocused();
  });

  test('closes the menu and lands on the chosen section', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('dialog', { name: 'Menu' }).getByRole('link', { name: 'About' }).click();

    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeHidden();
    await expect(page).toHaveURL(/#about$/);
    await expectHeadingBelowHeader(page.getByRole('heading', { level: 2, name: 'About' }));
  });
});

for (const phoneWidth of [375, 320]) {
  test.describe(`phone layout at ${String(phoneWidth)} px`, () => {
    test.use({ viewport: { width: phoneWidth, height: 812 } });

    test('has no horizontal scroll', async ({ page }) => {
      await page.goto('/');

      const pageWidths = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(pageWidths.scrollWidth).toBe(pageWidths.clientWidth);
    });
  });
}

test.describe('touch targets', () => {
  test('makes every standalone control at least 44 px', async ({ page, isMobile }) => {
    await page.goto('/');

    const controlLocators = [
      page.getByRole('button', { name: 'Switch to light theme' }),
      page.getByRole('link', { name: 'Work with me' }),
      page.getByRole('link', { name: 'See experience' }),
      page.getByRole('link', { name: 'GitHub profile' }).first(),
      page.getByRole('link', { name: 'LinkedIn profile' }).first(),
      page.getByRole('button', { name: 'Request my resume' }),
      page.getByRole('link', { name: 'Built with Next.js + Bootstrap' }),
      page.getByRole('link', { name: 'Marc Balatayo' }),
      page.getByLabel('Name', { exact: true }),
      page.getByLabel('Email', { exact: true }),
      page.getByLabel('Message', { exact: true }),
      page.getByRole('button', { name: 'Send message' }),
      isMobile
        ? page.getByRole('button', { name: 'Open menu' })
        : page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'About' }),
    ];

    for (const controlLocator of controlLocators) {
      const controlBox = await controlLocator.boundingBox();
      expect(controlBox?.height, await controlLocator.innerText()).toBeGreaterThanOrEqual(44);
      expect(controlBox?.width).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe('headline highlight', () => {
  for (const viewportWidth of [320, 375, 768, 1280]) {
    test(`keeps "everyday life" on one line inside the ellipse at ${String(viewportWidth)} px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewportWidth, height: 900 });
      await page.goto('/');

      const highlight = page.getByRole('heading', { level: 1 }).getByText('everyday life');
      expect(await readRenderedLines(highlight)).toEqual(['everyday life']);
      // The ellipse overhangs the text by 0.5em but stays on screen
      const highlightBox = await highlight.boundingBox();
      expect(highlightBox?.x).toBeGreaterThanOrEqual(0);
      expect((highlightBox?.x ?? 0) + (highlightBox?.width ?? 0)).toBeLessThanOrEqual(
        viewportWidth,
      );
    });
  }
});
