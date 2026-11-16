import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installMatchMedia } from '../../../test/match-media';
import {
  planNextTypingStep,
  Typewriter,
  type TypewriterPhrases,
  typewriterTimingMs,
} from './typewriter';

const reducedMotionQuery = '(prefers-reduced-motion: reduce)';
const phrases: TypewriterPhrases = ['engineer.', 'dev.'];

function readTypedPhrase() {
  return screen.getByTestId('typewriter-phrase').textContent;
}

function runSteps(stepCount: number, stepDelayMs: number) {
  for (let stepNumber = 0; stepNumber < stepCount; stepNumber += 1) {
    act(() => {
      vi.advanceTimersByTime(stepDelayMs);
    });
  }
}

describe('planNextTypingStep', () => {
  it('types, holds, deletes and moves on to the next phrase', () => {
    expect(
      planNextTypingStep({ phraseIndex: 0, visibleLength: 3, isDeleting: false }, phrases),
    ).toEqual({
      nextState: { phraseIndex: 0, visibleLength: 4, isDeleting: false },
      delayMs: typewriterTimingMs.typing,
    });
    expect(
      planNextTypingStep({ phraseIndex: 0, visibleLength: 9, isDeleting: false }, phrases),
    ).toEqual({
      nextState: { phraseIndex: 0, visibleLength: 9, isDeleting: true },
      delayMs: typewriterTimingMs.holdFullPhrase,
    });
    expect(
      planNextTypingStep({ phraseIndex: 0, visibleLength: 9, isDeleting: true }, phrases),
    ).toEqual({
      nextState: { phraseIndex: 0, visibleLength: 8, isDeleting: true },
      delayMs: typewriterTimingMs.deleting,
    });
    expect(
      planNextTypingStep({ phraseIndex: 1, visibleLength: 0, isDeleting: true }, phrases),
    ).toEqual({
      nextState: { phraseIndex: 0, visibleLength: 0, isDeleting: false },
      delayMs: typewriterTimingMs.beforeNextPhrase,
    });
  });

  it('falls back to the first phrase for an out-of-range index', () => {
    expect(
      planNextTypingStep({ phraseIndex: 7, visibleLength: 9, isDeleting: false }, phrases),
    ).toEqual({
      nextState: { phraseIndex: 7, visibleLength: 9, isDeleting: true },
      delayMs: typewriterTimingMs.holdFullPhrase,
    });
  });
});

describe('Typewriter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('gives screen readers one static sentence and hides the animation', () => {
    render(<Typewriter prefix="I'm a" phrases={phrases} />);

    expect(screen.getByText("I'm a engineer.", { selector: '.visually-hidden' })).toBeVisible();
    expect(screen.getAllByText("I'm a engineer.")).toHaveLength(2);
    expect(screen.getByTestId('typewriter-phrase').closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('deletes the first phrase, types the next one and loops', () => {
    render(<Typewriter prefix="I'm a" phrases={phrases} />);
    expect(readTypedPhrase()).toBe('engineer.');

    runSteps(1, typewriterTimingMs.holdFullPhrase);
    runSteps(3, typewriterTimingMs.deleting);
    expect(readTypedPhrase()).toBe('engine');

    runSteps(6, typewriterTimingMs.deleting);
    expect(readTypedPhrase()).toBe('');

    runSteps(1, typewriterTimingMs.beforeNextPhrase);
    runSteps(4, typewriterTimingMs.typing);
    expect(readTypedPhrase()).toBe('dev.');

    runSteps(1, typewriterTimingMs.holdFullPhrase);
    runSteps(4, typewriterTimingMs.deleting);
    runSteps(1, typewriterTimingMs.beforeNextPhrase);
    runSteps(2, typewriterTimingMs.typing);
    expect(readTypedPhrase()).toBe('en');
  });

  it('shows the first phrase without animating under reduced motion', () => {
    installMatchMedia({ [reducedMotionQuery]: true });
    render(<Typewriter prefix="I'm a" phrases={phrases} />);

    runSteps(20, typewriterTimingMs.holdFullPhrase);

    expect(readTypedPhrase()).toBe('engineer.');
  });

  it('stops on the first phrase when reduced motion turns on mid-animation', () => {
    const matchMediaController = installMatchMedia();
    render(<Typewriter prefix="I'm a" phrases={phrases} />);
    runSteps(1, typewriterTimingMs.holdFullPhrase);
    runSteps(4, typewriterTimingMs.deleting);
    expect(readTypedPhrase()).toBe('engin');

    act(() => {
      matchMediaController.setMatches(reducedMotionQuery, true);
    });
    runSteps(20, typewriterTimingMs.holdFullPhrase);

    expect(readTypedPhrase()).toBe('engineer.');
  });
});
