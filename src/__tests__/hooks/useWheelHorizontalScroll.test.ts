import { renderHook } from '@testing-library/react';
import { useWheelHorizontalScroll } from '../../hooks/useWheelHorizontalScroll';

const scroller = ({ scrollWidth = 2000, clientWidth = 800, scrollLeft = 0 } = {}) => {
  const el = document.createElement('div');
  Object.defineProperty(el, 'scrollWidth', { configurable: true, value: scrollWidth });
  Object.defineProperty(el, 'clientWidth', { configurable: true, value: clientWidth });
  el.scrollLeft = scrollLeft;
  document.body.appendChild(el);
  return el;
};

/** Attaches the hook's callback ref to `el`; returns the ref's cleanup. */
const attach = (el: HTMLElement) => {
  const { result } = renderHook(() => useWheelHorizontalScroll<HTMLElement>());
  return result.current(el) as () => void;
};

const wheel = (el: HTMLElement, init: WheelEventInit) => {
  const event = new WheelEvent('wheel', { cancelable: true, bubbles: true, ...init });
  el.dispatchEvent(event);
  return event;
};

describe('useWheelHorizontalScroll', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('turns a vertical wheel into horizontal scroll and keeps the page still', () => {
    const el = scroller();
    attach(el);
    const event = wheel(el, { deltaY: 120 });
    expect(event.defaultPrevented).toBe(true);
    expect(el.scrollLeft).toBe(120);
    wheel(el, { deltaY: -50 });
    expect(el.scrollLeft).toBe(70);
  });

  it('releases the wheel at the edges so the page scrolls again', () => {
    const atStart = scroller({ scrollLeft: 0 });
    attach(atStart);
    expect(wheel(atStart, { deltaY: -100 }).defaultPrevented).toBe(false);

    const atEnd = scroller({ scrollLeft: 1200 });
    attach(atEnd);
    expect(wheel(atEnd, { deltaY: 100 }).defaultPrevented).toBe(false);
    expect(wheel(atEnd, { deltaY: -100 }).defaultPrevented).toBe(true);
  });

  it('clamps at the far edge instead of overshooting', () => {
    const el = scroller({ scrollLeft: 1150 });
    attach(el);
    wheel(el, { deltaY: 400 });
    expect(el.scrollLeft).toBe(1200);
  });

  it('does nothing when the content does not overflow', () => {
    const el = scroller({ scrollWidth: 800, clientWidth: 800 });
    attach(el);
    expect(wheel(el, { deltaY: 100 }).defaultPrevented).toBe(false);
    expect(el.scrollLeft).toBe(0);
  });

  it.each([
    ['shift+wheel', { deltaY: 100, shiftKey: true }],
    ['a trackpad swipe with a sideways component', { deltaY: 100, deltaX: 20 }],
    ['ctrl+wheel (pinch zoom)', { deltaY: 100, ctrlKey: true }],
    ['a purely horizontal wheel', { deltaY: 0, deltaX: 60 }],
  ])('leaves %s to the browser', (_label, init) => {
    const el = scroller();
    attach(el);
    expect(wheel(el, init).defaultPrevented).toBe(false);
    expect(el.scrollLeft).toBe(0);
  });

  it('scales line-based wheel deltas (Firefox mouse wheels)', () => {
    const el = scroller();
    attach(el);
    wheel(el, { deltaY: 3, deltaMode: WheelEvent.DOM_DELTA_LINE });
    expect(el.scrollLeft).toBe(48);
  });

  it('removes its listener when the ref is detached', () => {
    const el = scroller();
    const cleanup = attach(el);
    cleanup();
    expect(wheel(el, { deltaY: 100 }).defaultPrevented).toBe(false);
  });

  it('returns the same callback ref across renders', () => {
    const { result, rerender } = renderHook(() => useWheelHorizontalScroll<HTMLElement>());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
