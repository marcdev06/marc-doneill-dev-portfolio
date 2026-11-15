import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { home } from '@/content/home';
import { profile } from '@/content/profile';
import { ContactForm } from './contact-form';
import type { ContactFormState } from './contact-form-state';

const { submitContactMessage } = vi.hoisted(() => ({ submitContactMessage: vi.fn() }));

vi.mock('./submit-contact-message', () => ({ submitContactMessage }));

const typedValues = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  message: 'I would like to talk about a contract project.',
};

function renderContactForm() {
  render(<ContactForm copy={home.contact.form} email={profile.email} />);
  return {
    nameField: screen.getByLabelText('Name'),
    emailField: screen.getByLabelText('Email'),
    messageField: screen.getByLabelText('Message'),
    statusRegion: screen.getByRole('status'),
  };
}

async function fillAndSubmit() {
  const user = userEvent.setup();
  const fields = renderContactForm();
  await user.type(fields.nameField, typedValues.name);
  await user.type(fields.emailField, typedValues.email);
  await user.type(fields.messageField, typedValues.message);
  await user.click(screen.getByRole('button', { name: 'Send message' }));
  return fields;
}

function resolveWith(formState: Partial<ContactFormState>) {
  submitContactMessage.mockResolvedValue({
    status: 'sent',
    invalidFields: [],
    values: { name: '', email: '', message: '' },
    submissionCount: 1,
    ...formState,
  });
}

describe('ContactForm', () => {
  beforeEach(() => {
    submitContactMessage.mockReset();
  });

  it('renders labelled, natively validated fields and an empty status region', () => {
    const { nameField, emailField, messageField, statusRegion } = renderContactForm();

    expect(nameField).toHaveAttribute('autocomplete', 'name');
    expect(nameField).toHaveAttribute('minlength', '2');
    expect(nameField).toHaveAttribute('maxlength', '100');
    expect(emailField).toHaveAttribute('type', 'email');
    expect(emailField).toHaveAttribute('autocomplete', 'email');
    expect(emailField).toHaveAttribute('maxlength', '254');
    expect(messageField.tagName).toBe('TEXTAREA');
    expect(messageField).toHaveAttribute('rows', '6');
    expect(messageField).toHaveAttribute('minlength', '20');
    expect(messageField).toHaveAttribute('maxlength', '5000');
    for (const field of [nameField, emailField, messageField]) {
      expect(field).toBeRequired();
      expect(field).not.toHaveAttribute('aria-invalid');
      expect(field).not.toHaveAttribute('aria-describedby');
    }

    const submitButton = screen.getByRole('button', { name: 'Send message' });
    expect(submitButton).toBeEnabled();
    expect(submitButton).toHaveAccessibleDescription(
      "Your message goes straight to my inbox; this site doesn't store it.",
    );
    expect(statusRegion).toBeEmptyDOMElement();
  });

  it('hides the honeypot from people and assistive tech', () => {
    renderContactForm();

    const honeypotField = document.querySelector('input[name="company_website"]');
    expect(honeypotField).toHaveAttribute('tabindex', '-1');
    expect(honeypotField).toHaveAttribute('autocomplete', 'off');
    expect(honeypotField?.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(screen.queryByRole('textbox', { name: 'Company website' })).toBeNull();
  });

  it('disables the button, keeping focus on it, while sending', async () => {
    let finishSending: (formState: ContactFormState) => void = () => undefined;
    submitContactMessage.mockReturnValue(
      new Promise<ContactFormState>((resolve) => {
        finishSending = resolve;
      }),
    );

    await fillAndSubmit();

    const pendingButton = screen.getByRole('button', { name: 'Sending…' });
    expect(pendingButton).toHaveAttribute('aria-disabled', 'true');
    expect(pendingButton).toHaveClass('disabled');
    expect(pendingButton).toHaveFocus();
    await userEvent.setup().keyboard('{Enter}');
    expect(submitContactMessage).toHaveBeenCalledTimes(1);
    const submittedFormData: unknown = submitContactMessage.mock.calls[0]?.[1];
    expect(submittedFormData).toBeInstanceOf(FormData);
    expect(Object.fromEntries((submittedFormData as FormData).entries())).toMatchObject({
      ...typedValues,
      company_website: '',
    });

    await act(async () => {
      finishSending({
        status: 'sent',
        invalidFields: [],
        values: { name: '', email: '', message: '' },
        submissionCount: 1,
      });
      await Promise.resolve();
    });
    const readyButton = screen.getByRole('button', { name: 'Send message' });
    expect(readyButton).not.toHaveAttribute('aria-disabled');
    expect(readyButton).not.toHaveClass('disabled');
    expect(readyButton).toHaveFocus();
  });

  it('announces success and resets the form', async () => {
    resolveWith({ status: 'sent' });

    const { nameField, emailField, messageField, statusRegion } = await fillAndSubmit();

    expect(await within(statusRegion).findByText(home.contact.form.successMessage)).toBeVisible();
    expect(nameField).toHaveValue('');
    expect(emailField).toHaveValue('');
    expect(messageField).toHaveValue('');
  });

  it('marks invalid fields and focuses the first one', async () => {
    resolveWith({
      status: 'invalid',
      invalidFields: ['email', 'message'],
      values: { ...typedValues, email: 'jane@example', message: 'Too short' },
    });

    const { nameField, emailField, messageField, statusRegion } = await fillAndSubmit();

    await vi.waitFor(() => {
      expect(emailField).toHaveFocus();
    });
    expect(emailField).toHaveAttribute('aria-invalid', 'true');
    expect(emailField).toHaveClass('is-invalid');
    expect(emailField).toHaveAccessibleDescription(home.contact.form.fields.email.error);
    expect(emailField).toHaveValue('jane@example');
    expect(messageField).toHaveAttribute('aria-invalid', 'true');
    expect(messageField).toHaveAccessibleDescription(home.contact.form.fields.message.error);
    expect(nameField).not.toHaveAttribute('aria-invalid');
    expect(nameField).toHaveValue('Jane Doe');
    expect(statusRegion).toBeEmptyDOMElement();
  });

  it('shows the failure message with a mailto link and keeps the values', async () => {
    resolveWith({ status: 'failed', values: typedValues });

    const { nameField, messageField, statusRegion } = await fillAndSubmit();

    const failureLink = await within(statusRegion).findByRole('link', { name: profile.email });
    expect(failureLink).toHaveAttribute('href', `mailto:${profile.email}`);
    expect(statusRegion).toHaveTextContent(
      `Sorry, your message couldn't be sent. Please email me directly at ${profile.email}.`,
    );
    expect(nameField).toHaveValue(typedValues.name);
    expect(messageField).toHaveValue(typedValues.message);
  });
});
