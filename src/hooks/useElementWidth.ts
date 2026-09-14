import { RefObject, useLayoutEffect, useState } from 'react';

/**
 * Container width in px, via `ResizeObserver`. `null` when the observer is
 * unavailable (jsdom in unit tests) — callers treat that as "measurement
 * unsupported here", not "0px", so a test never renders the narrow-width
 * layout by accident (U-5).
 */
export function useElementWidth<T extends HTMLElement>(ref: RefObject<T | null>): number | null {
  const [width, setWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const node = ref.current;
    if (!node) return;

    setWidth(node.getBoundingClientRect().width);

    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return width;
}
