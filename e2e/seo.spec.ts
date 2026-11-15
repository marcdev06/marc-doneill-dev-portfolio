import { expect, test, type Page } from '@playwright/test';

const indexedPages = [
  { path: '/', title: 'Marc Doneill Balatayo · Full-Stack Software Engineer' },
  { path: '/resume', title: 'Resume · Marc Doneill Balatayo' },
];

function toAbsoluteUrl(href: string | null): URL {
  // Throws for relative URLs, which crawlers resolve inconsistently
  return new URL(href ?? '');
}

async function readMetaContent(page: Page, selector: string): Promise<string | null> {
  return page.locator(`head ${selector}`).getAttribute('content');
}

async function collectPageProblems(page: Page, path: string): Promise<string[]> {
  const pageProblems: string[] = [];
  page.on('console', (consoleMessage) => {
    if (consoleMessage.type() === 'error') {
      pageProblems.push(`console error: ${consoleMessage.text()}`);
    }
  });
  page.on('pageerror', (pageError) => pageProblems.push(`page error: ${pageError.message}`));
  page.on('requestfailed', (failedRequest) => {
    pageProblems.push(
      `failed: ${failedRequest.url()} (${failedRequest.failure()?.errorText ?? ''})`,
    );
  });
  page.on('response', (response) => {
    if (response.status() >= 400) {
      pageProblems.push(`HTTP ${String(response.status())}: ${response.url()}`);
    }
  });

  await page.goto(path, { waitUntil: 'networkidle' });
  // Reaching the bottom triggers lazy images and observers
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForLoadState('networkidle');
  return pageProblems;
}

test.describe('crawler files', () => {
  test('robots.txt allows crawling and points at the absolute sitemap', async ({ request }) => {
    const response = await request.get('/robots.txt');

    expect(response.status()).toBe(200);
    const robotsText = await response.text();
    expect(robotsText).toMatch(/^Allow: \/$/m);
    expect(robotsText).not.toMatch(/^Disallow:/m);
    const sitemapUrl = toAbsoluteUrl(/^Sitemap: (.+)$/m.exec(robotsText)?.[1] ?? null);
    expect(sitemapUrl.pathname).toBe('/sitemap.xml');
  });

  test('sitemap.xml lists exactly the home and resume pages as absolute URLs', async ({
    request,
  }) => {
    const response = await request.get('/sitemap.xml');

    expect(response.status()).toBe(200);
    const sitemapXml = await response.text();
    const listedUrls = [...sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g)].map((locMatch) =>
      toAbsoluteUrl(locMatch[1] ?? null),
    );
    expect(listedUrls.map((listedUrl) => listedUrl.pathname)).toEqual(['/', '/resume']);
    expect(sitemapXml).not.toContain('<lastmod>');
  });

  test('serves the Open Graph image as a 1200×630 PNG', async ({ request }) => {
    const response = await request.get('/opengraph-image');

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('image/png');
    const pngBytes = await response.body();
    expect(pngBytes.subarray(1, 4).toString('ascii')).toBe('PNG');
    expect({ width: pngBytes.readUInt32BE(16), height: pngBytes.readUInt32BE(20) }).toEqual({
      width: 1200,
      height: 630,
    });
  });
});

test.describe('page metadata', () => {
  for (const indexedPage of indexedPages) {
    test(`gives ${indexedPage.path} absolute canonical, Open Graph and Twitter tags`, async ({
      page,
      request,
    }) => {
      await page.goto(indexedPage.path);

      const canonicalUrl = toAbsoluteUrl(
        await page.locator('head link[rel="canonical"]').getAttribute('href'),
      );
      const openGraphUrl = toAbsoluteUrl(await readMetaContent(page, 'meta[property="og:url"]'));
      const openGraphImageUrl = toAbsoluteUrl(
        await readMetaContent(page, 'meta[property="og:image"]'),
      );
      expect(canonicalUrl.pathname).toBe(indexedPage.path);
      expect(openGraphUrl.href).toBe(canonicalUrl.href);
      expect(openGraphImageUrl.origin).toBe(canonicalUrl.origin);
      expect(openGraphImageUrl.pathname).toBe('/opengraph-image');

      expect(await readMetaContent(page, 'meta[property="og:type"]')).toBe('website');
      expect(await readMetaContent(page, 'meta[property="og:site_name"]')).toBe(
        'Marc Doneill Balatayo',
      );
      expect(await readMetaContent(page, 'meta[property="og:locale"]')).toBe('en_PH');
      expect(await readMetaContent(page, 'meta[property="og:title"]')).toBe(indexedPage.title);
      expect(await readMetaContent(page, 'meta[property="og:description"]')).toBe(
        await readMetaContent(page, 'meta[name="description"]'),
      );
      expect(await readMetaContent(page, 'meta[property="og:image:alt"]')).toContain(
        'every Filipino',
      );
      expect(await readMetaContent(page, 'meta[name="twitter:card"]')).toBe('summary_large_image');
      expect(await readMetaContent(page, 'meta[name="theme-color"]')).toBe('#0f1714');

      const imageResponse = await request.get(
        `${openGraphImageUrl.pathname}${openGraphImageUrl.search}`,
      );
      expect(imageResponse.status()).toBe(200);
    });
  }

  test('describes Marc as a ProfilePage Person in JSON-LD, without his email', async ({ page }) => {
    await page.goto('/');

    const jsonLdScripts = page.locator('script[type="application/ld+json"]');
    await expect(jsonLdScripts).toHaveCount(1);
    const jsonLdText = (await jsonLdScripts.textContent()) ?? '';
    const structuredData = JSON.parse(jsonLdText) as {
      '@type': string;
      mainEntity: Record<string, unknown>;
    };

    expect(structuredData['@type']).toBe('ProfilePage');
    expect(structuredData.mainEntity).toMatchObject({
      '@type': 'Person',
      name: 'Marc Doneill Balatayo',
      jobTitle: 'Full-Stack Software Engineer',
      sameAs: ['https://www.linkedin.com/in/marcdev06', 'https://github.com/marcdev06'],
      address: { addressLocality: 'Taguig City', addressCountry: 'PH' },
      worksFor: { name: 'KwikCare' },
    });
    expect(toAbsoluteUrl(structuredData.mainEntity.image as string).pathname).toBe(
      '/images/profile-photo.jpg',
    );
    expect(jsonLdText).not.toMatch(/email|telephone|@gmail/i);
  });
});

test.describe('security headers', () => {
  for (const path of ['/', '/resume']) {
    test(`are sent with ${path}`, async ({ request }) => {
      const response = await request.get(path);

      expect(response.headers()).toMatchObject({
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'strict-origin-when-cross-origin',
        'permissions-policy': 'camera=(), microphone=(), geolocation=()',
        'content-security-policy':
          "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
      });
    });
  }
});

test.describe('clean pages', () => {
  for (const path of ['/', '/resume']) {
    test(`${path} logs no console errors and has no failed requests`, async ({ page }) => {
      expect(await collectPageProblems(page, path)).toEqual([]);
    });
  }
});
