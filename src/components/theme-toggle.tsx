'use client';

import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import styles from './theme-toggle.module.scss';
import { MoonIcon, SunIcon } from './ui/icons';

function subscribeToNothing() {
  return () => undefined;
}

function useIsHydrated(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isHydrated = useIsHydrated();
  const isLightTheme = isHydrated && resolvedTheme === 'light';
  const nextTheme = isLightTheme ? 'dark' : 'light';

  return (
    <button
      type="button"
      className="btn btn-icon rounded-circle"
      aria-label={`Switch to ${nextTheme} theme`}
      onClick={() => {
        setTheme(nextTheme);
      }}
    >
      <SunIcon className={styles.sunIcon} />
      <MoonIcon className={styles.moonIcon} />
    </button>
  );
}
