import { useEffect, type RefObject } from 'react';

export const nearViewportMargin = '800px 0px';

// Submits before BotID starts fail closed with the email fallback
export function useLazyBotProtection(formRef: RefObject<HTMLFormElement | null>) {
  useEffect(() => {
    const formElement = formRef.current;
    // Only Vercel serves BotID's challenge script
    if (!process.env.NEXT_PUBLIC_VERCEL_ENV || !formElement) {
      return;
    }

    let hasStarted = false;
    const stopWatching = () => {
      viewportObserver.disconnect();
      formElement.removeEventListener('focusin', startOnce);
    };
    const startOnce = () => {
      if (hasStarted) {
        return;
      }
      hasStarted = true;
      stopWatching();
      void import('./bot-protection-client').then(({ startBotProtection }) => {
        startBotProtection();
      });
    };
    const viewportObserver = new IntersectionObserver(
      (observerEntries) => {
        if (observerEntries.some((observerEntry) => observerEntry.isIntersecting)) {
          startOnce();
        }
      },
      { rootMargin: nearViewportMargin },
    );

    viewportObserver.observe(formElement);
    formElement.addEventListener('focusin', startOnce);
    return stopWatching;
  }, [formRef]);
}
