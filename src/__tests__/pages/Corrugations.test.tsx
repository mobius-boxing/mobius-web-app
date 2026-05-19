import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Corrugations from '../../pages/Corrugations';
import { createMockCorrugation, createMockPaginatedResponse } from '../../test-utils/api.mock';

const mockGetCorrugations = jest.fn();
const mockDeleteCorrugation = jest.fn();

jest.mock('../../services/api', () => ({
  corrugationsApi: {
    getCorrugations: () => mockGetCorrugations(),
    deleteCorrugation: (...args: any[]) => mockDeleteCorrugation(...args),
  },
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/corrugations', state: null }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'corrugations.title': 'Corrugations',
        'corrugations.subtitle': 'Manage corrugation types',
        'corrugations.addCorrugation': 'Add Corrugation',
        'corrugations.allCorrugations': 'All Corrugations',
        'corrugations.searchPlaceholder': 'Search corrugations...',
        'corrugations.columns.code': 'Code',
        'corrugations.columns.description': 'Description',
        'corrugations.columns.grammage': 'Grammage',
        'corrugations.columns.class': 'Class',
        'corrugations.columns.created': 'Created',
        'corrugations.columns.actions': 'Actions',
        'corrugations.deleteConfirm.title': 'Delete Corrugation',
        'corrugations.deleteConfirm.message': 'Are you sure you want to delete this corrugation?',
        'corrugations.empty.title': 'No corrugations found',
        'corrugations.empty.description': 'No results match your search',
        'corrugations.empty.noData': 'Get started by creating your first corrugation',
        'common.confirm': 'Confirm',
        'common.delete': 'Delete',
        'common.cancel': 'Cancel',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('../../components/layout/Layout', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));

jest.mock('../../components/modals/CreateCorrugationModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSuccess }: any) =>
    isOpen ? (
      <div data-testid="create-corrugation-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Create</button>
      </div>
    ) : null,
}));

jest.mock('../../components/modals/EditCorrugationModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSuccess }: any) =>
    isOpen ? (
      <div data-testid="edit-corrugation-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Save</button>
      </div>
    ) : null,
}));

const mockCorrugations = [
  createMockCorrugation({ uuid: 'corr-1', code: 'CORR-001', description: 'Standard Corrugation' }),
  createMockCorrugation({ uuid: 'corr-2', code: 'CORR-002', description: 'Heavy Duty Corrugation' }),
  createMockCorrugation({ uuid: 'corr-3', code: 'CORR-003', description: 'Lightweight Type' }),
];

describe('Corrugations Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCorrugations.mockResolvedValue(createMockPaginatedResponse(mockCorrugations));
  });

  describe('Rendering', () => {
    it('should render page title', async () => {
      render(<Corrugations />);

      await waitFor(() => {
        expect(screen.getByText('Corrugations')).toBeInTheDocument();
      });
    });

    it('should render add button', async () => {
      render(<Corrugations />);

      await waitFor(() => {
        expect(screen.getByText('Add Corrugation')).toBeInTheDocument();
      });
    });

    it('should render search input', async () => {
      render(<Corrugations />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search corrugations...')).toBeInTheDocument();
      });
    });
  });

  describe('Data Loading', () => {
    it('should fetch corrugations on mount', async () => {
      render(<Corrugations />);

      await waitFor(() => {
        expect(mockGetCorrugations).toHaveBeenCalled();
      });
    });

    it('should display corrugations in table', async () => {
      render(<Corrugations />);

      await waitFor(() => {
        expect(screen.getByText('CORR-001')).toBeInTheDocument();
        expect(screen.getByText('CORR-002')).toBeInTheDocument();
      });
    });

    it('should show loading state', () => {
      mockGetCorrugations.mockImplementation(() => new Promise(() => {}));
      render(<Corrugations />);

      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter corrugations by code', async () => {
      render(<Corrugations />);

      await waitFor(() => {
        expect(screen.getByText('CORR-001')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search corrugations...');
      fireEvent.change(searchInput, { target: { value: 'CORR-001' } });

      await waitFor(() => {
        expect(screen.getByText('CORR-001')).toBeInTheDocument();
        expect(screen.queryByText('CORR-002')).not.toBeInTheDocument();
      });
    });

    it('should filter corrugations by description', async () => {
      render(<Corrugations />);

      await waitFor(() => {
        expect(screen.getByText('CORR-001')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search corrugations...');
      fireEvent.change(searchInput, { target: { value: 'Heavy' } });

      await waitFor(() => {
        expect(screen.getByText('CORR-002')).toBeInTheDocument();
        expect(screen.queryByText('CORR-001')).not.toBeInTheDocument();
      });
    });
  });

  describe('Create Modal', () => {
    it('should open create modal when clicking add button', async () => {
      render(<Corrugations />);

      await waitFor(() => {
        expect(screen.getByText('Add Corrugation')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Add Corrugation'));

      expect(screen.getByTestId('create-corrugation-modal')).toBeInTheDocument();
    });

    it('should refresh data on create success', async () => {
      render(<Corrugations />);

      await waitFor(() => {
        expect(screen.getByText('Add Corrugation')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Add Corrugation'));
      fireEvent.click(screen.getByText('Create'));

      await waitFor(() => {
        expect(mockGetCorrugations).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no corrugations', async () => {
      mockGetCorrugations.mockResolvedValue(createMockPaginatedResponse([]));
      render(<Corrugations />);

      await waitFor(() => {
        expect(screen.getByText('No corrugations found')).toBeInTheDocument();
      });
    });
  });
});
