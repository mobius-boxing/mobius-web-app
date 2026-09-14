import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import Layout from '../../../components/layout/Layout';
import { LG_UP } from '../../../hooks/useMediaQuery';

const mockUser = {
  id: 'user-1',
  uuid: 'user-uuid-1',
  email: 'jane@example.com',
  firstName: 'Jane',
  lastName: 'Doe',
  role: 'admin' as const,
  companyId: 'company-1',
  companyName: 'Acme',
  isActive: true,
  emailVerified: true,
};

// The manual react-router-dom mock's `useLocation` is a bare `jest.fn()`,
// which CRA's `resetMocks: true` strips back to `undefined` between tests —
// pin it to a static location the way ProtectedRoute.test.tsx does.
jest.mock('react-router-dom', () => {
  const actualMock = jest.requireActual('../../../__mocks__/react-router-dom');
  return {
    ...actualMock,
    useLocation: () => ({ pathname: '/', search: '', hash: '', state: null, key: 'default' }),
  };
});

jest.mock('../../../contexts/AuthContext', () => ({
  __esModule: true,
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
    updateUser: jest.fn(),
  }),
  useAuthUser: () => mockUser,
}));

// Real i18n resolution against the actual en locale, mirroring the pattern
// used by page-level suites (see Dashboard.test.tsx) — needed here because
// the test plan asserts on real aria-labels and the "page / total" copy.
jest.mock('react-i18next', () => {
  const en = jest.requireActual('../../../i18n/locales/en/common.json');
  const lookup = (key: string) =>
    key.split('.').reduce<any>((acc, k) => (acc == null ? acc : acc[k]), en);
  return {
    useTranslation: () => ({
      t: (key: string, opts?: any) => {
        const value = lookup(key);
        if (typeof value !== 'string') return opts?.defaultValue ?? key;
        return value.replace(/\{\{(\w+)\}\}/g, (_m: string, name: string) =>
          opts && opts[name] != null ? String(opts[name]) : ''
        );
      },
      i18n: { language: 'en', changeLanguage: jest.fn() },
    }),
  };
});

/**
 * Minimal matchMedia stand-in: `matches` answers only LG_UP (the shell's one
 * query); flipping it via `setLgUp` notifies listeners the way a real resize
 * across the breakpoint would, so `Layout`'s own `useMediaQuery` re-renders.
 */
function installMatchMedia(initialLgUp: boolean) {
  let lgUp = initialLgUp;
  const listeners = new Set<(e: MediaQueryListEvent) => void>();

  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    get matches() {
      return query === LG_UP ? lgUp : false;
    },
    media: query,
    addEventListener: (_: string, cb: any) => listeners.add(cb),
    removeEventListener: (_: string, cb: any) => listeners.delete(cb),
    dispatchEvent: jest.fn(),
  }));

  return {
    setLgUp(next: boolean) {
      lgUp = next;
      listeners.forEach((cb) => cb({ matches: next } as MediaQueryListEvent));
    },
  };
}

const renderLayout = () =>
  render(
    <Layout>
      <div>Page content</div>
    </Layout>
  );

describe('Layout', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    window.localStorage.clear();
    document.body.style.overflow = '';
  });

  describe('>= lg', () => {
    beforeEach(() => installMatchMedia(true));

    it('renders the rail Sidebar and no hamburger/TopBar', () => {
      renderLayout();
      expect(screen.queryByLabelText('Open menu')).not.toBeInTheDocument();
      expect(screen.getByText('Mobius')).toBeInTheDocument();
      expect(screen.getByText('Sales Orders')).toBeInTheDocument();
    });
  });

  describe('< lg', () => {
    it('renders a TopBar with a hamburger button', () => {
      installMatchMedia(false);
      renderLayout();
      expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
    });

    it('opens the drawer on hamburger click and closes it on overlay click', () => {
      installMatchMedia(false);
      renderLayout();

      fireEvent.click(screen.getByLabelText('Open menu'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('drawer-overlay'));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes the drawer on Escape', () => {
      installMatchMedia(false);
      renderLayout();

      fireEvent.click(screen.getByLabelText('Open menu'));
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes the drawer via its own close button', () => {
      installMatchMedia(false);
      renderLayout();

      fireEvent.click(screen.getByLabelText('Open menu'));
      fireEvent.click(screen.getByLabelText('Close menu'));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes the drawer when a nav link is clicked (onNavigate)', () => {
      installMatchMedia(false);
      renderLayout();

      fireEvent.click(screen.getByLabelText('Open menu'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Sales Orders'));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes the drawer when the viewport becomes >= lg', () => {
      const matchMedia = installMatchMedia(false);
      renderLayout();

      fireEvent.click(screen.getByLabelText('Open menu'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      act(() => matchMedia.setLgUp(true));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('locks body scroll while the drawer is open and restores it on close', () => {
      installMatchMedia(false);
      renderLayout();

      fireEvent.click(screen.getByLabelText('Open menu'));
      expect(document.body.style.overflow).toBe('hidden');

      fireEvent.click(screen.getByLabelText('Close menu'));
      expect(document.body.style.overflow).toBe('unset');
    });

    it('never writes sidebar_collapsed when opening or closing the drawer', () => {
      installMatchMedia(false);
      renderLayout();

      fireEvent.click(screen.getByLabelText('Open menu'));
      fireEvent.click(screen.getByLabelText('Close menu'));

      expect(window.localStorage.getItem('sidebar_collapsed')).toBeNull();
    });

    it('moves focus to the close button on open and back to the hamburger on close', () => {
      installMatchMedia(false);
      renderLayout();

      const hamburger = screen.getByLabelText('Open menu');
      fireEvent.click(hamburger);
      expect(screen.getByLabelText('Close menu')).toHaveFocus();

      fireEvent.click(screen.getByLabelText('Close menu'));
      expect(hamburger).toHaveFocus();
    });

    it('also returns focus to the hamburger when closed via overlay, Escape or navigation', () => {
      installMatchMedia(false);
      renderLayout();
      const hamburger = screen.getByLabelText('Open menu');

      fireEvent.click(hamburger);
      fireEvent.click(screen.getByTestId('drawer-overlay'));
      expect(hamburger).toHaveFocus();

      fireEvent.click(hamburger);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(hamburger).toHaveFocus();

      fireEvent.click(hamburger);
      fireEvent.click(screen.getByText('Sales Orders'));
      expect(hamburger).toHaveFocus();
    });

    it('toggles overflow-hidden on <main> while the drawer is open', () => {
      installMatchMedia(false);
      const { container } = renderLayout();
      const main = container.querySelector('main') as HTMLElement;
      expect(main.className).not.toContain('overflow-hidden');
      expect(main.className).toContain('overflow-y-auto');

      fireEvent.click(screen.getByLabelText('Open menu'));
      expect(main.className).toContain('overflow-hidden');
      expect(main.className).not.toContain('overflow-y-auto');

      fireEvent.click(screen.getByLabelText('Close menu'));
      expect(main.className).not.toContain('overflow-hidden');
      expect(main.className).toContain('overflow-y-auto');
    });
  });
});
