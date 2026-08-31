import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders as render } from '../../test-utils/renderWithProviders';
import Customers from '../../pages/Customers';
import { createMockCustomer, createMockPaginatedResponse } from '../../test-utils/api.mock';

const mockGetCustomers = jest.fn();
const mockDeleteCustomer = jest.fn();

jest.mock('../../contexts/AuthContext', () =>
  require('../../test-utils/renderWithProviders').authContextMock()
);

jest.mock('../../services/api', () => ({
  customersApi: {
    getCustomers: () => mockGetCustomers(),
    deleteCustomer: (...args: any[]) => mockDeleteCustomer(...args),
  },
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/customers', state: null }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'customers.title': 'Customers',
        'customers.subtitle': 'Manage customer records',
        'customers.addCustomer': 'Add Customer',
        'customers.allCustomers': 'All Customers',
        'customers.searchPlaceholder': 'Search customers...',
        'customers.columns.name': 'Name',
        'customers.columns.code': 'Code',
        'customers.columns.category': 'Category',
        'customers.columns.salesPerson': 'Sales Person',
        'customers.columns.status': 'Status',
        'customers.columns.created': 'Created',
        'customers.columns.actions': 'Actions',
        'customers.status.active': 'Active',
        'customers.status.inactive': 'Inactive',
        'customers.empty.title': 'No customers found',
        'customers.empty.description': 'No results match your search',
        'customers.empty.noData': 'Get started by creating your first customer',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('../../components/layout/Layout', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));

jest.mock('../../components/modals/CreateCustomerModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSuccess }: any) =>
    isOpen ? (
      <div data-testid="create-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Create</button>
      </div>
    ) : null,
}));

jest.mock('../../components/modals/EditCustomerModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSuccess }: any) =>
    isOpen ? (
      <div data-testid="edit-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Save</button>
      </div>
    ) : null,
}));

const mockCustomers = [
  createMockCustomer({ uuid: 'cust-1', name: 'Acme Corp', supplierCode: 'CUST-001', active: true }),
  createMockCustomer({ uuid: 'cust-2', name: 'Box Industries', supplierCode: 'CUST-002', active: true }),
  createMockCustomer({ uuid: 'cust-3', name: 'Package Ltd', supplierCode: 'CUST-003', active: false }),
];

describe('Customers Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCustomers.mockResolvedValue(createMockPaginatedResponse(mockCustomers));
  });

  describe('Rendering', () => {
    it('should render page title', async () => {
      render(<Customers />);
      await waitFor(() => {
        expect(screen.getByText('Customers')).toBeInTheDocument();
      });
    });

    it('should render add button', async () => {
      render(<Customers />);
      await waitFor(() => {
        expect(screen.getByText('Add Customer')).toBeInTheDocument();
      });
    });

    it('should render search input', async () => {
      render(<Customers />);
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search customers...')).toBeInTheDocument();
      });
    });
  });

  describe('Data Loading', () => {
    it('should fetch data on mount', async () => {
      render(<Customers />);
      await waitFor(() => {
        expect(mockGetCustomers).toHaveBeenCalled();
      });
    });

    it('should display data in table', async () => {
      render(<Customers />);
      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
        expect(screen.getByText('Box Industries')).toBeInTheDocument();
      });
    });

    it('should show loading state', () => {
      mockGetCustomers.mockImplementation(() => new Promise(() => {}));
      render(<Customers />);
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter by name', async () => {
      render(<Customers />);
      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search customers...');
      fireEvent.change(searchInput, { target: { value: 'Acme' } });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
        expect(screen.queryByText('Box Industries')).not.toBeInTheDocument();
      });
    });

    it('should filter by code', async () => {
      render(<Customers />);
      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search customers...');
      fireEvent.change(searchInput, { target: { value: 'CUST-002' } });

      await waitFor(() => {
        expect(screen.getByText('Box Industries')).toBeInTheDocument();
        expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument();
      });
    });
  });

  describe('Create Modal', () => {
    it('should open create modal', async () => {
      render(<Customers />);
      await waitFor(() => {
        expect(screen.getByText('Add Customer')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Add Customer'));
      expect(screen.getByTestId('create-modal')).toBeInTheDocument();
    });

    it('should refresh data on create success', async () => {
      render(<Customers />);
      await waitFor(() => {
        expect(screen.getByText('Add Customer')).toBeInTheDocument();
      });
      // The page fetches twice on mount (useEntityList's autoFetch plus the
      // page's own effectiveCompanyId effect), so pin the delta — one extra
      // request caused by the create — rather than a magic total.
      const callsBeforeCreate = mockGetCustomers.mock.calls.length;

      fireEvent.click(screen.getByText('Add Customer'));
      fireEvent.click(screen.getByText('Create'));
      await waitFor(() => {
        expect(mockGetCustomers).toHaveBeenCalledTimes(callsBeforeCreate + 1);
      });
    });
  });

  describe('Status Display', () => {
    it('should display active status for active customers', async () => {
      render(<Customers />);
      await waitFor(() => {
        expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
      });
    });

    it('should display inactive status for inactive customers', async () => {
      render(<Customers />);
      await waitFor(() => {
        expect(screen.getByText('Inactive')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no data', async () => {
      mockGetCustomers.mockResolvedValue(createMockPaginatedResponse([]));
      render(<Customers />);
      await waitFor(() => {
        expect(screen.getByText('No customers found')).toBeInTheDocument();
      });
    });
  });
});
