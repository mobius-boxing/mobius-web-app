import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import ProtectedRoute from '../../components/ProtectedRoute';

const mockUseAuth = jest.fn();
const mockHasPermission = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  useAuthUser: () => null,
  useAuth: () => mockUseAuth(),
}));

jest.mock('../../hooks/usePermissions', () => ({
  usePermissions: () => ({ has: mockHasPermission }),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  Navigate: ({ to, state }: { to: string; state?: unknown }) => {
    mockNavigate(to, state);
    return <div data-testid="navigate-to">{to}</div>;
  },
  useLocation: () => ({ pathname: '/protected' }),
}));

describe('ProtectedRoute', () => {
  const ProtectedContent = () => <div>Protected Content</div>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockHasPermission.mockReturnValue(false);
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Loading State', () => {
    it('should show loading spinner when isLoading is true', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        user: null,
      });

      render(
        <ProtectedRoute>
          <ProtectedContent />
        </ProtectedRoute>
      );

      const spinner = document.querySelector('.animate-pulse');
      expect(spinner).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Unauthenticated State', () => {
    it('should redirect to login when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });

      render(
        <ProtectedRoute>
          <ProtectedContent />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('navigate-to')).toHaveTextContent('/login');
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated State', () => {
    it('should render children when authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { role: 'member' },
      });

      render(
        <ProtectedRoute>
          <ProtectedContent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('Permission-Based Access', () => {
    it('should render children when user has the required permission', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { role: 'member' },
      });
      mockHasPermission.mockReturnValue(true);

      render(
        <ProtectedRoute requiredPermission="customers.edit">
          <ProtectedContent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should show access denied when user lacks the required permission', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { role: 'member' },
      });

      render(
        <ProtectedRoute requiredPermission="customers.edit">
          <ProtectedContent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText("You don't have permission to access this page.")).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('No Required Roles', () => {
    it('should allow any authenticated user when no roles required', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { role: 'member' },
      });

      render(
        <ProtectedRoute>
          <ProtectedContent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('Device Gate', () => {
    it('should redirect a device-blocked member to the waiting screen, carrying the original destination', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { role: 'member' },
        deviceBlocked: true,
      });

      render(
        <ProtectedRoute>
          <ProtectedContent />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('navigate-to')).toHaveTextContent('/device-pending');
      expect(mockNavigate).toHaveBeenCalledWith('/device-pending', { from: { pathname: '/protected' } });
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should gate on the device before the permission gate', () => {
      // "Your browser is not approved" is the accurate answer even on a page this
      // member could not see anyway — and the waiting screen is where they can act.
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { role: 'member' },
        deviceBlocked: true,
      });

      render(
        <ProtectedRoute requiredPermission="devices.approve">
          <ProtectedContent />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('navigate-to')).toHaveTextContent('/device-pending');
      expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
    });

    it('should never redirect an approved user with no device row', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { role: 'member' },
        device: null,
        deviceBlocked: false,
      });

      render(
        <ProtectedRoute>
          <ProtectedContent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(screen.queryByTestId('navigate-to')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should deny a permission-gated route without a user', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true, // Somehow authenticated but no user
        isLoading: false,
        user: null,
      });

      render(
        <ProtectedRoute requiredPermission="customers.edit">
          <ProtectedContent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('should show access denied when user has no permission', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { email: 'test@test.com', role: undefined },
      });

      render(
        <ProtectedRoute requiredPermission="customers.edit">
          <ProtectedContent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('should render children when authenticated with no required roles and null user', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: null,
      });

      render(
        <ProtectedRoute>
          <ProtectedContent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });
});
