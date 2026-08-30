import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders as render } from '../../test-utils/renderWithProviders';
import Products from '../../pages/Products';
import { createMockProduct, createMockPaginatedResponse } from '../../test-utils/api.mock';

const mockGetProducts = jest.fn();
const mockDeleteProduct = jest.fn();

jest.mock('../../contexts/AuthContext', () =>
  require('../../test-utils/renderWithProviders').authContextMock()
);

jest.mock('../../services/api', () => ({
  productsApi: {
    getProducts: (...args: any[]) => mockGetProducts(...args),
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
    // Unlike its sibling pages, Products renders `data` (the server's answer)
    // instead of useEntityList's client-side `filteredData`, so search is a
    // round trip: the fake API has to honour the `search` param the page sends.
    mockGetProducts.mockImplementation((params: any = {}) => {
      const term = String(params.search ?? '').toLowerCase();
      const matches = term
        ? mockProducts.filter((product) =>
            [product.code, product.clientCode, product.description, product.customerName].some(
              (field) => String(field ?? '').toLowerCase().includes(term)
            )
          )
        : mockProducts;
      return Promise.resolve(createMockPaginatedResponse(matches));
    });
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
      // The page fetches twice on mount (useEntityList's autoFetch plus the
      // page's own effectiveCompanyId effect), so pin the delta — one extra
      // request caused by the create — rather than a magic total.
      const callsBeforeCreate = mockGetProducts.mock.calls.length;

      fireEvent.click(screen.getByText('Add Product'));
      fireEvent.click(screen.getByText('Create'));
      await waitFor(() => {
        expect(mockGetProducts).toHaveBeenCalledTimes(callsBeforeCreate + 1);
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
