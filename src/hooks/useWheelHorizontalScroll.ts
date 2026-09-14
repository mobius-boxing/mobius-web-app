import { useCallback } from 'react';

const LINE_HEIGHT_PX = 16;

/**
 * Returns a callback ref. While the pointer is over the element and its content
 * overflows sideways, a vertical mouse wheel scrolls it horizontally instead of
 * scrolling the page. At the left/right edge the wheel is released so the page
 * scrolls again — otherwise a fully scrolled table would swallow the wheel.
 *
 * Input that already carries a horizontal intent is left to the browser:
 * Shift+wheel, trackpad swipes with a sideways component, and ctrl+wheel
 * (pinch zoom).
 *
 * A callback ref with a cleanup return (React 19), not state: storing the node
 * in state costs a re-render every time the scroller mounts, and pages whose
 * effects depend on per-render identities then loop between loading and loaded.
 */
export function useWheelHorizontalScroll<T extends HTMLElement>(): (node: T | null) => void | (() => void) {
  return useCallback((node: T | null) => {
    if (!node) return;

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.shiftKey || event.deltaX !== 0 || event.deltaY === 0) return;

      const max = node.scrollWidth - node.clientWidth;
      if (max <= 0) return;

      const delta =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? event.deltaY * LINE_HEIGHT_PX
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? event.deltaY * node.clientWidth
            : event.deltaY;

      const atStart = node.scrollLeft <= 0;
      // Sub-pixel scroll positions on scaled displays never quite reach `max`.
      const atEnd = node.scrollLeft >= max - 1;
      if ((delta < 0 && atStart) || (delta > 0 && atEnd)) return;

      event.preventDefault();
      node.scrollLeft = Math.max(0, Math.min(max, node.scrollLeft + delta));
    };

    // React's onWheel listener is passive, so it could not stop the page from
    // scrolling; a native non-passive listener can.
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, []);
}
