import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Companies from '../../pages/Companies';
import { createMockCompany, createMockPaginatedResponse } from '../../test-utils/api.mock';

const mockUser = {
  uuid: 'user-uuid-1',
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  role: 'superAdmin' as const,
};

const mockCompanies = [
  createMockCompany({ uuid: 'company-1', name: 'Company A', description: 'First business', isActive: true }),
  createMockCompany({ uuid: 'company-2', name: 'Company B', description: 'Second business', isActive: false }),
  createMockCompany({ uuid: 'company-3', name: 'Acme Corp', description: 'Different business', isActive: true }),
];

const mockGetCompanies = jest.fn();
const mockDeleteCompany = jest.fn();
const mockUpdateCompanyStatus = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
  }),
}));

jest.mock('../../services/api', () => ({
  companiesApi: {
    getCompanies: (...args: any[]) => mockGetCompanies(...args),
    deleteCompany: (...args: any[]) => mockDeleteCompany(...args),
    updateCompanyStatus: (...args: any[]) => mockUpdateCompanyStatus(...args),
  },
}));

/**
 * Resolve from the real locale file rather than a hand-maintained map. The map
 * this replaces had already drifted from the app: it lacked
 * `companies.actions.delete` entirely and carried an older, shorter
 * `deleteConfirm` string, so the tests were asserting copy that no longer
 * shipped. Same pattern as Users.test.tsx.
 */
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

jest.mock('../../components/modals/CreateCompanyModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSuccess }: any) =>
    isOpen ? (
      <div data-testid="create-company-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Create</button>
      </div>
    ) : null,
}));

jest.mock('../../components/modals/EditCompanyModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSuccess, company }: any) =>
    isOpen ? (
      <div data-testid="edit-company-modal">
        <span>Editing: {company?.name}</span>
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Save</button>
      </div>
    ) : null,
}));

jest.mock('../../components/layout/Layout', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));

describe('Companies Page', () => {
  const renderCompanies = () => {
    return render(
      <MemoryRouter>
        <Companies />
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCompanies.mockResolvedValue(createMockPaginatedResponse(mockCompanies));
    window.confirm = jest.fn(() => true);
    window.alert = jest.fn();
  });

  describe('Rendering', () => {
    it('should render page title', async () => {
      renderCompanies();

      await waitFor(() => {
        expect(screen.getByText('Companies')).toBeInTheDocument();
      });
    });

    it('should render subtitle', async () => {
      renderCompanies();

      await waitFor(() => {
        expect(screen.getByText('Manage all companies in the system')).toBeInTheDocument();
      });
    });

    it('should render add company button', async () => {
      renderCompanies();

      await waitFor(() => {
        expect(screen.getByText('Add Company')).toBeInTheDocument();
      });
    });

    it('should render search input', async () => {
      renderCompanies();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search companies...')).toBeInTheDocument();
      });
    });
  });

  describe('Data Loading', () => {
    it('should fetch companies on mount', async () => {
      renderCompanies();

      await waitFor(() => {
        expect(mockGetCompanies).toHaveBeenCalled();
      });
    });

    it('should display companies in table', async () => {
      renderCompanies();

      await waitFor(() => {
        expect(screen.getByText('Company A')).toBeInTheDocument();
        expect(screen.getByText('Company B')).toBeInTheDocument();
      });
    });

    it('should show loading state', () => {
      mockGetCompanies.mockImplementation(() => new Promise(() => {}));
      renderCompanies();

      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should handle API error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockGetCompanies.mockRejectedValue(new Error('Network error'));

      renderCompanies();

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });

  describe('Search Functionality', () => {
    it('should filter companies by name', async () => {
      renderCompanies();

      await waitFor(() => {
        expect(screen.getByText('Company A')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search companies...');
      fireEvent.change(searchInput, { target: { value: 'Acme' } });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
        expect(screen.queryByText('Company A')).not.toBeInTheDocument();
        expect(screen.queryByText('Company B')).not.toBeInTheDocument();
      });
    });

    it('should show all companies count', async () => {
      renderCompanies();

      await waitFor(() => {
        expect(screen.getByText('All Companies (3)')).toBeInTheDocument();
      });
    });

    it('should update count when filtering', async () => {
      renderCompanies();

      await waitFor(() => {
        expect(screen.getByText('All Companies (3)')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search companies...');
      fireEvent.change(searchInput, { target: { value: 'Company' } });

      await waitFor(() => {
        expect(screen.getByText('All Companies (2)')).toBeInTheDocument();
      });
    });
  });

  describe('Create Company Modal', () => {
    it('should open create modal when clicking add button', async () => {
      renderCompanies();

      await waitFor(() => {
        expect(screen.getByText('Add Company')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Add Company'));

      expect(screen.getByTestId('create-company-modal')).toBeInTheDocument();
    });

    it('should close create modal', async () => {
      renderCompanies();

      await waitFor(() => {
        expect(screen.getByText('Add Company')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Add Company'));
      expect(screen.getByTestId('create-company-modal')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Close'));
      expect(screen.queryByTestId('create-company-modal')).not.toBeInTheDocument();
    });

    it('should refresh companies on create success', async () => {
      renderCompanies();

      await waitFor(() => {
        expect(screen.getByText('Add Company')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Add Company'));
      fireEvent.click(screen.getByText('Create'));

      await waitFor(() => {
        expect(mockGetCompanies).toHaveBeenCalledTimes(2); // Initial + after create
      });
    });
  });

  describe('Edit Company Modal', () => {
    it('should open edit modal when clicking edit button', async () => {
      renderCompanies();

      await waitFor(() => {
        expect(screen.getByText('Company A')).toBeInTheDocument();
      });

      const editButtons = document.querySelectorAll('[class*="ghost"]');
      const editButton = Array.from(editButtons).find(btn =>
        btn.querySelector('svg.lucide-edit') || btn.querySelector('svg[class*="h-4"][class*="w-4"]')
      );

      if (editButton) {
        fireEvent.click(editButton as HTMLElement);
      }
    });
  });

  describe('Delete Company', () => {
    /**
     * These used to assert `window.confirm`. The page moved to the in-app
     * `ConfirmModal` (useConfirmModal), so the flow is now: click the row's
     * delete button, the modal renders the message, and the API is called only
     * after its Confirm button is pressed. The old tests also guarded the click
     * behind `if (deleteButtons.length > 0)`, which quietly passed when the
     * selector matched nothing — these fail loudly instead.
     */
    const openDeleteDialog = async () => {
      renderCompanies()

      await waitFor(() => {
        expect(screen.getByText('Company A')).toBeInTheDocument();
      });

      // One row per record, so take the first row's button.
      const deleteButton = (await screen.findAllByTitle('Delete'))[0];
      fireEvent.click(deleteButton);
    };

    it('shows the confirmation dialog before deleting', async () => {
      await openDeleteDialog();

      expect(
        await screen.findByText('Are you sure you want to delete this company? This action cannot be undone.')
      ).toBeInTheDocument();
      expect(mockDeleteCompany).not.toHaveBeenCalled();
    });

    it('does not delete when the dialog is cancelled', async () => {
      await openDeleteDialog();

      fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

      expect(mockDeleteCompany).not.toHaveBeenCalled();
    });

    it('calls the delete API on confirm', async () => {
      mockDeleteCompany.mockResolvedValue(undefined);
      await openDeleteDialog();

      fireEvent.click(await screen.findByRole('button', { name: 'Confirm' }));

      await waitFor(() => expect(mockDeleteCompany).toHaveBeenCalled());
    });
  });
  describe('Toggle Status', () => {
    it('should show deactivate button for active companies', async () => {
      renderCompanies();

      await waitFor(() => {
        expect(screen.getAllByText('Deactivate').length).toBeGreaterThan(0);
      });
    });

    it('should show activate button for inactive companies', async () => {
      renderCompanies();

      await waitFor(() => {
        expect(screen.getByText('Activate')).toBeInTheDocument();
      });
    });

    it('should call update status API', async () => {
      mockUpdateCompanyStatus.mockResolvedValue(undefined);
      renderCompanies();

      await waitFor(() => {
        expect(screen.getAllByText('Deactivate').length).toBeGreaterThan(0);
      });

      fireEvent.click(screen.getAllByText('Deactivate')[0]);

      await waitFor(() => {
        expect(mockUpdateCompanyStatus).toHaveBeenCalled();
      });
    });
  });

  describe('Access Control', () => {
    it('should show access denied for non-superAdmin users', async () => {
      jest.doMock('../../contexts/AuthContext', () => ({
        useAuth: () => ({
          user: { ...mockUser, role: 'admin' },
          isAuthenticated: true,
          isLoading: false,
        }),
      }));

    });
  });

  describe('Empty State', () => {
    it('should show empty state when no companies', async () => {
      mockGetCompanies.mockResolvedValue(createMockPaginatedResponse([]));
      renderCompanies();

      await waitFor(() => {
        expect(screen.getByText('No companies found')).toBeInTheDocument();
      });
    });

    it('should show add company button in empty state', async () => {
      mockGetCompanies.mockResolvedValue(createMockPaginatedResponse([]));
      renderCompanies();

      await waitFor(() => {
        expect(screen.getAllByText('Add Company').length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Status Badges', () => {
    it('should show green badge for active companies', async () => {
      renderCompanies();

      await waitFor(() => {
        const activeBadges = screen.getAllByText('Active');
        expect(activeBadges[0].closest('span')).toHaveClass('gd-badge-positive');
      });
    });

    it('should show red badge for inactive companies', async () => {
      renderCompanies();

      await waitFor(() => {
        const inactiveBadge = screen.getByText('Inactive');
        expect(inactiveBadge.closest('span')).toHaveClass('gd-badge-negative');
      });
    });
  });
});
