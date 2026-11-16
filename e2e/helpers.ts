import { randomInt } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page, type Response } from '@playwright/test';
import { buildEmailLogPath } from './server-urls';

export const homeTitle = 'Marc Doneill Balatayo · Full-Stack Software Engineer';
export const headerHeightPixels = 72;
const serverActionTimeoutMs = 20_000;

// Hydrated forms fetch with Next-Action; script-free forms navigate
function isServerActionPost(response: Response): boolean {
  const request = response.request();
  return (
    request.method() === 'POST' &&
    (request.headers()['next-action'] !== undefined || request.isNavigationRequest())
  );
}

// Fails as "no response" before any assertion on the answer
export async function clickAndAwaitServerAction(submitControl: Locator): Promise<Response> {
  const clickedAtMs = Date.now();
  const [actionResponse] = await Promise.all([
    submitControl.page().waitForResponse(isServerActionPost, { timeout: serverActionTimeoutMs }),
    submitControl.click(),
  ]);
  const roundTripMs = Date.now() - clickedAtMs;
  test.info().annotations.push({
    type: 'server-action',
    description: `HTTP ${String(actionResponse.status())} after ${String(roundTripMs)} ms`,
  });
  expect(actionResponse.status(), 'Server Action response status').toBeLessThan(400);
  return actionResponse;
}

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

// Each test gets its own IP, so per-IP rate limits never collide
export async function useUniqueClientIp(page: Page) {
  const clientIp = [10, randomInt(256), randomInt(256), randomInt(1, 255)].join('.');
  await page.setExtraHTTPHeaders({ 'x-forwarded-for': clientIp });
  return clientIp;
}

export function buildUniqueEmail(label: string): string {
  return `${label}-${String(Date.now())}-${String(randomInt(1_000_000))}@example.com`;
}

async function readLoggedEmails(port: number): Promise<string> {
  try {
    return await readFile(buildEmailLogPath(port), 'utf8');
  } catch {
    return '';
  }
}

// The log sender's file is the e2e seam for review links
export async function readReviewPath(port: number, requesterEmail: string): Promise<string> {
  let reviewPath = '';
  await expect
    .poll(async () => {
      const loggedEmail = (await readLoggedEmails(port))
        .split('[email] ')
        .find((emailBlock) => emailBlock.includes(`Reply-To: ${requesterEmail}`));
      const reviewLink = /^https?:\/\/\S+\/resume-requests\/\S+$/m.exec(loggedEmail ?? '')?.[0];
      reviewPath = reviewLink ? `${new URL(reviewLink).pathname}${new URL(reviewLink).search}` : '';
      return reviewPath;
    })
    .not.toBe('');
  return reviewPath;
}
