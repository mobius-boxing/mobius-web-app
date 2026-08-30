import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { CompanyProvider } from '../contexts/CompanyContext';
import { AuthUser } from '../types';
import { createMockAuthUser } from './api.mock';

/**
 * Renders a company-scoped page inside the REAL CompanyProvider.
 *
 * Every list page calls `useEffectiveCompany()`, which reads both the auth
 * context and the company context. Rendering such a page with a bare
 * `render()` throws `useCompany must be used within a CompanyProvider`, which
 * is how 13 page suites ended up asserting nothing at all.
 *
 * The company side is deliberately NOT mocked: tenant scoping is where this
 * project's recurring bugs live (L-009), so the real provider computes
 * `effectiveCompanyId` from the real rules (superAdmin ⇒ selected company,
 * everyone else ⇒ undefined, because the backend reads the JWT).
 *
 * Auth is the one piece that has to be substituted: the real `AuthProvider`
 * can only produce a user by calling `authApi.getCurrentUser()`, and page
 * suites mock `services/api` down to the one API they exercise. So a suite
 * opts in with a single line:
 *
 *   jest.mock('../../contexts/AuthContext', () =>
 *     require('../../test-utils/renderWithProviders').authContextMock()
 *   );
 *
 * `CompanyProvider` reads the user through that same module, so the mock
 * drives the real provider. Pass `user` to `renderWithProviders` to override
 * the default (an `admin` of company-uuid-1); a `superAdmin` makes the
 * provider fetch and select a company for real, which needs
 * `companiesApi.getCompanies` in the suite's `services/api` mock.
 */

export const defaultTestUser: AuthUser = createMockAuthUser();

let currentUser: AuthUser | null = defaultTestUser;

/** Drop-in replacement module for `contexts/AuthContext` (see usage above). */
export function authContextMock() {
  return {
    __esModule: true,
    useAuth: () => ({
      user: currentUser,
      isAuthenticated: !!currentUser,
      isLoading: false,
      login: async () => {},
      logout: async () => {},
      updateUser: () => {},
    }),
    AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  };
}

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Authenticated user seen by `useAuth()`; `null` renders as logged out. */
  user?: AuthUser | null;
}

export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {}
) {
  const { user = defaultTestUser, ...renderOptions } = options;
  currentUser = user;

  return render(ui, {
    wrapper: ({ children }: { children?: ReactNode }) => (
      <CompanyProvider>{children}</CompanyProvider>
    ),
    ...renderOptions,
  });
}

export default renderWithProviders;
