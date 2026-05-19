import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Products from '../../pages/Products';
import { createMockProduct, createMockPaginatedResponse } from '../../test-utils/api.mock';

const mockGetProducts = jest.fn();
const mockDeleteProduct = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uuid: 'user-1', role: 'admin' },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

jest.mock('../../services/api', () => ({
  productsApi: {
    getProducts: () => mockGetProducts(),
    deleteProduct: (...args: any[]) => mockDeleteProduct(...args),
  },
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/products', state: null }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'products.title': 'Products',
        'products.subtitle': 'Manage product catalog',
        'products.addProduct': 'Add Product',
        'products.allProducts': 'All Products',
        'products.searchPlaceholder': 'Search products...',
        'products.columns.code': 'Code',
        'products.columns.clientCode': 'Client Code',
        'products.columns.description': 'Description',
        'products.columns.customer': 'Customer',
        'products.columns.created': 'Created',
        'products.columns.actions': 'Actions',
        'products.empty.title': 'No products found',
        'products.empty.description': 'No results match your search',
        'products.empty.noData': 'Get started by creating your first product',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('../../components/layout/Layout', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));

jest.mock('../../components/modals/CreateProductModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSuccess }: any) =>
    isOpen ? (
      <div data-testid="create-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Create</button>
      </div>
    ) : null,
}));

jest.mock('../../components/modals/EditProductModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSuccess }: any) =>
    isOpen ? (
      <div data-testid="edit-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Save</button>
      </div>
    ) : null,
}));

const mockProducts = [
  createMockProduct({ uuid: 'prod-1', code: 'PROD-001', clientCode: 'CC-001', description: 'Corrugated Box A' }),
  createMockProduct({ uuid: 'prod-2', code: 'PROD-002', clientCode: 'CC-002', description: 'Shipping Container' }),
  createMockProduct({ uuid: 'prod-3', code: 'PROD-003', clientCode: 'CC-003', description: 'Display Box' }),
];

describe('Products Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetProducts.mockResolvedValue(createMockPaginatedResponse(mockProducts));
  });

  describe('Rendering', () => {
    it('should render page title', async () => {
      render(<Products />);
      await waitFor(() => {
        expect(screen.getByText('Products')).toBeInTheDocument();
      });
    });

    it('should render add button', async () => {
      render(<Products />);
      await waitFor(() => {
        expect(screen.getByText('Add Product')).toBeInTheDocument();
      });
    });

    it('should render search input', async () => {
      render(<Products />);
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search products...')).toBeInTheDocument();
      });
    });
  });

  describe('Data Loading', () => {
    it('should fetch data on mount', async () => {
      render(<Products />);
      await waitFor(() => {
        expect(mockGetProducts).toHaveBeenCalled();
      });
    });

    it('should display data in table', async () => {
      render(<Products />);
      await waitFor(() => {
        expect(screen.getByText('PROD-001')).toBeInTheDocument();
        expect(screen.getByText('PROD-002')).toBeInTheDocument();
      });
    });

    it('should show loading state', () => {
      mockGetProducts.mockImplementation(() => new Promise(() => {}));
      render(<Products />);
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter by code', async () => {
      render(<Products />);
      await waitFor(() => {
        expect(screen.getByText('PROD-001')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search products...');
      fireEvent.change(searchInput, { target: { value: 'PROD-001' } });

      await waitFor(() => {
        expect(screen.getByText('PROD-001')).toBeInTheDocument();
        expect(screen.queryByText('PROD-002')).not.toBeInTheDocument();
      });
    });

    it('should filter by description', async () => {
      render(<Products />);
      await waitFor(() => {
        expect(screen.getByText('PROD-001')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search products...');
      fireEvent.change(searchInput, { target: { value: 'Shipping' } });

      await waitFor(() => {
        expect(screen.getByText('PROD-002')).toBeInTheDocument();
        expect(screen.queryByText('PROD-001')).not.toBeInTheDocument();
      });
    });

    it('should filter by client code', async () => {
      render(<Products />);
      await waitFor(() => {
        expect(screen.getByText('PROD-001')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search products...');
      fireEvent.change(searchInput, { target: { value: 'CC-003' } });

      await waitFor(() => {
        expect(screen.getByText('PROD-003')).toBeInTheDocument();
        expect(screen.queryByText('PROD-001')).not.toBeInTheDocument();
      });
    });
  });

  describe('Create Modal', () => {
    it('should open create modal', async () => {
      render(<Products />);
      await waitFor(() => {
        expect(screen.getByText('Add Product')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Add Product'));
      expect(screen.getByTestId('create-modal')).toBeInTheDocument();
    });

    it('should refresh data on create success', async () => {
      render(<Products />);
      await waitFor(() => {
        expect(screen.getByText('Add Product')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Add Product'));
      fireEvent.click(screen.getByText('Create'));
      await waitFor(() => {
        expect(mockGetProducts).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no data', async () => {
      mockGetProducts.mockResolvedValue(createMockPaginatedResponse([]));
      render(<Products />);
      await waitFor(() => {
        expect(screen.getByText('No products found')).toBeInTheDocument();
      });
    });
  });
});
