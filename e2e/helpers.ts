import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page } from '@playwright/test';

export const homeTitle = 'Marc Doneill Balatayo · Full-Stack Software Engineer';
export const headerHeightPixels = 72;

export async function expectNoAxeViolations(page: Page) {
  const axeResults = await new AxeBuilder({ page }).analyze();
  expect(axeResults.violations).toEqual([]);
}

export async function storeThemePreference(page: Page, theme: 'light' | 'dark') {
  await page.addInitScript((storedTheme) => {
    window.localStorage.setItem('theme', storedTheme);
  }, theme);
}

export async function expectHeadingBelowHeader(heading: Locator) {
  await expect(heading).toBeInViewport();
  await expect
    .poll(async () => {
      const headingBox = await heading.boundingBox();
      return headingBox ? Math.round(headingBox.y) : -1;
    })
    .toBeGreaterThanOrEqual(headerHeightPixels);
}
