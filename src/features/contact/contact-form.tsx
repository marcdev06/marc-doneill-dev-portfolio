'use client';

import { useActionState, useEffect, useRef } from 'react';
import { EmailAddress } from '@/components/ui/email-address';
import { joinClassNames } from '@/components/ui/join-class-names';
import {
  contactFieldLimits,
  contactHoneypotFieldName,
  type ContactFieldName,
} from '@/lib/contact/contact-fields';
import type { ContactFormCopy } from '@/lib/content';
import { initialContactFormState, type ContactFormState } from './contact-form-state';
import styles from './contact-form.module.scss';
import { submitContactMessage } from './submit-contact-message';
import { useLazyBotProtection } from './use-lazy-bot-protection';

interface ContactFormProps {
  copy: ContactFormCopy;
  email: string;
}

const privacyNoteId = 'contact-privacy-note';
const honeypotFieldId = 'contact-company-website';

function toFieldId(fieldName: ContactFieldName) {
  return `contact-${fieldName}`;
}

function toErrorId(fieldName: ContactFieldName) {
  return `contact-${fieldName}-error`;
}

function describeField(fieldName: ContactFieldName, formState: ContactFormState) {
  const isInvalid = formState.invalidFields.includes(fieldName);
  return {
    id: toFieldId(fieldName),
    name: fieldName,
    required: true,
    defaultValue: formState.values[fieldName],
    className: joinClassNames('form-control', isInvalid && 'is-invalid'),
    'aria-invalid': isInvalid || undefined,
    'aria-describedby': isInvalid ? toErrorId(fieldName) : undefined,
  };
}

interface FieldErrorProps {
  fieldName: ContactFieldName;
  formState: ContactFormState;
  copy: ContactFormCopy;
}

function FieldError({ fieldName, formState, copy }: FieldErrorProps) {
  if (!formState.invalidFields.includes(fieldName)) {
    return null;
  }
  return (
    <div className="invalid-feedback" id={toErrorId(fieldName)}>
      {copy.fields[fieldName].error}
    </div>
  );
}

export function ContactForm({ copy, email }: ContactFormProps) {
  const [formState, submitAction, isPending] = useActionState(
    submitContactMessage,
    initialContactFormState,
    '/#contact',
  );
  const formRef = useRef<HTMLFormElement>(null);
  useLazyBotProtection(formRef);

  useEffect(() => {
    const [firstInvalidField] = formState.invalidFields;
    if (firstInvalidField) {
      formRef.current?.querySelector<HTMLElement>(`#${toFieldId(firstInvalidField)}`)?.focus();
    }
  }, [formState]);

  return (
    <form
      ref={formRef}
      className={styles.form}
      action={submitAction}
      onSubmit={(submitEvent) => {
        if (isPending) {
          submitEvent.preventDefault();
        }
      }}
    >
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label" htmlFor={toFieldId('name')}>
            {copy.fields.name.label}
          </label>
          <input
            type="text"
            autoComplete="name"
            minLength={contactFieldLimits.name.minLength}
            maxLength={contactFieldLimits.name.maxLength}
            {...describeField('name', formState)}
          />
          <FieldError fieldName="name" formState={formState} copy={copy} />
        </div>
        <div className="col-md-6">
          <label className="form-label" htmlFor={toFieldId('email')}>
            {copy.fields.email.label}
          </label>
          <input
            type="email"
            autoComplete="email"
            maxLength={contactFieldLimits.email.maxLength}
            {...describeField('email', formState)}
          />
          <FieldError fieldName="email" formState={formState} copy={copy} />
        </div>
        <div className="col-12">
          <label className="form-label" htmlFor={toFieldId('message')}>
            {copy.fields.message.label}
          </label>
          <textarea
            rows={6}
            minLength={contactFieldLimits.message.minLength}
            maxLength={contactFieldLimits.message.maxLength}
            {...describeField('message', formState)}
          />
          <FieldError fieldName="message" formState={formState} copy={copy} />
        </div>
      </div>

      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor={honeypotFieldId}>{copy.honeypotLabel}</label>
        <input
          id={honeypotFieldId}
          type="text"
          name={contactHoneypotFieldName}
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      {/* aria-disabled keeps focus here; disabled would drop it */}
      <button
        type="submit"
        className={joinClassNames('btn btn-primary btn-glow mt-4', isPending && 'disabled')}
        aria-disabled={isPending || undefined}
        aria-describedby={privacyNoteId}
      >
        {isPending ? copy.pendingLabel : copy.submitLabel}
      </button>
      <p className="form-text mt-2 mb-0" id={privacyNoteId}>
        {copy.privacyNote}
      </p>

      <div className={styles.status} role="status">
        {formState.status === 'sent' && (
          <p key={formState.submissionCount} className={styles.statusMessage}>
            {copy.successMessage}
          </p>
        )}
        {formState.status === 'failed' && (
          <p
            key={formState.submissionCount}
            className={joinClassNames(styles.statusMessage, styles.failureMessage)}
          >
            {copy.failureMessage.beforeEmail}
            <a href={`mailto:${email}`}>
              <EmailAddress address={email} />
            </a>
            {copy.failureMessage.afterEmail}
          </p>
        )}
      </div>
    </form>
  );
}
