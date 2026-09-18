import React from 'react';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import { renderWithProviders as render } from '../../test-utils/renderWithProviders';
import Products from '../../pages/Products';
import { createMockProduct, createMockCustomer, createMockPaginatedResponse } from '../../test-utils/api.mock';

const mockGetProducts = jest.fn();
const mockDeleteProduct = jest.fn();
const mockGetCustomers = jest.fn();

jest.mock('../../contexts/AuthContext', () =>
  require('../../test-utils/renderWithProviders').authContextMock()
);

jest.mock('../../services/api', () => ({
  productsApi: {
    getProducts: (...args: any[]) => mockGetProducts(...args),
    deleteProduct: (...args: any[]) => mockDeleteProduct(...args),
  },
  customersApi: {
    getCustomers: (...args: any[]) => mockGetCustomers(...args),
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
        'products.filters.customer': 'Customer',
        'products.filters.customerPlaceholder': 'Search customer...',
        'products.selectCustomerPrompt.title': 'Select a customer',
        'products.selectCustomerPrompt.description': 'Choose a customer to see their products',
        'products.columns.code': 'Code',
        'products.columns.clientCode': 'Client Code',
        'products.columns.description': 'Description',
        'products.columns.customer': 'Customer',
        'products.columns.created': 'Created',
        'products.columns.actions': 'Actions',
        'products.empty.title': 'No products found',
        'products.empty.description': 'No results match your search',
        'products.empty.noData': 'Get started by creating your first product',
        'filters.required': 'Required',
        'filters.noResults': 'No results',
        'filters.loading': 'Searching...',
        'common.clear': 'Clear',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('../../components/layout/Layout', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));

jest.mock('../../components/products/ProductFormModal', () => ({
  __esModule: true,
  default: ({ mode, isOpen, onClose, onSuccess }: any) =>
    isOpen ? (
      <div data-testid={mode === 'create' ? 'create-modal' : 'edit-modal'}>
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>{mode === 'create' ? 'Create' : 'Save'}</button>
      </div>
    ) : null,
}));

const mockProducts = [
  createMockProduct({ uuid: 'prod-1', code: 'PROD-001', clientCode: 'CC-001', description: 'Corrugated Box A' }),
  createMockProduct({ uuid: 'prod-2', code: 'PROD-002', clientCode: 'CC-002', description: 'Shipping Container' }),
  createMockProduct({ uuid: 'prod-3', code: 'PROD-003', clientCode: 'CC-003', description: 'Display Box' }),
];

const mockCustomer = createMockCustomer({ uuid: 'cust-1', name: 'Acme Corp' });

/** Types into the customer autocomplete, opens the dropdown and selects the first option. */
async function selectCustomer(label = 'Acme Corp') {
  const combobox = screen.getByRole('combobox');
  fireEvent.focus(combobox);
  await waitFor(() => expect(mockGetCustomers).toHaveBeenCalled());
  await waitFor(() => expect(screen.getByRole('option', { name: label })).toBeInTheDocument());
  fireEvent.mouseDown(screen.getByRole('option', { name: label }));
}

describe('Products Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCustomers.mockResolvedValue(createMockPaginatedResponse([mockCustomer]));
    // Unlike its sibling pages, Products renders `data` (the server's answer)
    // instead of useEntityList's client-side `filteredData`, so search is a
    // round trip: the fake API has to honour the `search` param the page sends.
    mockGetProducts.mockImplementation((params: any = {}) => {
      const term = String(params.search ?? '').toLowerCase();
      const byCustomer = params.customerUuid ? mockProducts : [];
      const matches = term
        ? byCustomer.filter((product) =>
            [product.code, product.clientCode, product.description, product.customerName].some(
              (field) => String(field ?? '').toLowerCase().includes(term)
            )
          )
        : byCustomer;
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

    it('should render the customer filter, focused-able, with the search input disabled', async () => {
      render(<Products />);
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
      expect(screen.getByPlaceholderText('Search products...')).toBeDisabled();
    });
  });

  describe('Prompt state (AC-1)', () => {
    it('shows the prompt and makes no products request before a customer is chosen', async () => {
      render(<Products />);
      await waitFor(() => {
        expect(screen.getByText('Select a customer')).toBeInTheDocument();
      });
      expect(mockGetProducts).not.toHaveBeenCalled();
    });
  });

  describe('Selecting a customer (AC-2)', () => {
    it('debounces the customer lookup, then fetches products for the chosen customer at page 1', async () => {
      jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
      render(<Products />);

      const combobox = screen.getByRole('combobox');
      fireEvent.focus(combobox);
      await act(async () => {
        await Promise.resolve();
      });
      mockGetCustomers.mockClear();

      fireEvent.change(combobox, { target: { value: 'Acme' } });
      act(() => {
        jest.advanceTimersByTime(300);
      });
      await act(async () => {
        await Promise.resolve();
      });
      expect(mockGetCustomers).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Acme', limit: 20 })
      );

      await waitFor(() => expect(screen.getByRole('option', { name: 'Acme Corp' })).toBeInTheDocument());
      fireEvent.mouseDown(screen.getByRole('option', { name: 'Acme Corp' }));
      jest.useRealTimers();

      await waitFor(() => expect(mockGetProducts).toHaveBeenCalledTimes(1));
      expect(mockGetProducts).toHaveBeenCalledWith(
        expect.objectContaining({ customerUuid: 'cust-1', page: 1 })
      );
      await waitFor(() => {
        expect(screen.getByText('PROD-001')).toBeInTheDocument();
      });
    });

    it('shows the table skeleton, not the old spinner, while products are pending', async () => {
      render(<Products />);
      mockGetProducts.mockImplementation(() => new Promise(() => {}));

      await selectCustomer();

      await waitFor(() => {
        expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
      });
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });
  });

  describe('Clearing the customer (AC-3)', () => {
    it('returns to the prompt state with no extra request', async () => {
      render(<Products />);
      await selectCustomer();
      await waitFor(() => expect(screen.getByText('PROD-001')).toBeInTheDocument());

      const callsAfterSelect = mockGetProducts.mock.calls.length;
      fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

      await waitFor(() => {
        expect(screen.getByText('Select a customer')).toBeInTheDocument();
      });
      expect(mockGetProducts).toHaveBeenCalledTimes(callsAfterSelect);
    });
  });

  describe('Search Functionality (AC-5)', () => {
    it('sends search together with customerUuid, filtering by code', async () => {
      render(<Products />);
      await selectCustomer();
      await waitFor(() => {
        expect(screen.getByText('PROD-001')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search products...');
      expect(searchInput).not.toBeDisabled();
      fireEvent.change(searchInput, { target: { value: 'PROD-001' } });

      await waitFor(() => {
        expect(screen.getByText('PROD-001')).toBeInTheDocument();
        expect(screen.queryByText('PROD-002')).not.toBeInTheDocument();
      });
      expect(mockGetProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'PROD-001', customerUuid: 'cust-1' })
      );
    });

    it('filters by description', async () => {
      render(<Products />);
      await selectCustomer();
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

    it('filters by client code', async () => {
      render(<Products />);
      await selectCustomer();
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
      await selectCustomer();
      await waitFor(() => {
        expect(screen.getByText('PROD-001')).toBeInTheDocument();
      });
      const callsBeforeCreate = mockGetProducts.mock.calls.length;

      fireEvent.click(screen.getByText('Add Product'));
      fireEvent.click(screen.getByText('Create'));
      await waitFor(() => {
        expect(mockGetProducts).toHaveBeenCalledTimes(callsBeforeCreate + 1);
      });
    });
  });

  describe('Empty State', () => {
    it('shows the "no products found" state for a chosen customer with zero results', async () => {
      mockGetProducts.mockResolvedValue(createMockPaginatedResponse([]));
      render(<Products />);
      await selectCustomer();
      await waitFor(() => {
        expect(screen.getByText('No products found')).toBeInTheDocument();
      });
    });
  });
});
