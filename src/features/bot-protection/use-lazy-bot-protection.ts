import { useEffect, type RefObject } from 'react';
import { loadBotProtection } from './load-bot-protection';

export const nearViewportMargin = '800px 0px';

export function useLazyBotProtection(formRef: RefObject<HTMLFormElement | null>) {
  useEffect(() => {
    const formElement = formRef.current;
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
      loadBotProtection();
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
