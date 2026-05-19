import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PaperTypes from '../../pages/PaperTypes';
import { createMockPaperType, createMockPaginatedResponse } from '../../test-utils/api.mock';

const mockGetPaperTypes = jest.fn();
const mockDeletePaperType = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uuid: 'user-1', role: 'admin' },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

jest.mock('../../services/api', () => ({
  paperTypesApi: {
    getPaperTypes: () => mockGetPaperTypes(),
    deletePaperType: (...args: any[]) => mockDeletePaperType(...args),
  },
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/paper-types', state: null }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'paperTypes.title': 'Paper Types',
        'paperTypes.subtitle': 'Manage paper types',
        'paperTypes.addType': 'Add Paper Type',
        'paperTypes.allTypes': 'All Paper Types',
        'paperTypes.searchPlaceholder': 'Search paper types...',
        'paperTypes.columns.code': 'Code',
        'paperTypes.columns.description': 'Description',
        'paperTypes.columns.created': 'Created',
        'paperTypes.columns.actions': 'Actions',
        'paperTypes.empty.title': 'No paper types found',
        'paperTypes.empty.description': 'No results match your search',
        'paperTypes.empty.noData': 'Get started by creating your first paper type',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('../../components/layout/Layout', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));

jest.mock('../../components/modals/CreatePaperTypeModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSuccess }: any) =>
    isOpen ? (
      <div data-testid="create-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Create</button>
      </div>
    ) : null,
}));

jest.mock('../../components/modals/EditPaperTypeModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSuccess }: any) =>
    isOpen ? (
      <div data-testid="edit-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Save</button>
      </div>
    ) : null,
}));

const mockPaperTypes = [
  createMockPaperType({ uuid: 'pt-1', code: 'PT-001', description: 'Kraft Paper' }),
  createMockPaperType({ uuid: 'pt-2', code: 'PT-002', description: 'Recycled Paper' }),
  createMockPaperType({ uuid: 'pt-3', code: 'PT-003', description: 'White Top' }),
];

describe('PaperTypes Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPaperTypes.mockResolvedValue(createMockPaginatedResponse(mockPaperTypes));
  });

  describe('Rendering', () => {
    it('should render page title', async () => {
      render(<PaperTypes />);
      await waitFor(() => {
        expect(screen.getByText('Paper Types')).toBeInTheDocument();
      });
    });

    it('should render add button', async () => {
      render(<PaperTypes />);
      await waitFor(() => {
        expect(screen.getByText('Add Paper Type')).toBeInTheDocument();
      });
    });

    it('should render search input', async () => {
      render(<PaperTypes />);
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search paper types...')).toBeInTheDocument();
      });
    });
  });

  describe('Data Loading', () => {
    it('should fetch data on mount', async () => {
      render(<PaperTypes />);
      await waitFor(() => {
        expect(mockGetPaperTypes).toHaveBeenCalled();
      });
    });

    it('should display data in table', async () => {
      render(<PaperTypes />);
      await waitFor(() => {
        expect(screen.getByText('PT-001')).toBeInTheDocument();
        expect(screen.getByText('PT-002')).toBeInTheDocument();
      });
    });

    it('should show loading state', () => {
      mockGetPaperTypes.mockImplementation(() => new Promise(() => {}));
      render(<PaperTypes />);
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter by code', async () => {
      render(<PaperTypes />);
      await waitFor(() => {
        expect(screen.getByText('PT-001')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search paper types...');
      fireEvent.change(searchInput, { target: { value: 'PT-001' } });

      await waitFor(() => {
        expect(screen.getByText('PT-001')).toBeInTheDocument();
        expect(screen.queryByText('PT-002')).not.toBeInTheDocument();
      });
    });

    it('should filter by description', async () => {
      render(<PaperTypes />);
      await waitFor(() => {
        expect(screen.getByText('PT-001')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search paper types...');
      fireEvent.change(searchInput, { target: { value: 'Recycled' } });

      await waitFor(() => {
        expect(screen.getByText('PT-002')).toBeInTheDocument();
        expect(screen.queryByText('PT-001')).not.toBeInTheDocument();
      });
    });
  });

  describe('Create Modal', () => {
    it('should open create modal', async () => {
      render(<PaperTypes />);
      await waitFor(() => {
        expect(screen.getByText('Add Paper Type')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Add Paper Type'));
      expect(screen.getByTestId('create-modal')).toBeInTheDocument();
    });

    it('should refresh data on create success', async () => {
      render(<PaperTypes />);
      await waitFor(() => {
        expect(screen.getByText('Add Paper Type')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Add Paper Type'));
      fireEvent.click(screen.getByText('Create'));
      await waitFor(() => {
        expect(mockGetPaperTypes).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no data', async () => {
      mockGetPaperTypes.mockResolvedValue(createMockPaginatedResponse([]));
      render(<PaperTypes />);
      await waitFor(() => {
        expect(screen.getByText('No paper types found')).toBeInTheDocument();
        expect(screen.getByText('Get started by creating your first paper type')).toBeInTheDocument();
      });
    });
  });
});
