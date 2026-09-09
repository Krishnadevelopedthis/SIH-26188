import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'docscreen-theme';

function readStored() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'dark' || value === 'light' ? value : null;
  } catch {
    // Private browsing can throw on access.
    return null;
  }
}

function systemPrefersDark() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

/**
 * Light, dark, or whatever the machine is set to.
 *
 * The officer's own choice wins over the system preference, and until one
 * is made the console follows the machine — a night shift should not have
 * to set this on every terminal it signs into.
 */
export function useTheme() {
  const [choice, setChoice] = useState(readStored);

  const resolved = choice ?? (systemPrefersDark() ? 'dark' : 'light');

  useEffect(() => {
    const root = document.documentElement;

    if (choice) {
      root.dataset.theme = choice;
    } else {
      delete root.dataset.theme;
    }

    try {
      if (choice) {
        localStorage.setItem(STORAGE_KEY, choice);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Preference simply does not persist; the theme still applies.
    }
  }, [choice]);

  // With no explicit choice the console tracks the machine, including a
  // change made while it is open.
  useEffect(() => {
    if (choice) return undefined;

    const query = window.matchMedia?.('(prefers-color-scheme: dark)');

    if (!query) return undefined;

    const onChange = () => setChoice((current) => current);

    query.addEventListener('change', onChange);

    return () => query.removeEventListener('change', onChange);
  }, [choice]);

  const toggle = useCallback(() => {
    setChoice(resolved === 'dark' ? 'light' : 'dark');
  }, [resolved]);

  return { theme: resolved, toggle };
}
