'use client';

import Link from 'next/link';
import { lazy, Suspense, useRef, useState, useSyncExternalStore } from 'react';
import { FileEarmarkPersonIcon } from '@/components/ui/icons';
import type { ResumeRequestCopy } from '@/lib/content';

// Not in first-load JS; the chunk loads on intent
const loadDialogModule = () => import('./resume-request-dialog');
const ResumeRequestDialog = lazy(loadDialogModule);

function subscribeToNothing() {
  return () => undefined;
}

interface ResumeRequestTriggerProps {
  copy: ResumeRequestCopy;
  resumeFileName: string;
}

export function ResumeRequestTrigger({ copy, resumeFileName }: ResumeRequestTriggerProps) {
  const isHydrated = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const triggerContent = (
    <>
      <FileEarmarkPersonIcon className="me-2" />
      {copy.triggerLabel}
    </>
  );

  if (!isHydrated) {
    return (
      <Link className="btn btn-primary btn-glow" href="/#contact">
        {triggerContent}
      </Link>
    );
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="btn btn-primary btn-glow"
        aria-haspopup="dialog"
        onPointerEnter={() => void loadDialogModule()}
        onFocus={() => void loadDialogModule()}
        onClick={() => {
          setHasOpened(true);
          setIsOpen(true);
        }}
      >
        {triggerContent}
      </button>
      {hasOpened && (
        <Suspense fallback={null}>
          <ResumeRequestDialog
            copy={copy}
            resumeFileName={resumeFileName}
            isOpen={isOpen}
            onClose={() => {
              setIsOpen(false);
              triggerRef.current?.focus();
            }}
          />
        </Suspense>
      )}
    </>
  );
}
