import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../../pages/Dashboard';

let mockUser: any = null;
const mockGetUserStats = jest.fn();
const mockGetCompanyStats = jest.fn();
const mockGetInvitationStats = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: !!mockUser,
    isLoading: false,
  }),
}));

jest.mock('../../services/api', () => ({
  usersApi: {
    getUserStats: (...args: any[]) => mockGetUserStats(...args),
  },
  companiesApi: {
    getCompanyStats: () => mockGetCompanyStats(),
  },
  invitationsApi: {
    getInvitationStats: (...args: any[]) => mockGetInvitationStats(...args),
  },
}));

jest.mock('react-i18next', () => {
  const en = jest.requireActual('../../i18n/locales/en/common.json');
  const lookup = (key: string) =>
    key
      .replace(/^common:/, '')
      .split('.')
      .reduce<any>((acc, k) => (acc == null ? acc : acc[k]), en);
  return {
    useTranslation: () => ({
      t: (key: string, opts?: any) => {
        const value = lookup(key);
        if (typeof value !== 'string') return opts?.defaultValue ?? key;
        return value.replace(/\{\{(\w+)\}\}/g, (_m: string, name: string) =>
          opts && opts[name] != null ? String(opts[name]) : ''
        );
      },
    }),
  };
});

jest.mock('../../components/layout/Layout', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));

jest.mock('../../components/ui/Card', () => ({
  __esModule: true,
  default: ({ children, title, subtitle, className }: any) => (
    <div data-testid="card" className={className}>
      {title && <h3>{title}</h3>}
      {subtitle && <p>{subtitle}</p>}
      {children}
    </div>
  ),
}));

describe('Dashboard Page', () => {
  const mockUserStats = {
    totalUsers: 25,
    activeUsers: 20,
    usersByRole: [
      { role: 'admin', count: 5 },
      { role: 'member', count: 20 },
    ],
    recentInvitations: 3,
  };

  const mockCompanyStats = {
    totalCompanies: 10,
    activeCompanies: 8,
    companiesWithUsers: 9,
    averageUsersPerCompany: 2.5,
  };

  const mockInvitationStats = {
    totalInvitations: 50,
    pendingInvitations: 5,
    acceptedInvitations: 40,
    expiredInvitations: 5,
  };

  const renderDashboard = () => {
    return render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = null;
  });

  describe('Loading State', () => {
    it('should show loading skeleton when loading', () => {
      mockUser = { firstName: 'John', role: 'superAdmin' };
      mockGetUserStats.mockImplementation(() => new Promise(() => {}));
      mockGetCompanyStats.mockImplementation(() => new Promise(() => {}));
      mockGetInvitationStats.mockImplementation(() => new Promise(() => {}));

      renderDashboard();

      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('SuperAdmin Dashboard', () => {
    beforeEach(() => {
      mockUser = {
        uuid: 'user-uuid-1',
        email: 'super@example.com',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'superAdmin',
      };

      mockGetUserStats.mockResolvedValue(mockUserStats);
      mockGetCompanyStats.mockResolvedValue(mockCompanyStats);
      mockGetInvitationStats.mockResolvedValue(mockInvitationStats);
    });

    it('should display greeting with user name', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Super!/)).toBeInTheDocument();
      });
    });

    it('should show superAdmin dashboard content', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Welcome to your Super Admin dashboard/)).toBeInTheDocument();
      });
    });

    it('should fetch all stats for superAdmin', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(mockGetUserStats).toHaveBeenCalled();
        expect(mockGetCompanyStats).toHaveBeenCalled();
        expect(mockGetInvitationStats).toHaveBeenCalled();
      });
    });

    it('should display total companies', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getAllByText('Total Companies').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('10').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should display total users', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Total Users')).toBeInTheDocument();
        expect(screen.getByText('25')).toBeInTheDocument();
      });
    });

    it('should display platform invitations', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Platform Invitations')).toBeInTheDocument();
        expect(screen.getByText('50')).toBeInTheDocument();
      });
    });

    it('should display average users per company', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Avg Users/Company')).toBeInTheDocument();
        expect(screen.getByText('2.5')).toBeInTheDocument();
      });
    });

    it('should display users by role', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Platform Users by Role')).toBeInTheDocument();
        expect(screen.getByText('admin')).toBeInTheDocument();
        expect(screen.getByText('member')).toBeInTheDocument();
      });
    });
  });

  describe('Admin Dashboard', () => {
    beforeEach(() => {
      mockUser = {
        uuid: 'user-uuid-1',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        companyId: 'company-uuid-1',
        companyName: 'Test Company',
      };

      mockGetUserStats.mockResolvedValue(mockUserStats);
      mockGetInvitationStats.mockResolvedValue(mockInvitationStats);
    });

    it('should display company name in subtitle', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Test Company/)).toBeInTheDocument();
      });
    });

    it('should fetch company-specific stats', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(mockGetUserStats).toHaveBeenCalledWith('company-uuid-1');
        expect(mockGetInvitationStats).toHaveBeenCalledWith('company-uuid-1');
      });
    });

    it('should NOT fetch company stats for admin', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(mockGetCompanyStats).not.toHaveBeenCalled();
      });
    });

    it('should display admin dashboard content', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Welcome to your Admin dashboard/)).toBeInTheDocument();
      });
    });

    it('should display total users for company', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Total Users')).toBeInTheDocument();
      });
    });

    it('should display pending invitations', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Pending Invitations')).toBeInTheDocument();
      });
    });
  });

  describe('Member Dashboard', () => {
    beforeEach(() => {
      mockUser = {
        uuid: 'user-uuid-1',
        email: 'member@example.com',
        firstName: 'Member',
        lastName: 'User',
        role: 'member',
        companyId: 'company-uuid-1',
        companyName: 'Test Company',
      };
    });

    it('should display member welcome message', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Welcome to Mobius')).toBeInTheDocument();
      });
    });

    it('should display member account info', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Your Account')).toBeInTheDocument();
        expect(screen.getByText('member@example.com')).toBeInTheDocument();
      });
    });

    it('should NOT fetch stats for member', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(mockGetUserStats).not.toHaveBeenCalled();
        expect(mockGetCompanyStats).not.toHaveBeenCalled();
        expect(mockGetInvitationStats).not.toHaveBeenCalled();
      });
    });

    it('should show contact admin message', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Contact your administrator/)).toBeInTheDocument();
      });
    });
  });

  describe('Greeting Logic', () => {
    beforeEach(() => {
      mockUser = {
        firstName: 'Test',
        role: 'member',
        companyName: 'Test Co',
      };
    });

    it('should show greeting based on time of day', async () => {
      renderDashboard();

      await waitFor(() => {
        const greetingText = screen.getByText(/Test!/).textContent;
        expect(
          greetingText?.includes('Good morning') ||
          greetingText?.includes('Good afternoon') ||
          greetingText?.includes('Good evening')
        ).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockUser = { firstName: 'John', role: 'superAdmin' };
      mockGetUserStats.mockRejectedValue(new Error('API Error'));
      mockGetCompanyStats.mockRejectedValue(new Error('API Error'));
      mockGetInvitationStats.mockRejectedValue(new Error('API Error'));

      renderDashboard();

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });

  describe('StatCard Component', () => {
    beforeEach(() => {
      mockUser = {
        firstName: 'Super',
        role: 'superAdmin',
      };
      mockGetUserStats.mockResolvedValue(mockUserStats);
      mockGetCompanyStats.mockResolvedValue(mockCompanyStats);
      mockGetInvitationStats.mockResolvedValue(mockInvitationStats);
    });

    it('should display stat card with value and description', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('8 active')).toBeInTheDocument();
        expect(screen.getByText('20 active users')).toBeInTheDocument();
      });
    });

    it('should display platform average description', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Platform average')).toBeInTheDocument();
      });
    });
  });
});
