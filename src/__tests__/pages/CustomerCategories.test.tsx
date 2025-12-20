/**
 * CustomerCategories Page Unit Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CustomerCategories from '../../pages/CustomerCategories';
import { createMockCustomerCategory, createMockPaginatedResponse } from '../../test-utils/api.mock';

const mockGetCategories = jest.fn();
const mockDeleteCategory = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uuid: 'user-1', role: 'admin' },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

jest.mock('../../services/api', () => ({
  customerCategoriesApi: {
    getCategories: () => mockGetCategories(),
    deleteCategory: (...args: any[]) => mockDeleteCategory(...args),
  },
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/customer-categories', state: null }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'customerCategories.title': 'Customer Categories',
        'customerCategories.subtitle': 'Manage customer categories',
        'customerCategories.addCategory': 'Add Category',
        'customerCategories.allCategories': 'All Categories',
        'customerCategories.searchPlaceholder': 'Search categories...',
        'customerCategories.columns.name': 'Name',
        'customerCategories.columns.created': 'Created',
        'customerCategories.columns.actions': 'Actions',
        'customerCategories.empty.title': 'No categories found',
        'customerCategories.empty.description': 'No results match your search',
        'customerCategories.empty.noData': 'Get started by creating your first category',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('../../components/layout/Layout', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));

jest.mock('../../components/modals/CreateCustomerCategoryModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSuccess }: any) =>
    isOpen ? (
      <div data-testid="create-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Create</button>
      </div>
    ) : null,
}));

jest.mock('../../components/modals/EditCustomerCategoryModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSuccess }: any) =>
    isOpen ? (
      <div data-testid="edit-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Save</button>
      </div>
    ) : null,
}));

const mockCategories = [
  createMockCustomerCategory({ uuid: 'cat-1', name: 'Retail' }),
  createMockCustomerCategory({ uuid: 'cat-2', name: 'Wholesale' }),
  createMockCustomerCategory({ uuid: 'cat-3', name: 'Industrial' }),
];

describe('CustomerCategories Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCategories.mockResolvedValue(createMockPaginatedResponse(mockCategories));
  });

  describe('Rendering', () => {
    it('should render page title', async () => {
      render(<CustomerCategories />);
      await waitFor(() => {
        expect(screen.getByText('Customer Categories')).toBeInTheDocument();
      });
    });

    it('should render add button', async () => {
      render(<CustomerCategories />);
      await waitFor(() => {
        expect(screen.getByText('Add Category')).toBeInTheDocument();
      });
    });

    it('should render search input', async () => {
      render(<CustomerCategories />);
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search categories...')).toBeInTheDocument();
      });
    });
  });

  describe('Data Loading', () => {
    it('should fetch data on mount', async () => {
      render(<CustomerCategories />);
      await waitFor(() => {
        expect(mockGetCategories).toHaveBeenCalled();
      });
    });

    it('should display data in table', async () => {
      render(<CustomerCategories />);
      await waitFor(() => {
        expect(screen.getByText('Retail')).toBeInTheDocument();
        expect(screen.getByText('Wholesale')).toBeInTheDocument();
      });
    });

    it('should show loading state', () => {
      mockGetCategories.mockImplementation(() => new Promise(() => {}));
      render(<CustomerCategories />);
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter by name', async () => {
      render(<CustomerCategories />);
      await waitFor(() => {
        expect(screen.getByText('Retail')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search categories...');
      fireEvent.change(searchInput, { target: { value: 'Retail' } });

      await waitFor(() => {
        expect(screen.getByText('Retail')).toBeInTheDocument();
        expect(screen.queryByText('Wholesale')).not.toBeInTheDocument();
      });
    });
  });

  describe('Create Modal', () => {
    it('should open create modal', async () => {
      render(<CustomerCategories />);
      await waitFor(() => {
        expect(screen.getByText('Add Category')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Add Category'));
      expect(screen.getByTestId('create-modal')).toBeInTheDocument();
    });

    it('should refresh data on create success', async () => {
      render(<CustomerCategories />);
      await waitFor(() => {
        expect(screen.getByText('Add Category')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Add Category'));
      fireEvent.click(screen.getByText('Create'));
      await waitFor(() => {
        expect(mockGetCategories).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no data', async () => {
      mockGetCategories.mockResolvedValue(createMockPaginatedResponse([]));
      render(<CustomerCategories />);
      await waitFor(() => {
        expect(screen.getByText('No categories found')).toBeInTheDocument();
      });
    });
  });
});
