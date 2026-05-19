import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Suppliers from '../../pages/Suppliers';
import { createMockSupplier, createMockPaginatedResponse } from '../../test-utils/api.mock';

const mockGetSuppliers = jest.fn();
const mockDeleteSupplier = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uuid: 'user-1', role: 'admin' },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

jest.mock('../../services/api', () => ({
  suppliersApi: {
    getSuppliers: () => mockGetSuppliers(),
    deleteSupplier: (...args: any[]) => mockDeleteSupplier(...args),
  },
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/suppliers', state: null }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'suppliers.title': 'Suppliers',
        'suppliers.subtitle': 'Manage suppliers',
        'suppliers.addSupplier': 'Add Supplier',
        'suppliers.allSuppliers': 'All Suppliers',
        'suppliers.searchPlaceholder': 'Search suppliers...',
        'suppliers.columns.code': 'Code',
        'suppliers.columns.supplies': 'Supplies',
        'suppliers.columns.created': 'Created',
        'suppliers.columns.actions': 'Actions',
        'suppliers.empty.title': 'No suppliers found',
        'suppliers.empty.description': 'No results match your search',
        'suppliers.empty.noData': 'Get started by creating your first supplier',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('../../components/layout/Layout', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));

jest.mock('../../components/modals/CreateSupplierModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSuccess }: any) =>
    isOpen ? (
      <div data-testid="create-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Create</button>
      </div>
    ) : null,
}));

jest.mock('../../components/modals/EditSupplierModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSuccess }: any) =>
    isOpen ? (
      <div data-testid="edit-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Save</button>
      </div>
    ) : null,
}));

const mockSuppliers = [
  createMockSupplier({ uuid: 'sup-1', code: 'SUP-001', suppliesSheets: true, suppliesPaper: true }),
  createMockSupplier({ uuid: 'sup-2', code: 'SUP-002', suppliesElaborated: true }),
  createMockSupplier({ uuid: 'sup-3', code: 'SUP-003', suppliesTooling: true }),
];

describe('Suppliers Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSuppliers.mockResolvedValue(createMockPaginatedResponse(mockSuppliers));
  });

  describe('Rendering', () => {
    it('should render page title', async () => {
      render(<Suppliers />);
      await waitFor(() => {
        expect(screen.getByText('Suppliers')).toBeInTheDocument();
      });
    });

    it('should render add button', async () => {
      render(<Suppliers />);
      await waitFor(() => {
        expect(screen.getByText('Add Supplier')).toBeInTheDocument();
      });
    });

    it('should render search input', async () => {
      render(<Suppliers />);
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search suppliers...')).toBeInTheDocument();
      });
    });
  });

  describe('Data Loading', () => {
    it('should fetch data on mount', async () => {
      render(<Suppliers />);
      await waitFor(() => {
        expect(mockGetSuppliers).toHaveBeenCalled();
      });
    });

    it('should display data in table', async () => {
      render(<Suppliers />);
      await waitFor(() => {
        expect(screen.getByText('SUP-001')).toBeInTheDocument();
        expect(screen.getByText('SUP-002')).toBeInTheDocument();
      });
    });

    it('should show loading state', () => {
      mockGetSuppliers.mockImplementation(() => new Promise(() => {}));
      render(<Suppliers />);
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter by code', async () => {
      render(<Suppliers />);
      await waitFor(() => {
        expect(screen.getByText('SUP-001')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search suppliers...');
      fireEvent.change(searchInput, { target: { value: 'SUP-001' } });

      await waitFor(() => {
        expect(screen.getByText('SUP-001')).toBeInTheDocument();
        expect(screen.queryByText('SUP-002')).not.toBeInTheDocument();
      });
    });
  });

  describe('Create Modal', () => {
    it('should open create modal', async () => {
      render(<Suppliers />);
      await waitFor(() => {
        expect(screen.getByText('Add Supplier')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Add Supplier'));
      expect(screen.getByTestId('create-modal')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no data', async () => {
      mockGetSuppliers.mockResolvedValue(createMockPaginatedResponse([]));
      render(<Suppliers />);
      await waitFor(() => {
        expect(screen.getByText('No suppliers found')).toBeInTheDocument();
      });
    });
  });
});
