import { useEffect, useState } from 'react';

/** Tailwind screens, as media queries. */
export const MD_UP = '(min-width: 768px)';
export const LG_UP = '(min-width: 1024px)';

const supportsMatchMedia = () => typeof window.matchMedia === 'function';

/**
 * `false` only when `matchMedia` genuinely reports a mismatch; jsdom (no
 * `matchMedia`) falls back to `true` so a caller passing a `*-UP` query gets
 * the desktop layout by default in tests that don't mock it.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    supportsMatchMedia() ? window.matchMedia(query).matches : true
  );

  useEffect(() => {
    if (!supportsMatchMedia()) {
      setMatches(true);
      return;
    }

    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    mql.addEventListener('change', listener);
    return () => mql.removeEventListener('change', listener);
  }, [query]);

  return matches;
}
