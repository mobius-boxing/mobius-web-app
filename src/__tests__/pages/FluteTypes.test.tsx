import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders as render } from '../../test-utils/renderWithProviders';
import FluteTypes from '../../pages/FluteTypes';
import { createMockFluteType, createMockPaginatedResponse } from '../../test-utils/api.mock';

const mockGetFluteTypes = jest.fn();
const mockDeleteFluteType = jest.fn();

jest.mock('../../contexts/AuthContext', () =>
  require('../../test-utils/renderWithProviders').authContextMock()
);

jest.mock('../../services/api', () => ({
  fluteTypesApi: {
    getFluteTypes: () => mockGetFluteTypes(),
    deleteFluteType: (...args: any[]) => mockDeleteFluteType(...args),
  },
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/flute-types', state: null }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'fluteTypes.title': 'Flute Types',
        'fluteTypes.subtitle': 'Manage flute types',
        'fluteTypes.addType': 'Add Flute Type',
        'fluteTypes.allTypes': 'All Flute Types',
        'fluteTypes.searchPlaceholder': 'Search flute types...',
        'fluteTypes.columns.code': 'Code',
        'fluteTypes.columns.description': 'Description',
        'fluteTypes.columns.fluteFactor': 'Flute Factor',
        'fluteTypes.columns.created': 'Created',
        'fluteTypes.columns.actions': 'Actions',
        'fluteTypes.empty.title': 'No flute types found',
        'fluteTypes.empty.description': 'No results match your search',
        'fluteTypes.empty.noData': 'Get started by creating your first flute type',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('../../components/layout/Layout', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));

jest.mock('../../components/modals/CreateFluteTypeModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSuccess }: any) =>
    isOpen ? (
      <div data-testid="create-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Create</button>
      </div>
    ) : null,
}));

jest.mock('../../components/modals/EditFluteTypeModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSuccess }: any) =>
    isOpen ? (
      <div data-testid="edit-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Save</button>
      </div>
    ) : null,
}));

const mockFluteTypes = [
  createMockFluteType({ uuid: 'ft-1', code: 'FT-001', description: 'A Flute' }),
  createMockFluteType({ uuid: 'ft-2', code: 'FT-002', description: 'B Flute' }),
  createMockFluteType({ uuid: 'ft-3', code: 'FT-003', description: 'C Flute' }),
];

describe('FluteTypes Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFluteTypes.mockResolvedValue(createMockPaginatedResponse(mockFluteTypes));
  });

  describe('Rendering', () => {
    it('should render page title', async () => {
      render(<FluteTypes />);
      await waitFor(() => {
        expect(screen.getByText('Flute Types')).toBeInTheDocument();
      });
    });

    it('should render add button', async () => {
      render(<FluteTypes />);
      await waitFor(() => {
        expect(screen.getByText('Add Flute Type')).toBeInTheDocument();
      });
    });

    it('should render search input', async () => {
      render(<FluteTypes />);
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search flute types...')).toBeInTheDocument();
      });
    });
  });

  describe('Data Loading', () => {
    it('should fetch data on mount', async () => {
      render(<FluteTypes />);
      await waitFor(() => {
        expect(mockGetFluteTypes).toHaveBeenCalled();
      });
    });

    it('should display data in table', async () => {
      render(<FluteTypes />);
      await waitFor(() => {
        expect(screen.getByText('FT-001')).toBeInTheDocument();
        expect(screen.getByText('FT-002')).toBeInTheDocument();
      });
    });

    it('should show loading state', () => {
      mockGetFluteTypes.mockImplementation(() => new Promise(() => {}));
      render(<FluteTypes />);
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter by code', async () => {
      render(<FluteTypes />);
      await waitFor(() => {
        expect(screen.getByText('FT-001')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search flute types...');
      fireEvent.change(searchInput, { target: { value: 'FT-001' } });

      await waitFor(() => {
        expect(screen.getByText('FT-001')).toBeInTheDocument();
        expect(screen.queryByText('FT-002')).not.toBeInTheDocument();
      });
    });
  });

  describe('Create Modal', () => {
    it('should open create modal', async () => {
      render(<FluteTypes />);
      await waitFor(() => {
        expect(screen.getByText('Add Flute Type')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Add Flute Type'));
      expect(screen.getByTestId('create-modal')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no data', async () => {
      mockGetFluteTypes.mockResolvedValue(createMockPaginatedResponse([]));
      render(<FluteTypes />);
      await waitFor(() => {
        expect(screen.getByText('No flute types found')).toBeInTheDocument();
      });
    });
  });
});
