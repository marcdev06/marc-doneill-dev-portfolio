import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations, storeThemePreference, waitForHydration } from './helpers';

const successMessage = "Thanks, your message was sent. I'll get back to you soon.";
const validMessage = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  message: 'Hello Marc, I would like to talk about a contract project.',
};

function locateContactForm(page: Page) {
  const contactSection = page.locator('section#contact');
  return {
    nameField: contactSection.getByLabel('Name', { exact: true }),
    emailField: contactSection.getByLabel('Email', { exact: true }),
    messageField: contactSection.getByLabel('Message', { exact: true }),
    honeypotField: contactSection.locator('input[name="company_website"]'),
    submitButton: contactSection.getByRole('button', { name: 'Send message' }),
    statusRegion: contactSection.getByRole('status'),
  };
}

async function openHydratedContactForm(page: Page) {
  await page.goto('/#contact');
  await waitForHydration(page, 'section#contact form');
  return locateContactForm(page);
}

async function fillValidMessage(page: Page) {
  const contactForm = locateContactForm(page);
  await contactForm.nameField.fill(validMessage.name);
  await contactForm.emailField.fill(validMessage.email);
  await contactForm.messageField.fill(validMessage.message);
}

async function submitServerInvalidValues(page: Page) {
  const contactForm = locateContactForm(page);
  // Whitespace and a dotless domain pass native checks only
  await contactForm.nameField.fill('  ');
  await contactForm.emailField.fill('jane@example');
  await contactForm.messageField.fill(' '.repeat(25));
  await contactForm.submitButton.click();
  await expect(contactForm.nameField).toHaveAttribute('aria-invalid', 'true');
}

test.describe('contact form', () => {
  test('sends a valid message, announces success and resets', async ({ page }) => {
    const contactForm = await openHydratedContactForm(page);

    await fillValidMessage(page);
    await contactForm.submitButton.click();

    await expect(contactForm.statusRegion).toHaveText(successMessage);
    await expect(contactForm.nameField).toHaveValue('');
    await expect(contactForm.emailField).toHaveValue('');
    await expect(contactForm.messageField).toHaveValue('');
    await expect(contactForm.submitButton).toBeEnabled();
  });

  test('blocks an empty submit with native validation', async ({ page }) => {
    const contactForm = await openHydratedContactForm(page);

    await contactForm.submitButton.click();

    const isNameMissing = await contactForm.nameField.evaluate(
      (nameInput: HTMLInputElement) => nameInput.validity.valueMissing,
    );
    expect(isNameMissing).toBe(true);
    await expect(contactForm.nameField).toBeFocused();
    await expect(contactForm.statusRegion).toBeEmpty();
  });

  test('shows server field errors and focuses the first invalid field', async ({ page }) => {
    const contactForm = await openHydratedContactForm(page);

    await submitServerInvalidValues(page);

    await expect(contactForm.nameField).toBeFocused();
    await expect(contactForm.nameField).toHaveAccessibleDescription(
      'Please enter your name (2 to 100 characters).',
    );
    await expect(contactForm.emailField).toHaveAttribute('aria-invalid', 'true');
    await expect(contactForm.emailField).toHaveValue('jane@example');
    await expect(contactForm.messageField).toHaveAccessibleDescription(
      'Please write a message of 20 to 5,000 characters.',
    );
    await expect(contactForm.statusRegion).toBeEmpty();
  });

  test('still reports success when the honeypot is filled', async ({ page }) => {
    const contactForm = await openHydratedContactForm(page);

    await fillValidMessage(page);
    await contactForm.honeypotField.evaluate((honeypotInput: HTMLInputElement) => {
      honeypotInput.value = 'https://spam.example';
    });
    await contactForm.submitButton.click();

    await expect(contactForm.statusRegion).toHaveText(successMessage);
    await expect(contactForm.nameField).toHaveValue('');
  });

  test('can be completed and sent with the keyboard only', async ({ page }) => {
    await page.goto('/');
    await waitForHydration(page, 'section#contact form');
    const contactForm = locateContactForm(page);
    const workWithMeLink = page.getByRole('link', { name: 'Work with me' });

    for (let tabPressCount = 0; tabPressCount < 15; tabPressCount += 1) {
      await page.keyboard.press('Tab');
      if (await workWithMeLink.evaluate((linkElement) => linkElement === document.activeElement)) {
        break;
      }
    }
    await expect(workWithMeLink).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#contact$/);

    await page.keyboard.press('Tab');
    await expect(contactForm.nameField).toBeFocused();
    await page.keyboard.type(validMessage.name);
    await page.keyboard.press('Tab');
    await expect(contactForm.emailField).toBeFocused();
    await page.keyboard.type(validMessage.email);
    await page.keyboard.press('Tab');
    await expect(contactForm.messageField).toBeFocused();
    await page.keyboard.type(validMessage.message);
    await page.keyboard.press('Tab');
    await expect(contactForm.submitButton).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(contactForm.statusRegion).toHaveText(successMessage);
    await expect(contactForm.messageField).toHaveValue('');
    await expect(contactForm.submitButton).toBeFocused();
  });

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });

    test('sends through the Server Action and lands back on the form', async ({ page }) => {
      await page.goto('/');
      const contactForm = locateContactForm(page);

      await fillValidMessage(page);
      await contactForm.submitButton.click();

      await expect(contactForm.statusRegion).toHaveText(successMessage);
      await expect(page).toHaveURL(/\/#contact$/);
      await expect(contactForm.nameField).toHaveValue('');
    });

    test('renders server field errors', async ({ page }) => {
      await page.goto('/');
      const contactForm = locateContactForm(page);

      await submitServerInvalidValues(page);

      await expect(contactForm.messageField).toHaveAttribute('aria-invalid', 'true');
      await expect(page.locator('#contact-name-error')).toBeVisible();
    });
  });
});

test.describe('contact form accessibility', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  for (const theme of ['dark', 'light'] as const) {
    test(`has no axe violations when idle, invalid and sent in the ${theme} theme`, async ({
      page,
    }) => {
      await storeThemePreference(page, theme);
      const contactForm = await openHydratedContactForm(page);
      await expect(page.locator('html')).toHaveAttribute('data-bs-theme', theme);
      await expectNoAxeViolations(page);

      await submitServerInvalidValues(page);
      await expect(page.locator('#contact-message-error')).toBeVisible();
      await expectNoAxeViolations(page);

      await fillValidMessage(page);
      await contactForm.submitButton.click();
      await expect(contactForm.statusRegion).toHaveText(successMessage);
      await expectNoAxeViolations(page);
    });
  }
});
