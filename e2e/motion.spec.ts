import { expect, test } from '@playwright/test';

const firstPhrase = 'full-stack software engineer.';

test.describe('motion', () => {
  test('types through the role phrases when motion is allowed', async ({ page }) => {
    await page.goto('/');
    const typedPhrase = page.getByTestId('typewriter-phrase');

    await expect(typedPhrase).toHaveText(firstPhrase);
    await expect(typedPhrase).not.toHaveText(firstPhrase, { timeout: 5_000 });
  });

  test.describe('with reduced motion', () => {
    test.use({ contextOptions: { reducedMotion: 'reduce' } });

    test('shows the static typewriter sentence and stops the orbit', async ({ page, isMobile }) => {
      await page.goto('/');

      await expect(
        page.locator('.visually-hidden', { hasText: "I'm a full-stack software engineer." }),
      ).toHaveCount(1);
      const typedPhrase = page.getByTestId('typewriter-phrase');
      await expect(typedPhrase).toHaveText(firstPhrase);
      await page.waitForTimeout(3_000);
      await expect(typedPhrase).toHaveText(firstPhrase);

      if (!isMobile) {
        const orbitAnimationNames = await page
          .getByTestId('skill-orbit')
          .evaluate((orbitElement) =>
            [...orbitElement.querySelectorAll('*')].map(
              (orbitPart) => getComputedStyle(orbitPart).animationName,
            ),
          );
        expect(new Set(orbitAnimationNames)).toEqual(new Set(['none']));
      }
    });
  });
});
