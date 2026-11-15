import { expect, test } from '@playwright/test';
import { expectHeadingBelowHeader } from './helpers';

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

test.describe('phone layout', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('has no horizontal scroll at 375 px', async ({ page }) => {
    await page.goto('/');

    const pageWidths = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(pageWidths.scrollWidth).toBe(pageWidths.clientWidth);
  });
});

test.describe('touch targets', () => {
  test('makes every standalone control at least 44 px', async ({ page, isMobile }) => {
    await page.goto('/');

    const controlLocators = [
      page.getByRole('button', { name: 'Switch to light theme' }),
      page.getByRole('link', { name: 'Work with me' }),
      page.getByRole('link', { name: 'See experience' }),
      page.getByRole('link', { name: 'GitHub profile' }).first(),
      page.getByRole('link', { name: 'LinkedIn profile' }).first(),
      page.getByRole('link', { name: 'balatayo.marcdoneill@gmail.com' }),
      page.getByRole('link', { name: 'Download resume' }),
      page.getByRole('link', { name: 'Built with Next.js + Bootstrap' }),
      page.getByRole('link', { name: 'Marc Balatayo' }),
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
