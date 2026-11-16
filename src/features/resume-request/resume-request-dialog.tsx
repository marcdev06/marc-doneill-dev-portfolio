'use client';

import { useActionState, useEffect, useRef } from 'react';
import { CloseIcon, DownloadIcon } from '@/components/ui/icons';
import { joinClassNames } from '@/components/ui/join-class-names';
import { loadBotProtection } from '@/features/bot-protection/load-bot-protection';
import type { ResumeRequestCopy } from '@/lib/content';
import {
  buildResumeDownloadPath,
  resumeRequestFieldLimits,
  resumeRequestHoneypotFieldName,
  type ResumeRequestFieldName,
} from '@/lib/resume-request/resume-request-fields';
import { requestResume } from './request-resume';
import {
  initialResumeRequestFormState,
  type ResumeRequestFormState,
} from './resume-request-form-state';
import styles from './resume-request-dialog.module.scss';
import { useResumeRequestStatus, type ResumeRequestProgress } from './use-resume-request-status';

interface ResumeRequestDialogProps {
  copy: ResumeRequestCopy;
  resumeFileName: string;
  isOpen: boolean;
  onClose: () => void;
}

type DialogPhase = 'form' | 'waiting' | 'rate-limited' | ResumeRequestProgress['status'];

const titleId = 'resume-request-title';
const introId = 'resume-request-intro';
const privacyNoteId = 'resume-request-privacy-note';
const honeypotFieldId = 'resume-request-company-website';

function toFieldId(fieldName: ResumeRequestFieldName) {
  return `resume-request-${fieldName}`;
}

function toErrorId(fieldName: ResumeRequestFieldName) {
  return `resume-request-${fieldName}-error`;
}

function derivePhase(
  formState: ResumeRequestFormState,
  progress: ResumeRequestProgress,
): DialogPhase {
  if (formState.status === 'rate-limited') {
    return 'rate-limited';
  }
  if (formState.status !== 'waiting') {
    return 'form';
  }
  return progress.status === 'pending' ? 'waiting' : progress.status;
}

function readPhaseMessage(
  phase: DialogPhase,
  formState: ResumeRequestFormState,
  copy: ResumeRequestCopy,
): string | undefined {
  const phaseMessages: Record<DialogPhase, string | undefined> = {
    form: formState.status === 'failed' ? copy.failureMessage : undefined,
    waiting: copy.waitingMessage,
    pending: copy.waitingMessage,
    approved: copy.approvedMessage,
    denied: copy.deniedMessage,
    expired: copy.expiredMessage,
    'rate-limited': copy.rateLimitedMessage,
    failed: copy.failureMessage,
  };
  return phaseMessages[phase];
}

function describeField(fieldName: ResumeRequestFieldName, formState: ResumeRequestFormState) {
  const isInvalid = formState.invalidFields.includes(fieldName);
  return {
    id: toFieldId(fieldName),
    name: fieldName,
    defaultValue: formState.values[fieldName],
    className: joinClassNames('form-control', isInvalid && 'is-invalid'),
    'aria-invalid': isInvalid || undefined,
    'aria-describedby': isInvalid ? toErrorId(fieldName) : undefined,
  };
}

interface FieldErrorProps {
  fieldName: ResumeRequestFieldName;
  formState: ResumeRequestFormState;
  copy: ResumeRequestCopy;
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

export default function ResumeRequestDialog({
  copy,
  resumeFileName,
  isOpen,
  onClose,
}: ResumeRequestDialogProps) {
  const [formState, submitAction, isPending] = useActionState(
    requestResume,
    initialResumeRequestFormState,
  );
  const progress = useResumeRequestStatus(formState.pendingRequest);
  const phase = derivePhase(formState, progress);
  const phaseMessage = readPhaseMessage(phase, formState, copy);
  const grant = progress.status === 'approved' ? progress.grant : undefined;
  const isFormShown = phase === 'form';

  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    loadBotProtection();
  }, []);

  useEffect(() => {
    const dialogElement = dialogRef.current;
    if (isOpen && dialogElement && !dialogElement.open) {
      dialogElement.showModal();
      formRef.current?.querySelector<HTMLElement>(`#${toFieldId('name')}`)?.focus();
    } else if (!isOpen && dialogElement?.open) {
      dialogElement.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const [firstInvalidField] = formState.invalidFields;
    if (firstInvalidField) {
      formRef.current?.querySelector<HTMLElement>(`#${toFieldId(firstInvalidField)}`)?.focus();
    }
  }, [formState]);

  // The submit button disappears, so focus moves somewhere stable
  useEffect(() => {
    if (!isFormShown) {
      closeButtonRef.current?.focus();
    }
  }, [isFormShown]);

  useEffect(() => {
    if (grant) {
      downloadLinkRef.current?.click();
    }
  }, [grant]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={introId}
      onClose={onClose}
    >
      <div className={styles.header}>
        <h2 className={styles.title} id={titleId}>
          {copy.title}
        </h2>
        <button
          ref={closeButtonRef}
          type="button"
          className="btn btn-icon btn-icon-plain rounded-circle"
          aria-label={copy.closeLabel}
          onClick={() => dialogRef.current?.close()}
        >
          <CloseIcon />
        </button>
      </div>
      <p className={styles.intro} id={introId}>
        {copy.intro}
      </p>

      {isFormShown && (
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
          <div>
            <label className="form-label" htmlFor={toFieldId('name')}>
              {copy.fields.name.label}
            </label>
            <input
              type="text"
              autoComplete="name"
              required
              minLength={resumeRequestFieldLimits.name.minLength}
              maxLength={resumeRequestFieldLimits.name.maxLength}
              {...describeField('name', formState)}
            />
            <FieldError fieldName="name" formState={formState} copy={copy} />
          </div>
          <div>
            <label className="form-label" htmlFor={toFieldId('email')}>
              {copy.fields.email.label}
            </label>
            <input
              type="email"
              autoComplete="email"
              required
              maxLength={resumeRequestFieldLimits.email.maxLength}
              {...describeField('email', formState)}
            />
            <FieldError fieldName="email" formState={formState} copy={copy} />
          </div>
          <div>
            <label className="form-label" htmlFor={toFieldId('note')}>
              {copy.fields.note.label}
            </label>
            <textarea
              rows={3}
              maxLength={resumeRequestFieldLimits.note.maxLength}
              {...describeField('note', formState)}
            />
            <FieldError fieldName="note" formState={formState} copy={copy} />
          </div>

          <div className={styles.honeypot} aria-hidden="true">
            <label htmlFor={honeypotFieldId}>{copy.honeypotLabel}</label>
            <input
              id={honeypotFieldId}
              type="text"
              name={resumeRequestHoneypotFieldName}
              tabIndex={-1}
              autoComplete="off"
              defaultValue=""
            />
          </div>

          <div>
            {/* aria-disabled keeps focus here; disabled would drop it */}
            <button
              type="submit"
              className={joinClassNames('btn btn-primary btn-glow', isPending && 'disabled')}
              aria-disabled={isPending || undefined}
              aria-describedby={privacyNoteId}
            >
              {isPending ? copy.pendingLabel : copy.submitLabel}
            </button>
            <p className="form-text mt-2 mb-0" id={privacyNoteId}>
              {copy.privacyNote}
            </p>
          </div>
        </form>
      )}

      <div className={styles.status} role="status">
        {phaseMessage && (
          <p
            key={`${phase}-${String(formState.submissionCount)}`}
            className={joinClassNames(
              styles.statusMessage,
              (phase === 'form' || phase === 'failed' || phase === 'rate-limited') &&
                styles.problemMessage,
            )}
          >
            {phase === 'waiting' && <span className={styles.spinner} aria-hidden="true" />}
            {phaseMessage}
          </p>
        )}
        {grant && (
          <a
            ref={downloadLinkRef}
            className={joinClassNames('btn btn-outline-body', styles.downloadLink)}
            href={buildResumeDownloadPath(grant)}
            download={resumeFileName}
          >
            <DownloadIcon className="me-2" />
            {copy.downloadLabel}
          </a>
        )}
      </div>
    </dialog>
  );
}
