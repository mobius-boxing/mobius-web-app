/**
 * Login Page Unit Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// react-router-dom is mocked below
import Login from '../../pages/Login';

// Mock dependencies
const mockLogin = jest.fn();
const mockNavigate = jest.fn();
let mockLocationState: any = null;

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    pathname: '/login',
    search: '',
    hash: '',
    state: mockLocationState,
    key: 'default',
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
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
      };
      return translations[key] || key;
    },
  }),
}));

describe('Login Page', () => {
  const renderLogin = () => {
    return render(<Login />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
    mockLocationState = null;
  });

  describe('Rendering', () => {
    it('should render login form', () => {
      renderLogin();

      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
      expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    });

    it('should render email input', () => {
      renderLogin();

      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    });

    it('should render password input', () => {
      renderLogin();

      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    });

    it('should render sign in button', () => {
      renderLogin();

      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    });

    it('should render forgot password link', () => {
      renderLogin();

      expect(screen.getByText('Forgot password?')).toBeInTheDocument();
    });

    it('should render contact admin text', () => {
      renderLogin();

      expect(screen.getByText('Contact your administrator')).toBeInTheDocument();
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility when clicking eye icon', async () => {
      renderLogin();

      const passwordInput = screen.getByPlaceholderText('Enter your password');
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Find and click the toggle button (the eye icon button)
      const toggleButtons = screen.getAllByRole('button');
      const toggleButton = toggleButtons.find(
        btn => !btn.textContent?.includes('Sign In') && btn.type === 'button'
      );

      if (toggleButton) {
        fireEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'text');

        fireEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'password');
      }
    });
  });

  describe('Form Validation', () => {
    it('should show email required error when submitting empty email', async () => {
      renderLogin();

      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
    });

    it('should show password required error when submitting empty password', async () => {
      renderLogin();

      const emailInput = screen.getByPlaceholderText('Enter your email');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
    });

    it('should show invalid email error for invalid email format', async () => {
      renderLogin();

      const emailInput = screen.getByPlaceholderText('Enter your email');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      const passwordInput = screen.getByPlaceholderText('Enter your password');
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call login with credentials on valid submission', async () => {
      mockLogin.mockResolvedValue(undefined);

      renderLogin();

      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('should navigate to dashboard on successful login', async () => {
      mockLogin.mockResolvedValue(undefined);

      renderLogin();

      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      });
    });

    it('should show error message on login failure', async () => {
      const error = {
        response: {
          data: {
            message: 'Invalid credentials',
          },
        },
      };
      mockLogin.mockRejectedValue(error);

      renderLogin();

      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });

    it('should show default error message when no message in response', async () => {
      mockLogin.mockRejectedValue(new Error('Network error'));

      renderLogin();

      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Login failed. Please check your credentials.')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should disable submit button while loading', async () => {
      // Create a login that never resolves to keep loading state
      mockLogin.mockImplementation(() => new Promise(() => {}));

      renderLogin();

      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to forgot password page when clicking forgot password', async () => {
      renderLogin();

      const forgotPasswordButton = screen.getByText('Forgot password?');
      fireEvent.click(forgotPasswordButton);

      expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
    });
  });

  describe('Return URL', () => {
    it('should navigate to return URL after login', async () => {
      mockLogin.mockResolvedValue(undefined);
      mockLocationState = { from: { pathname: '/users' } };

      renderLogin();

      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/users', { replace: true });
      });
    });
  });

  describe('Development Mode', () => {
    it('should show dev credentials in development mode', () => {
      process.env.NODE_ENV = 'development';

      renderLogin();

      expect(screen.getByText('Development Credentials')).toBeInTheDocument();
      expect(screen.getByText(/superadmin@mobius.local/i)).toBeInTheDocument();
    });

    it('should not show dev credentials in production mode', () => {
      process.env.NODE_ENV = 'production';

      renderLogin();

      expect(screen.queryByText('Development Credentials')).not.toBeInTheDocument();
    });
  });
});
