import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PaperClasses from '../../pages/PaperClasses';
import { createMockPaperClass, createMockPaginatedResponse } from '../../test-utils/api.mock';

const mockGetPaperClasses = jest.fn();
const mockDeletePaperClass = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uuid: 'user-1', role: 'admin' },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

jest.mock('../../services/api', () => ({
  paperClassesApi: {
    getPaperClasses: () => mockGetPaperClasses(),
    deletePaperClass: (...args: any[]) => mockDeletePaperClass(...args),
  },
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/paper-classes', state: null }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'paperClasses.title': 'Paper Classes',
        'paperClasses.subtitle': 'Manage paper classes',
        'paperClasses.addClass': 'Add Paper Class',
        'paperClasses.allClasses': 'All Paper Classes',
        'paperClasses.searchPlaceholder': 'Search paper classes...',
        'paperClasses.columns.code': 'Code',
        'paperClasses.columns.description': 'Description',
        'paperClasses.columns.created': 'Created',
        'paperClasses.columns.actions': 'Actions',
        'paperClasses.empty.title': 'No paper classes found',
        'paperClasses.empty.description': 'No results match your search',
        'paperClasses.empty.noData': 'Get started by creating your first paper class',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('../../components/layout/Layout', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));

jest.mock('../../components/modals/CreatePaperClassModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSuccess }: any) =>
    isOpen ? (
      <div data-testid="create-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Create</button>
      </div>
    ) : null,
}));

jest.mock('../../components/modals/EditPaperClassModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSuccess }: any) =>
    isOpen ? (
      <div data-testid="edit-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Save</button>
      </div>
    ) : null,
}));

const mockPaperClasses = [
  createMockPaperClass({ uuid: 'pc-1', code: 'PC-001', name: 'Class A' }),
  createMockPaperClass({ uuid: 'pc-2', code: 'PC-002', name: 'Class B' }),
  createMockPaperClass({ uuid: 'pc-3', code: 'PC-003', name: 'Premium Class' }),
];

describe('PaperClasses Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPaperClasses.mockResolvedValue(createMockPaginatedResponse(mockPaperClasses));
  });

  describe('Rendering', () => {
    it('should render page title', async () => {
      render(<PaperClasses />);
      await waitFor(() => {
        expect(screen.getByText('Paper Classes')).toBeInTheDocument();
      });
    });

    it('should render add button', async () => {
      render(<PaperClasses />);
      await waitFor(() => {
        expect(screen.getByText('Add Paper Class')).toBeInTheDocument();
      });
    });

    it('should render search input', async () => {
      render(<PaperClasses />);
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search paper classes...')).toBeInTheDocument();
      });
    });
  });

  describe('Data Loading', () => {
    it('should fetch data on mount', async () => {
      render(<PaperClasses />);
      await waitFor(() => {
        expect(mockGetPaperClasses).toHaveBeenCalled();
      });
    });

    it('should display data in table', async () => {
      render(<PaperClasses />);
      await waitFor(() => {
        expect(screen.getByText('PC-001')).toBeInTheDocument();
        expect(screen.getByText('PC-002')).toBeInTheDocument();
      });
    });

    it('should show loading state', () => {
      mockGetPaperClasses.mockImplementation(() => new Promise(() => {}));
      render(<PaperClasses />);
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter by code', async () => {
      render(<PaperClasses />);
      await waitFor(() => {
        expect(screen.getByText('PC-001')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search paper classes...');
      fireEvent.change(searchInput, { target: { value: 'PC-001' } });

      await waitFor(() => {
        expect(screen.getByText('PC-001')).toBeInTheDocument();
        expect(screen.queryByText('PC-002')).not.toBeInTheDocument();
      });
    });
  });

  describe('Create Modal', () => {
    it('should open create modal', async () => {
      render(<PaperClasses />);
      await waitFor(() => {
        expect(screen.getByText('Add Paper Class')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Add Paper Class'));
      expect(screen.getByTestId('create-modal')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no data', async () => {
      mockGetPaperClasses.mockResolvedValue(createMockPaginatedResponse([]));
      render(<PaperClasses />);
      await waitFor(() => {
        expect(screen.getByText('No paper classes found')).toBeInTheDocument();
      });
    });
  });
});
