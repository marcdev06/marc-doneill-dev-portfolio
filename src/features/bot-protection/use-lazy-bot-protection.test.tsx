import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nearViewportMargin, useLazyBotProtection } from './use-lazy-bot-protection';

const { startBotProtection } = vi.hoisted(() => ({ startBotProtection: vi.fn() }));

vi.mock('./bot-protection-client', () => ({ startBotProtection }));

type ObserverCallback = (observerEntries: { isIntersecting: boolean }[]) => void;

class FakeIntersectionObserver {
  static latest: FakeIntersectionObserver | undefined;
  readonly observedElements: Element[] = [];
  isDisconnected = false;

  constructor(
    readonly callback: ObserverCallback,
    readonly options: IntersectionObserverInit,
  ) {
    FakeIntersectionObserver.latest = this;
  }

  observe(element: Element) {
    this.observedElements.push(element);
  }

  disconnect() {
    this.isDisconnected = true;
  }

  reportIntersection(isIntersecting: boolean) {
    this.callback([{ isIntersecting }]);
  }
}

function latestObserver(): FakeIntersectionObserver {
  if (!FakeIntersectionObserver.latest) {
    throw new Error('No IntersectionObserver was created');
  }
  return FakeIntersectionObserver.latest;
}

function ProtectedForm() {
  const formRef = useRef<HTMLFormElement>(null);
  useLazyBotProtection(formRef);
  return (
    <form ref={formRef} aria-label="Contact">
      <input aria-label="Name" />
    </form>
  );
}

describe('useLazyBotProtection', () => {
  beforeEach(() => {
    startBotProtection.mockReset();
    FakeIntersectionObserver.latest = undefined;
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'production');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('starts BotID once the form nears the viewport', async () => {
    render(<ProtectedForm />);
    const viewportObserver = latestObserver();

    expect(viewportObserver.options).toEqual({ rootMargin: nearViewportMargin });
    expect(viewportObserver.observedElements).toEqual([screen.getByRole('form')]);
    viewportObserver.reportIntersection(false);
    expect(startBotProtection).not.toHaveBeenCalled();

    viewportObserver.reportIntersection(true);

    await waitFor(() => {
      expect(startBotProtection).toHaveBeenCalledTimes(1);
    });
    expect(viewportObserver.isDisconnected).toBe(true);
  });

  it('starts BotID on the first focus inside the form, and only once', async () => {
    render(<ProtectedForm />);
    const viewportObserver = latestObserver();

    fireEvent.focusIn(screen.getByRole('textbox', { name: 'Name' }));
    viewportObserver.reportIntersection(true);
    fireEvent.focusIn(screen.getByRole('textbox', { name: 'Name' }));

    await waitFor(() => {
      expect(startBotProtection).toHaveBeenCalledTimes(1);
    });
  });

  it('stops watching when the form unmounts', () => {
    const { unmount } = render(<ProtectedForm />);

    unmount();

    expect(latestObserver().isDisconnected).toBe(true);
  });

  it('never loads BotID off Vercel, where its challenge script would 404', () => {
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', '');

    render(<ProtectedForm />);
    fireEvent.focusIn(screen.getByRole('textbox', { name: 'Name' }));

    expect(FakeIntersectionObserver.latest).toBeUndefined();
    expect(startBotProtection).not.toHaveBeenCalled();
  });
});
