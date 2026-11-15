import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page } from '@playwright/test';

export const homeTitle = 'Marc Doneill Balatayo · Full-Stack Software Engineer';
export const headerHeightPixels = 72;

export async function expectNoAxeViolations(page: Page) {
  const axeResults = await new AxeBuilder({ page }).analyze();
  expect(axeResults.violations).toEqual([]);
}

export async function waitForHydration(page: Page, selector: string) {
  await page.waitForFunction((hydratedSelector) => {
    const element = document.querySelector(hydratedSelector);
    return element !== null && Object.keys(element).some((key) => key.startsWith('__reactFiber'));
  }, selector);
}

export async function storeThemePreference(page: Page, theme: 'light' | 'dark') {
  await page.addInitScript((storedTheme) => {
    window.localStorage.setItem('theme', storedTheme);
  }, theme);
}

export async function readRenderedLines(textLocator: Locator): Promise<string[]> {
  await textLocator.page().evaluate(async () => {
    await document.fonts.ready;
  });
  return textLocator.evaluate((element) => {
    const textByLineTop = new Map<number, string>();
    const textWalker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    for (let textNode = textWalker.nextNode(); textNode; textNode = textWalker.nextNode()) {
      const nodeText = textNode.textContent ?? '';
      for (let charIndex = 0; charIndex < nodeText.length; charIndex += 1) {
        const charRange = document.createRange();
        charRange.setStart(textNode, charIndex);
        charRange.setEnd(textNode, charIndex + 1);
        const lineTop = Math.round(charRange.getBoundingClientRect().top);
        textByLineTop.set(lineTop, (textByLineTop.get(lineTop) ?? '') + nodeText.charAt(charIndex));
      }
    }
    return [...textByLineTop.values()];
  });
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
