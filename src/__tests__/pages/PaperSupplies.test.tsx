import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PaperSupplies from '../../pages/PaperSupplies';
import { createMockPaperSupply, createMockPaginatedResponse } from '../../test-utils/api.mock';

const mockGetPaperSupplies = jest.fn();
const mockDeletePaperSupply = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uuid: 'user-1', role: 'admin' },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

jest.mock('../../services/api', () => ({
  paperSuppliesApi: {
    getPaperSupplies: () => mockGetPaperSupplies(),
    deletePaperSupply: (...args: any[]) => mockDeletePaperSupply(...args),
  },
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/paper-supplies', state: null }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'paperSupplies.title': 'Paper Supplies',
        'paperSupplies.subtitle': 'Manage paper supplies',
        'paperSupplies.addPaperSupply': 'Add Paper Supply',
        'paperSupplies.allPaperSupplies': 'All Paper Supplies',
        'paperSupplies.searchPlaceholder': 'Search paper supplies...',
        'paperSupplies.columns.code': 'Code',
        'paperSupplies.columns.name': 'Name',
        'paperSupplies.columns.description': 'Description',
        'paperSupplies.columns.manufacturer': 'Manufacturer',
        'paperSupplies.columns.created': 'Created',
        'paperSupplies.columns.actions': 'Actions',
        'paperSupplies.empty.title': 'No paper supplies found',
        'paperSupplies.empty.description': 'No results match your search',
        'paperSupplies.empty.noData': 'Get started by creating your first paper supply',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('../../components/layout/Layout', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));

jest.mock('../../components/modals/CreatePaperSupplyModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSuccess }: any) =>
    isOpen ? (
      <div data-testid="create-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Create</button>
      </div>
    ) : null,
}));

jest.mock('../../components/modals/EditPaperSupplyModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSuccess }: any) =>
    isOpen ? (
      <div data-testid="edit-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Save</button>
      </div>
    ) : null,
}));

const mockPaperSupplies = [
  createMockPaperSupply({ uuid: 'ps-1', code: 'PS-001', name: 'Kraft 120gsm', description: 'Standard kraft paper' }),
  createMockPaperSupply({ uuid: 'ps-2', code: 'PS-002', name: 'Recycled 100gsm', description: 'Recycled paper' }),
  createMockPaperSupply({ uuid: 'ps-3', code: 'PS-003', name: 'White Top 150gsm', description: 'White top liner' }),
];

describe('PaperSupplies Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPaperSupplies.mockResolvedValue(createMockPaginatedResponse(mockPaperSupplies));
  });

  describe('Rendering', () => {
    it('should render page title', async () => {
      render(<PaperSupplies />);
      await waitFor(() => {
        expect(screen.getByText('Paper Supplies')).toBeInTheDocument();
      });
    });

    it('should render add button', async () => {
      render(<PaperSupplies />);
      await waitFor(() => {
        expect(screen.getByText('Add Paper Supply')).toBeInTheDocument();
      });
    });

    it('should render search input', async () => {
      render(<PaperSupplies />);
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search paper supplies...')).toBeInTheDocument();
      });
    });
  });

  describe('Data Loading', () => {
    it('should fetch data on mount', async () => {
      render(<PaperSupplies />);
      await waitFor(() => {
        expect(mockGetPaperSupplies).toHaveBeenCalled();
      });
    });

    it('should display data in table', async () => {
      render(<PaperSupplies />);
      await waitFor(() => {
        expect(screen.getByText('PS-001')).toBeInTheDocument();
        expect(screen.getByText('PS-002')).toBeInTheDocument();
      });
    });

    it('should show loading state', () => {
      mockGetPaperSupplies.mockImplementation(() => new Promise(() => {}));
      render(<PaperSupplies />);
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter by code', async () => {
      render(<PaperSupplies />);
      await waitFor(() => {
        expect(screen.getByText('PS-001')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search paper supplies...');
      fireEvent.change(searchInput, { target: { value: 'PS-001' } });

      await waitFor(() => {
        expect(screen.getByText('PS-001')).toBeInTheDocument();
        expect(screen.queryByText('PS-002')).not.toBeInTheDocument();
      });
    });

    it('should filter by name', async () => {
      render(<PaperSupplies />);
      await waitFor(() => {
        expect(screen.getByText('PS-001')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search paper supplies...');
      fireEvent.change(searchInput, { target: { value: 'Recycled' } });

      await waitFor(() => {
        expect(screen.getByText('PS-002')).toBeInTheDocument();
        expect(screen.queryByText('PS-001')).not.toBeInTheDocument();
      });
    });
  });

  describe('Create Modal', () => {
    it('should open create modal', async () => {
      render(<PaperSupplies />);
      await waitFor(() => {
        expect(screen.getByText('Add Paper Supply')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Add Paper Supply'));
      expect(screen.getByTestId('create-modal')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no data', async () => {
      mockGetPaperSupplies.mockResolvedValue(createMockPaginatedResponse([]));
      render(<PaperSupplies />);
      await waitFor(() => {
        expect(screen.getByText('No paper supplies found')).toBeInTheDocument();
      });
    });
  });
});
