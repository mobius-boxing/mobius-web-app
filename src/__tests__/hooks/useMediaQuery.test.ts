import { renderHook, act } from '@testing-library/react';
import { useMediaQuery, MD_UP, LG_UP } from '../../hooks/useMediaQuery';

type Listener = (event: MediaQueryListEvent) => void;

function installMatchMedia(matches: boolean) {
  const listeners = new Set<Listener>();
  const mql = {
    matches,
    media: '',
    addEventListener: jest.fn((_: string, cb: Listener) => listeners.add(cb)),
    removeEventListener: jest.fn((_: string, cb: Listener) => listeners.delete(cb)),
    dispatchEvent: jest.fn(),
  };
  window.matchMedia = jest.fn().mockReturnValue(mql);
  return {
    mql,
    fire(next: boolean) {
      mql.matches = next;
      listeners.forEach((cb) => cb({ matches: next } as MediaQueryListEvent));
    },
  };
}

describe('useMediaQuery', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('returns true when window.matchMedia is unavailable (jsdom default)', () => {
    // @ts-expect-error simulating an environment without matchMedia
    delete window.matchMedia;
    const { result } = renderHook(() => useMediaQuery(LG_UP));
    expect(result.current).toBe(true);
  });

  it('reflects the initial match state from matchMedia', () => {
    installMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery(MD_UP));
    expect(result.current).toBe(false);
  });

  it('updates when the media query change event fires', () => {
    const { fire } = installMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery(LG_UP));
    expect(result.current).toBe(false);

    act(() => fire(true));
    expect(result.current).toBe(true);
  });

  it('queries with the exact string passed in', () => {
    installMatchMedia(true);
    renderHook(() => useMediaQuery(MD_UP));
    expect(window.matchMedia).toHaveBeenCalledWith(MD_UP);
  });
});
