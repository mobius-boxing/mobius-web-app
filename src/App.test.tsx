/**
 * App Component Test
 * Tests that the App renders without crashing
 */

import React from 'react';
import { render } from '@testing-library/react';

// Mock all dependencies that App uses
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Routes: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Route: ({ element }: { element: React.ReactNode }) => <>{element}</>,
  Navigate: () => null,
  useNavigate: () => jest.fn(),
  useLocation: () => ({
    pathname: '/',
    search: '',
    hash: '',
    state: null,
    key: 'default',
  }),
  useParams: () => ({}),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
}));

jest.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: jest.fn(),
    },
  }),
  I18nextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  initReactI18next: { type: '3rdParty', init: jest.fn() },
}));

// Mock i18n config to prevent initialization
jest.mock('./i18n/config', () => ({}));

// Mock all page components to avoid their dependencies
jest.mock('./pages/Login', () => () => <div data-testid="login-page">Login</div>);
jest.mock('./pages/Dashboard', () => () => <div data-testid="dashboard-page">Dashboard</div>);
jest.mock('./pages/Companies', () => () => <div data-testid="companies-page">Companies</div>);
jest.mock('./pages/Users', () => () => <div data-testid="users-page">Users</div>);
jest.mock('./pages/ResetPassword', () => () => <div data-testid="reset-password-page">Reset Password</div>);
jest.mock('./pages/ForgotPassword', () => () => <div data-testid="forgot-password-page">Forgot Password</div>);
jest.mock('./pages/AcceptInvitation', () => () => <div data-testid="accept-invitation-page">Accept Invitation</div>);
jest.mock('./components/ProtectedRoute', () => ({ children }: { children: React.ReactNode }) => <>{children}</>);

// Import App after mocks are set up
import App from './App';

describe('App', () => {
  it('should render without crashing', () => {
    expect(() => render(<App />)).not.toThrow();
  });
});
