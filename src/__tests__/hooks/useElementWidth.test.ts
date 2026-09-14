import React from 'react';
import { act, render } from '@testing-library/react';
import { useElementWidth } from '../../hooks/useElementWidth';

function Probe({ onWidth }: { onWidth: (width: number | null) => void }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const width = useElementWidth(ref);
  onWidth(width);
  return React.createElement('div', { ref });
}

describe('useElementWidth', () => {
  const originalResizeObserver = (global as any).ResizeObserver;

  afterEach(() => {
    (global as any).ResizeObserver = originalResizeObserver;
    jest.restoreAllMocks();
  });

  it('returns null when ResizeObserver is unavailable, as in jsdom (U-5)', () => {
    delete (global as any).ResizeObserver;
    const widths: (number | null)[] = [];
    render(React.createElement(Probe, { onWidth: (w) => widths.push(w) }));
    expect(widths[widths.length - 1]).toBeNull();
  });

  it('measures immediately via getBoundingClientRect, then tracks the ResizeObserver', () => {
    let observerCallback: ((entries: Array<{ contentRect: { width: number } }>) => void) | null = null;
    class FakeResizeObserver {
      observe() {}
      disconnect() {}
      unobserve() {}
      constructor(callback: any) {
        observerCallback = callback;
      }
    }
    (global as any).ResizeObserver = FakeResizeObserver;
    jest.spyOn(HTMLDivElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 390 } as DOMRect);

    const widths: (number | null)[] = [];
    render(React.createElement(Probe, { onWidth: (w) => widths.push(w) }));
    expect(widths[widths.length - 1]).toBe(390);

    act(() => {
      observerCallback?.([{ contentRect: { width: 900 } }]);
    });
    expect(widths[widths.length - 1]).toBe(900);
  });

  it('disconnects the observer on unmount', () => {
    const disconnect = jest.fn();
    class FakeResizeObserver {
      observe() {}
      disconnect = disconnect;
      unobserve() {}
    }
    (global as any).ResizeObserver = FakeResizeObserver;
    jest.spyOn(HTMLDivElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 500 } as DOMRect);

    const { unmount } = render(React.createElement(Probe, { onWidth: () => {} }));
    unmount();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
