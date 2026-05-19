import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const testI18n = i18n.createInstance();
testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  resources: {
    en: {
      translation: {
        'login.title': 'Sign In',
        'login.subtitle': 'Sign in to your account',
        'login.emailLabel': 'Email',
        'login.emailPlaceholder': 'Enter your email',
        'login.passwordLabel': 'Password',
        'login.passwordPlaceholder': 'Enter your password',
        'login.signInButton': 'Sign In',
        'login.forgotPassword': 'Forgot password?',
        'login.needAccount': 'Need an account?',
        'login.contactAdmin': 'Contact your administrator',
        'login.loginFailed': 'Login failed. Please check your credentials.',
        'login.validation.emailRequired': 'Email is required',
        'login.validation.emailInvalid': 'Invalid email address',
        'login.validation.passwordRequired': 'Password is required',
        'login.devCredentials': 'Development Credentials',
        'common.loading': 'Loading...',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.create': 'Create',
        'common.search': 'Search',
        'common.actions': 'Actions',
        'common.status': 'Status',
        'common.active': 'Active',
        'common.inactive': 'Inactive',
        'common.yes': 'Yes',
        'common.no': 'No',
        'nav.dashboard': 'Dashboard',
        'nav.companies': 'Companies',
        'nav.users': 'Users',
        'nav.logout': 'Logout',
        'dashboard.title': 'Dashboard',
        'dashboard.welcome': 'Welcome',
        'companies.title': 'Companies',
        'companies.create': 'Create Company',
        'companies.name': 'Name',
        'companies.description': 'Description',
        'companies.status': 'Status',
        'users.title': 'Users',
        'users.invite': 'Invite User',
        'users.email': 'Email',
        'users.name': 'Name',
        'users.role': 'Role',
        'forgotPassword.title': 'Forgot Password',
        'forgotPassword.subtitle': 'Enter your email to reset your password',
        'forgotPassword.emailLabel': 'Email',
        'forgotPassword.sendButton': 'Send Reset Link',
        'forgotPassword.backToLogin': 'Back to Login',
        'forgotPassword.success': 'Password reset email sent',
        'resetPassword.title': 'Reset Password',
        'resetPassword.newPasswordLabel': 'New Password',
        'resetPassword.confirmPasswordLabel': 'Confirm Password',
        'resetPassword.submitButton': 'Reset Password',
        'acceptInvitation.title': 'Accept Invitation',
        'acceptInvitation.firstName': 'First Name',
        'acceptInvitation.lastName': 'Last Name',
        'acceptInvitation.password': 'Password',
        'acceptInvitation.confirmPassword': 'Confirm Password',
        'acceptInvitation.submitButton': 'Create Account',
      },
    },
  },
  interpolation: {
    escapeValue: false,
  },
});

interface MockAuthContextValue {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: jest.Mock;
  logout: jest.Mock;
  updateUser: jest.Mock;
}

const AuthContext = React.createContext<MockAuthContextValue | undefined>(undefined);

export const mockUser = {
  id: 'user-1',
  uuid: 'user-uuid-1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'admin' as const,
  companyId: 'company-uuid-1',
  companyName: 'Test Company',
  isActive: true,
  emailVerified: true,
};

export const createMockAuthContext = (overrides: Partial<MockAuthContextValue> = {}): MockAuthContextValue => ({
  user: mockUser,
  isAuthenticated: true,
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
  updateUser: jest.fn(),
  ...overrides,
});

interface AllProvidersProps {
  children: ReactNode;
  authValue?: MockAuthContextValue;
  initialEntries?: string[];
}

const AllProviders: React.FC<AllProvidersProps> = ({
  children,
  authValue = createMockAuthContext(),
  initialEntries = ['/'],
}) => {
  return (
    <I18nextProvider i18n={testI18n}>
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </AuthContext.Provider>
    </I18nextProvider>
  );
};

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  authValue?: MockAuthContextValue;
  initialEntries?: string[];
}

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { authValue, initialEntries, ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders authValue={authValue} initialEntries={initialEntries}>
        {children}
      </AllProviders>
    ),
    ...renderOptions,
  });
};

const renderWithoutRouter = (
  ui: ReactElement,
  options: Omit<CustomRenderOptions, 'initialEntries'> = {}
) => {
  const { authValue, ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <I18nextProvider i18n={testI18n}>
        <AuthContext.Provider value={authValue || createMockAuthContext()}>
          {children}
        </AuthContext.Provider>
      </I18nextProvider>
    ),
    ...renderOptions,
  });
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export * from '@testing-library/react';
export { customRender as render, renderWithoutRouter, testI18n };

export { AuthContext };

export const waitForLoadingToFinish = async () => {
  await new Promise(resolve => setTimeout(resolve, 0));
};

export const fillInput = async (
  user: { clear: (element: HTMLElement) => Promise<void>; type: (element: HTMLElement, text: string) => Promise<void> },
  input: HTMLElement,
  value: string
) => {
  await user.clear(input);
  await user.type(input, value);
};

export const mockLocalStorage = () => {
  const store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    get store() {
      return { ...store };
    },
  };
};
