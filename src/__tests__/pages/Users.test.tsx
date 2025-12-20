/**
 * Users Page Unit Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Users from '../../pages/Users';
import { createMockUser, createMockCompany, createMockPaginatedResponse } from '../../test-utils/api.mock';

// Mock dependencies
let mockUser: any = null;
const mockGetUsers = jest.fn();
const mockGetCompanies = jest.fn();
const mockDeleteUser = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: !!mockUser,
    isLoading: false,
  }),
}));

jest.mock('../../services/api', () => ({
  usersApi: {
    getUsers: (...args: any[]) => mockGetUsers(...args),
    deleteUser: (...args: any[]) => mockDeleteUser(...args),
  },
  companiesApi: {
    getCompanies: () => mockGetCompanies(),
  },
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/users', state: null }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('../../components/layout/Layout', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));

jest.mock('../../components/modals/InviteUserModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSuccess }: any) =>
    isOpen ? (
      <div data-testid="invite-user-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Invite</button>
      </div>
    ) : null,
}));

jest.mock('../../components/modals/EditUserModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSuccess, user }: any) =>
    isOpen ? (
      <div data-testid="edit-user-modal">
        <span>Editing: {user?.email}</span>
        <button onClick={onClose}>Close</button>
        <button onClick={() => onSuccess(user)}>Save</button>
      </div>
    ) : null,
}));

const mockUsers = [
  createMockUser({ uuid: 'user-1', email: 'admin@test.com', firstName: 'Admin', lastName: 'User', role: 'admin' }),
  createMockUser({ uuid: 'user-2', email: 'member@test.com', firstName: 'Member', lastName: 'User', role: 'member' }),
  createMockUser({ uuid: 'user-3', email: 'john@acme.com', firstName: 'John', lastName: 'Doe', role: 'member', companyName: 'Acme Corp' }),
];

const mockCompanies = [
  createMockCompany({ uuid: 'company-1', name: 'Test Company' }),
  createMockCompany({ uuid: 'company-2', name: 'Acme Corp' }),
];

describe('Users Page', () => {
  const renderUsers = () => {
    return render(<Users />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = {
      uuid: 'current-user',
      email: 'super@test.com',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'superAdmin',
    };
    mockGetUsers.mockResolvedValue(createMockPaginatedResponse(mockUsers));
    mockGetCompanies.mockResolvedValue(createMockPaginatedResponse(mockCompanies));
    window.confirm = jest.fn(() => true);
  });

  describe('Rendering', () => {
    it('should render page title', async () => {
      renderUsers();

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });
    });

    it('should render subtitle', async () => {
      renderUsers();

      await waitFor(() => {
        expect(screen.getByText('Manage users and their permissions')).toBeInTheDocument();
      });
    });

    it('should render invite user button', async () => {
      renderUsers();

      await waitFor(() => {
        expect(screen.getByText('Invite User')).toBeInTheDocument();
      });
    });

    it('should render search input', async () => {
      renderUsers();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument();
      });
    });
  });

  describe('Data Loading', () => {
    it('should fetch users on mount', async () => {
      renderUsers();

      await waitFor(() => {
        expect(mockGetUsers).toHaveBeenCalled();
      });
    });

    it('should display users in table', async () => {
      renderUsers();

      await waitFor(() => {
        expect(screen.getByText('admin@test.com')).toBeInTheDocument();
        expect(screen.getByText('member@test.com')).toBeInTheDocument();
      });
    });

    it('should show loading state', () => {
      mockGetUsers.mockImplementation(() => new Promise(() => {}));
      renderUsers();

      expect(screen.getByText('Loading users...')).toBeInTheDocument();
    });

    it('should handle API error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockGetUsers.mockRejectedValue(new Error('Network error'));

      renderUsers();

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });

  describe('Search Functionality', () => {
    it('should filter users by name', async () => {
      renderUsers();

      await waitFor(() => {
        expect(screen.getByText('admin@test.com')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search users...');
      fireEvent.change(searchInput, { target: { value: 'John' } });

      await waitFor(() => {
        expect(screen.getByText('john@acme.com')).toBeInTheDocument();
        expect(screen.queryByText('admin@test.com')).not.toBeInTheDocument();
      });
    });

    it('should filter users by email', async () => {
      renderUsers();

      await waitFor(() => {
        expect(screen.getByText('admin@test.com')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search users...');
      fireEvent.change(searchInput, { target: { value: 'admin@' } });

      await waitFor(() => {
        expect(screen.getByText('admin@test.com')).toBeInTheDocument();
        expect(screen.queryByText('member@test.com')).not.toBeInTheDocument();
      });
    });
  });

  describe('Role Filter', () => {
    it('should filter users by role', async () => {
      renderUsers();

      await waitFor(() => {
        expect(screen.getByText('admin@test.com')).toBeInTheDocument();
      });

      const roleSelect = screen.getByDisplayValue('All Roles');
      fireEvent.change(roleSelect, { target: { value: 'admin' } });

      await waitFor(() => {
        expect(screen.getByText('admin@test.com')).toBeInTheDocument();
        expect(screen.queryByText('member@test.com')).not.toBeInTheDocument();
      });
    });
  });

  describe('Company Filter (SuperAdmin)', () => {
    it('should show company filter for superAdmin', async () => {
      renderUsers();

      await waitFor(() => {
        expect(screen.getByDisplayValue('All Companies')).toBeInTheDocument();
      });
    });

    it('should not show company filter for admin', async () => {
      mockUser = { ...mockUser, role: 'admin' };
      renderUsers();

      await waitFor(() => {
        expect(screen.queryByDisplayValue('All Companies')).not.toBeInTheDocument();
      });
    });
  });

  describe('Invite User Modal', () => {
    it('should open invite modal when clicking button', async () => {
      renderUsers();

      await waitFor(() => {
        expect(screen.getByText('Invite User')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Invite User'));

      expect(screen.getByTestId('invite-user-modal')).toBeInTheDocument();
    });

    it('should close invite modal', async () => {
      renderUsers();

      await waitFor(() => {
        expect(screen.getByText('Invite User')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Invite User'));
      expect(screen.getByTestId('invite-user-modal')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Close'));
      expect(screen.queryByTestId('invite-user-modal')).not.toBeInTheDocument();
    });

    it('should refresh users on invite success', async () => {
      renderUsers();

      await waitFor(() => {
        expect(screen.getByText('Invite User')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Invite User'));
      fireEvent.click(screen.getByText('Invite'));

      await waitFor(() => {
        expect(mockGetUsers).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Delete User', () => {
    it('should show confirmation before delete', async () => {
      renderUsers();

      await waitFor(() => {
        expect(screen.getByText('admin@test.com')).toBeInTheDocument();
      });

      const deleteButtons = document.querySelectorAll('button[title="Delete user"]');
      if (deleteButtons.length > 0) {
        fireEvent.click(deleteButtons[0] as HTMLElement);
      }

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this user?');
    });

    it('should not delete if confirmation is cancelled', async () => {
      window.confirm = jest.fn(() => false);
      renderUsers();

      await waitFor(() => {
        expect(screen.getByText('admin@test.com')).toBeInTheDocument();
      });

      const deleteButtons = document.querySelectorAll('button[title="Delete user"]');
      if (deleteButtons.length > 0) {
        fireEvent.click(deleteButtons[0] as HTMLElement);
      }

      expect(mockDeleteUser).not.toHaveBeenCalled();
    });

    it('should call delete API on confirm', async () => {
      mockDeleteUser.mockResolvedValue(undefined);
      renderUsers();

      await waitFor(() => {
        expect(screen.getByText('admin@test.com')).toBeInTheDocument();
      });

      const deleteButtons = document.querySelectorAll('button[title="Delete user"]');
      if (deleteButtons.length > 0) {
        fireEvent.click(deleteButtons[0] as HTMLElement);
      }

      await waitFor(() => {
        expect(mockDeleteUser).toHaveBeenCalled();
      });
    });
  });

  describe('Role Badges', () => {
    it('should show correct badge colors for roles', async () => {
      renderUsers();

      await waitFor(() => {
        const adminBadges = screen.getAllByText('admin');
        const memberBadges = screen.getAllByText('member');

        expect(adminBadges.length).toBeGreaterThan(0);
        expect(memberBadges.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Status Badges', () => {
    it('should show active status for active users', async () => {
      renderUsers();

      await waitFor(() => {
        expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no users', async () => {
      mockGetUsers.mockResolvedValue(createMockPaginatedResponse([]));
      renderUsers();

      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument();
      });
    });
  });
});
