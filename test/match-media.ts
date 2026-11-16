type MediaQueryListener = (event: MediaQueryListEvent) => void;

interface MatchMediaController {
  setMatches: (query: string, isMatching: boolean) => void;
}

export function installMatchMedia(
  initialMatches: Record<string, boolean> = {},
): MatchMediaController {
  const matchesByQuery = new Map(Object.entries(initialMatches));
  const listenersByQuery = new Map<string, Set<MediaQueryListener>>();

  function listenersFor(query: string): Set<MediaQueryListener> {
    const existingListeners = listenersByQuery.get(query) ?? new Set<MediaQueryListener>();
    listenersByQuery.set(query, existingListeners);
    return existingListeners;
  }

  window.matchMedia = (query: string) => {
    const queryListeners = listenersFor(query);
    return {
      get matches() {
        return matchesByQuery.get(query) ?? false;
      },
      media: query,
      onchange: null,
      addEventListener: (_eventName: string, listener: MediaQueryListener) => {
        queryListeners.add(listener);
      },
      removeEventListener: (_eventName: string, listener: MediaQueryListener) => {
        queryListeners.delete(listener);
      },
      addListener: (listener: MediaQueryListener) => {
        queryListeners.add(listener);
      },
      removeListener: (listener: MediaQueryListener) => {
        queryListeners.delete(listener);
      },
      dispatchEvent: () => true,
    } as unknown as MediaQueryList;
  };

  return {
    setMatches(query, isMatching) {
      matchesByQuery.set(query, isMatching);
      for (const listener of listenersFor(query)) {
        listener({ matches: isMatching, media: query } as MediaQueryListEvent);
      }
    },
  };
}
