import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Manufacturers from '../../pages/Manufacturers';
import { createMockManufacturer, createMockPaginatedResponse } from '../../test-utils/api.mock';

const mockGetManufacturers = jest.fn();
const mockDeleteManufacturer = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uuid: 'user-1', role: 'admin' },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

jest.mock('../../services/api', () => ({
  manufacturersApi: {
    getManufacturers: () => mockGetManufacturers(),
    deleteManufacturer: (...args: any[]) => mockDeleteManufacturer(...args),
  },
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/manufacturers', state: null }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'manufacturers.title': 'Manufacturers',
        'manufacturers.subtitle': 'Manage paper manufacturers',
        'manufacturers.addManufacturer': 'Add Manufacturer',
        'manufacturers.allManufacturers': 'All Manufacturers',
        'manufacturers.searchPlaceholder': 'Search manufacturers...',
        'manufacturers.columns.code': 'Code',
        'manufacturers.columns.name': 'Name',
        'manufacturers.columns.created': 'Created',
        'manufacturers.columns.actions': 'Actions',
        'manufacturers.empty.title': 'No manufacturers found',
        'manufacturers.empty.description': 'No results match your search',
        'manufacturers.empty.noData': 'Get started by creating your first manufacturer',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('../../components/layout/Layout', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));

jest.mock('../../components/modals/CreateManufacturerModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSuccess }: any) =>
    isOpen ? (
      <div data-testid="create-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Create</button>
      </div>
    ) : null,
}));

jest.mock('../../components/modals/EditManufacturerModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSuccess }: any) =>
    isOpen ? (
      <div data-testid="edit-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Save</button>
      </div>
    ) : null,
}));

const mockManufacturers = [
  createMockManufacturer({ uuid: 'mfg-1', code: 'MFG-001', name: 'Paper Mill Co' }),
  createMockManufacturer({ uuid: 'mfg-2', code: 'MFG-002', name: 'Kraft Industries' }),
  createMockManufacturer({ uuid: 'mfg-3', code: 'MFG-003', name: 'Recycled Papers Inc' }),
];

describe('Manufacturers Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetManufacturers.mockResolvedValue(createMockPaginatedResponse(mockManufacturers));
  });

  describe('Rendering', () => {
    it('should render page title', async () => {
      render(<Manufacturers />);
      await waitFor(() => {
        expect(screen.getByText('Manufacturers')).toBeInTheDocument();
      });
    });

    it('should render add button', async () => {
      render(<Manufacturers />);
      await waitFor(() => {
        expect(screen.getByText('Add Manufacturer')).toBeInTheDocument();
      });
    });

    it('should render search input', async () => {
      render(<Manufacturers />);
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search manufacturers...')).toBeInTheDocument();
      });
    });
  });

  describe('Data Loading', () => {
    it('should fetch data on mount', async () => {
      render(<Manufacturers />);
      await waitFor(() => {
        expect(mockGetManufacturers).toHaveBeenCalled();
      });
    });

    it('should display data in table', async () => {
      render(<Manufacturers />);
      await waitFor(() => {
        expect(screen.getByText('MFG-001')).toBeInTheDocument();
        expect(screen.getByText('MFG-002')).toBeInTheDocument();
      });
    });

    it('should show loading state', () => {
      mockGetManufacturers.mockImplementation(() => new Promise(() => {}));
      render(<Manufacturers />);
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter by code', async () => {
      render(<Manufacturers />);
      await waitFor(() => {
        expect(screen.getByText('MFG-001')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search manufacturers...');
      fireEvent.change(searchInput, { target: { value: 'MFG-001' } });

      await waitFor(() => {
        expect(screen.getByText('MFG-001')).toBeInTheDocument();
        expect(screen.queryByText('MFG-002')).not.toBeInTheDocument();
      });
    });

    it('should filter by name', async () => {
      render(<Manufacturers />);
      await waitFor(() => {
        expect(screen.getByText('MFG-001')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search manufacturers...');
      fireEvent.change(searchInput, { target: { value: 'Kraft' } });

      await waitFor(() => {
        expect(screen.getByText('MFG-002')).toBeInTheDocument();
        expect(screen.queryByText('MFG-001')).not.toBeInTheDocument();
      });
    });
  });

  describe('Create Modal', () => {
    it('should open create modal', async () => {
      render(<Manufacturers />);
      await waitFor(() => {
        expect(screen.getByText('Add Manufacturer')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Add Manufacturer'));
      expect(screen.getByTestId('create-modal')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no data', async () => {
      mockGetManufacturers.mockResolvedValue(createMockPaginatedResponse([]));
      render(<Manufacturers />);
      await waitFor(() => {
        expect(screen.getByText('No manufacturers found')).toBeInTheDocument();
      });
    });
  });
});
