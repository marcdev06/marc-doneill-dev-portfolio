'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import styles from './typewriter.module.scss';

const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

export const typewriterTimingMs = {
  typing: 70,
  deleting: 35,
  holdFullPhrase: 1800,
  beforeNextPhrase: 450,
} as const;

export type TypewriterPhrases = readonly [string, ...string[]];

interface TypingState {
  phraseIndex: number;
  visibleLength: number;
  isDeleting: boolean;
}

interface TypingStep {
  nextState: TypingState;
  delayMs: number;
}

export function planNextTypingStep(state: TypingState, phrases: TypewriterPhrases): TypingStep {
  const phraseLength = (phrases[state.phraseIndex] ?? phrases[0]).length;
  if (!state.isDeleting) {
    return state.visibleLength < phraseLength
      ? {
          nextState: { ...state, visibleLength: state.visibleLength + 1 },
          delayMs: typewriterTimingMs.typing,
        }
      : { nextState: { ...state, isDeleting: true }, delayMs: typewriterTimingMs.holdFullPhrase };
  }
  return state.visibleLength > 0
    ? {
        nextState: { ...state, visibleLength: state.visibleLength - 1 },
        delayMs: typewriterTimingMs.deleting,
      }
    : {
        nextState: {
          phraseIndex: (state.phraseIndex + 1) % phrases.length,
          visibleLength: 0,
          isDeleting: false,
        },
        delayMs: typewriterTimingMs.beforeNextPhrase,
      };
}

function subscribeToReducedMotion(onChange: () => void) {
  const mediaQueryList = window.matchMedia(reducedMotionQuery);
  mediaQueryList.addEventListener('change', onChange);
  return () => {
    mediaQueryList.removeEventListener('change', onChange);
  };
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(reducedMotionQuery).matches,
    () => true,
  );
}

interface TypewriterProps {
  prefix: string;
  phrases: TypewriterPhrases;
}

export function Typewriter({ prefix, phrases }: TypewriterProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [typingState, setTypingState] = useState<TypingState>({
    phraseIndex: 0,
    visibleLength: phrases[0].length,
    isDeleting: false,
  });

  useEffect(() => {
    if (prefersReducedMotion) {
      return undefined;
    }
    const { nextState, delayMs } = planNextTypingStep(typingState, phrases);
    const timerId = window.setTimeout(() => {
      setTypingState(nextState);
    }, delayMs);
    return () => {
      window.clearTimeout(timerId);
    };
  }, [typingState, prefersReducedMotion, phrases]);

  const visibleText = prefersReducedMotion
    ? phrases[0]
    : (phrases[typingState.phraseIndex] ?? phrases[0]).slice(0, typingState.visibleLength);

  return (
    <p className={styles.typewriter}>
      <span className="visually-hidden">{`${prefix} ${phrases[0]}`}</span>
      <span className={styles.stack} aria-hidden="true">
        {phrases.map((phrase) => (
          <span className={styles.ghost} key={phrase}>
            {`${prefix} ${phrase}`}
          </span>
        ))}
        <span>
          <span className={styles.prefix}>{`${prefix} `}</span>
          <span className={styles.phrase} data-testid="typewriter-phrase">
            {visibleText}
          </span>
        </span>
      </span>
    </p>
  );
}
