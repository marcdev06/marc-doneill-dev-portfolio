import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import {
  buildUniqueEmail,
  clickAndAwaitServerAction,
  expectNoAxeViolations,
  readReviewPath,
  storeThemePreference,
  useUniqueClientIp,
} from './helpers';
import {
  failingDeliveryUrl,
  fixtureResumePath,
  shortWindowPort,
  shortWindowUrl,
  sitePort,
} from './server-urls';

const dialogCopy = {
  intro:
    "Share your name and email and I'll approve your request personally, usually within a few minutes. Keep this window open: the download starts as soon as I approve.",
  waiting: 'Request sent. Waiting for my approval; this usually takes a few minutes.',
  approved: 'Approved. Your download is starting.',
  denied:
    "Sorry, I can't share my resume for this request. You can still reach me through the contact form.",
  expired: "I haven't been able to approve this yet. I have your details and will reply by email.",
  rateLimited:
    "You've reached the request limit. Please try again tomorrow, or use the contact form.",
  failure: "Sorry, the request couldn't be sent. Please try again later, or use the contact form.",
};
const resumeFileName = 'Marc_Doneill_Balatayo_CV.pdf';
const statusPollTimeoutMs = 20_000;

async function openResumeDialog(page: Page, baseUrl = '') {
  // A hash-only goto keeps the old modal open, so reload instead
  if (page.url().endsWith('/#contact')) {
    await page.reload();
  } else {
    await page.goto(`${baseUrl}/#contact`);
  }
  const trigger = page.getByRole('button', { name: 'Request my resume' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Request my resume' });
  await expect(dialog).toBeVisible();
  return { trigger, dialog };
}

async function submitResumeRequest(page: Page, requesterEmail: string) {
  const dialog = page.getByRole('dialog', { name: 'Request my resume' });
  await dialog.getByLabel('Name', { exact: true }).fill('Jane Doe');
  await dialog.getByLabel('Email', { exact: true }).fill(requesterEmail);
  await dialog.getByLabel("What's it for? (optional)").fill('A contract role.');
  await clickAndAwaitServerAction(dialog.getByRole('button', { name: 'Send request' }));
  return dialog.getByRole('status');
}

async function decideOnReviewPage(page: Page, reviewPath: string, decisionLabel: string) {
  const reviewPage = await page.context().newPage();
  await reviewPage.goto(reviewPath);
  await clickAndAwaitServerAction(reviewPage.getByRole('button', { name: decisionLabel }));
  return reviewPage;
}

test.describe('resume request', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test.beforeEach(async ({ page }) => {
    await useUniqueClientIp(page);
  });

  test('is a link to the contact section without JavaScript', async ({ browser }) => {
    const noScriptContext = await browser.newContext({ javaScriptEnabled: false });
    const noScriptPage = await noScriptContext.newPage();

    await noScriptPage.goto('/');

    await expect(
      noScriptPage.locator('section#contact').getByRole('link', { name: 'Request my resume' }),
    ).toHaveAttribute('href', '/#contact');
    await noScriptContext.close();
  });

  test('opens a modal that closes with Escape and returns focus', async ({ page }) => {
    const { trigger, dialog } = await openResumeDialog(page);

    await expect(dialog).toHaveAccessibleDescription(dialogCopy.intro);
    await expect(dialog.getByLabel('Name', { exact: true })).toBeFocused();
    await page.keyboard.press('Escape');

    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  for (const theme of ['dark', 'light'] as const) {
    test(`is approved through the review page and downloads the PDF in the ${theme} theme`, async ({
      page,
    }) => {
      await storeThemePreference(page, theme);
      const requesterEmail = buildUniqueEmail('approve');
      const { dialog } = await openResumeDialog(page);
      await expectNoAxeViolations(page);

      const statusRegion = await submitResumeRequest(page, requesterEmail);
      await expect(statusRegion).toHaveText(dialogCopy.waiting);
      await expectNoAxeViolations(page);

      const reviewPage = await decideOnReviewPage(
        page,
        await readReviewPath(sitePort, requesterEmail),
        'Approve',
      );
      await expect(
        reviewPage.getByText('Approved. The download starts in their window.'),
      ).toBeVisible();
      await expect(reviewPage.getByRole('button', { name: 'Approve' })).toHaveCount(0);

      const download = await page.waitForEvent('download', { timeout: statusPollTimeoutMs });
      expect(download.suggestedFilename()).toBe(resumeFileName);
      await expect(statusRegion).toContainText(dialogCopy.approved);
      const downloadLink = dialog.getByRole('link', { name: 'Download the PDF' });
      await expect(downloadLink).toHaveAttribute('download', resumeFileName);
      await expectNoAxeViolations(page);

      const downloadResponse = await page.request.get(
        (await downloadLink.getAttribute('href')) ?? '',
      );
      expect(downloadResponse.status()).toBe(200);
      expect(downloadResponse.headers()).toMatchObject({
        'content-type': 'application/pdf',
        'content-disposition': `attachment; filename="${resumeFileName}"`,
        'cache-control': 'no-store',
        'x-robots-tag': 'noindex',
      });
      expect(await downloadResponse.body()).toEqual(await readFile(fixtureResumePath));
    });

    test(`tells the visitor politely when Marc denies in the ${theme} theme`, async ({ page }) => {
      await storeThemePreference(page, theme);
      const requesterEmail = buildUniqueEmail('deny');
      await openResumeDialog(page);
      const statusRegion = await submitResumeRequest(page, requesterEmail);
      await expect(statusRegion).toHaveText(dialogCopy.waiting);

      await decideOnReviewPage(page, await readReviewPath(sitePort, requesterEmail), 'Deny');

      await expect(statusRegion).toHaveText(dialogCopy.denied, { timeout: statusPollTimeoutMs });
      await expect(page.getByRole('link', { name: 'Download the PDF' })).toHaveCount(0);
      await expectNoAxeViolations(page);
    });

    test(`shows the limit message after two requests from one email in the ${theme} theme`, async ({
      page,
    }) => {
      await storeThemePreference(page, theme);
      const requesterEmail = buildUniqueEmail('limit');
      for (let requestIndex = 0; requestIndex < 2; requestIndex += 1) {
        await openResumeDialog(page);
        await expect(await submitResumeRequest(page, requesterEmail)).toHaveText(
          dialogCopy.waiting,
        );
      }

      await openResumeDialog(page);
      const statusRegion = await submitResumeRequest(page, requesterEmail);

      await expect(statusRegion).toHaveText(dialogCopy.rateLimited);
      await expect(page.getByRole('button', { name: 'Close' })).toBeFocused();
      await expectNoAxeViolations(page);
    });

    test(`stops waiting once the window passes in the ${theme} theme`, async ({ page }) => {
      await storeThemePreference(page, theme);
      const requesterEmail = buildUniqueEmail('expire');
      await openResumeDialog(page, shortWindowUrl);
      const statusRegion = await submitResumeRequest(page, requesterEmail);

      await expect(statusRegion).toHaveText(dialogCopy.expired, { timeout: statusPollTimeoutMs });
      await expectNoAxeViolations(page);

      const reviewPage = await page.context().newPage();
      await reviewPage.goto(
        `${shortWindowUrl}${await readReviewPath(shortWindowPort, requesterEmail)}`,
      );
      await expect(
        reviewPage.getByText('This request expired before you decided. Reply by email instead:'),
      ).toContainText(requesterEmail);
      await expect(reviewPage.getByRole('main').getByRole('button')).toHaveCount(0);
    });

    test(`shows the failure message when the store is down in the ${theme} theme`, async ({
      page,
    }) => {
      await storeThemePreference(page, theme);
      await openResumeDialog(page, failingDeliveryUrl);

      const statusRegion = await submitResumeRequest(page, buildUniqueEmail('failure'));

      await expect(statusRegion).toHaveText(dialogCopy.failure);
      await expect(
        page.getByRole('dialog', { name: 'Request my resume' }).getByLabel('Name', { exact: true }),
      ).toHaveValue('Jane Doe');
      await expectNoAxeViolations(page);
    });
  }
});

test.describe('resume request at 320 px', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test('fits the dialog without horizontal scroll', async ({ page }) => {
    const { dialog } = await openResumeDialog(page);

    const dialogBox = await dialog.boundingBox();
    expect(dialogBox?.x).toBeGreaterThanOrEqual(0);
    expect((dialogBox?.x ?? 0) + (dialogBox?.width ?? 0)).toBeLessThanOrEqual(320);
    const pageWidths = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(pageWidths.scrollWidth).toBe(pageWidths.clientWidth);
  });
});

test.describe('resume review page', () => {
  test('answers 404 to a bad token and keeps valid links private', async ({ page, request }) => {
    await useUniqueClientIp(page);
    const requesterEmail = buildUniqueEmail('review');
    await openResumeDialog(page);
    await expect(await submitResumeRequest(page, requesterEmail)).toHaveText(dialogCopy.waiting);
    const reviewPath = await readReviewPath(sitePort, requesterEmail);

    const badTokenResponse = await request.get(
      reviewPath.replace(/token=[\w-]+/, `token=${'x'.repeat(43)}`),
    );
    expect(badTokenResponse.status()).toBe(404);
    expect((await request.get(reviewPath.replace(/\?.*$/, ''))).status()).toBe(404);

    const reviewResponse = await request.get(reviewPath);
    expect(reviewResponse.status()).toBe(200);
    expect(reviewResponse.headers()['cache-control']).toContain('no-store');
    expect(reviewResponse.headers()).toMatchObject({
      'x-robots-tag': 'noindex, nofollow',
      'referrer-policy': 'no-referrer',
    });
    const reviewHtml = await reviewResponse.text();
    expect(reviewHtml).toContain('<meta name="robots" content="noindex, nofollow"/>');
    expect(reviewHtml).toContain(requesterEmail);
  });

  test('changes nothing on GET, so prefetching mail scanners are harmless', async ({ page }) => {
    await useUniqueClientIp(page);
    const requesterEmail = buildUniqueEmail('prefetch');
    await openResumeDialog(page);
    await expect(await submitResumeRequest(page, requesterEmail)).toHaveText(dialogCopy.waiting);
    const reviewPath = await readReviewPath(sitePort, requesterEmail);

    for (let visitIndex = 0; visitIndex < 3; visitIndex += 1) {
      await page.request.get(reviewPath);
    }
    const reviewPage = await page.context().newPage();
    await reviewPage.goto(reviewPath);

    await expect(reviewPage.getByText('Waiting for your decision')).toBeVisible();
    await expectNoAxeViolations(reviewPage);
  });
});

test.describe('resume download', () => {
  test('rejects a missing or invented grant', async ({ request }) => {
    const missingResponse = await request.get('/api/resume/download');
    expect(missingResponse.status()).toBe(404);
    expect(missingResponse.headers()['content-type']).not.toContain('pdf');

    expect((await request.get(`/api/resume/download?grant=${'g'.repeat(43)}`)).status()).toBe(404);
  });
});
