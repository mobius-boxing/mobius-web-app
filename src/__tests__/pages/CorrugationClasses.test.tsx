import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CorrugationClasses from '../../pages/CorrugationClasses';
import { createMockCorrugationClass, createMockPaginatedResponse } from '../../test-utils/api.mock';

const mockGetCorrugationClasses = jest.fn();
const mockDeleteCorrugationClass = jest.fn();

jest.mock('../../services/api', () => ({
  corrugationClassesApi: {
    getCorrugationClasses: () => mockGetCorrugationClasses(),
    deleteCorrugationClass: (...args: any[]) => mockDeleteCorrugationClass(...args),
  },
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/corrugation-classes', state: null }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'corrugationClasses.title': 'Corrugation Classes',
        'corrugationClasses.subtitle': 'Manage corrugation class types',
        'corrugationClasses.addClass': 'Add Class',
        'corrugationClasses.allClasses': 'All Classes',
        'corrugationClasses.searchPlaceholder': 'Search classes...',
        'corrugationClasses.columns.code': 'Code',
        'corrugationClasses.columns.description': 'Description',
        'corrugationClasses.columns.created': 'Created',
        'corrugationClasses.columns.actions': 'Actions',
        'corrugationClasses.empty.title': 'No corrugation classes found',
        'corrugationClasses.empty.description': 'No results match your search',
        'corrugationClasses.empty.noData': 'Get started by creating your first corrugation class',
        'corrugationClasses.deleteConfirm': 'Are you sure you want to delete this corrugation class?',
        'common.confirm': 'Confirm',
        'common.delete': 'Delete',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('../../components/layout/Layout', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));

jest.mock('../../components/modals/CreateCorrugationClassModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSuccess }: any) =>
    isOpen ? (
      <div data-testid="create-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Create</button>
      </div>
    ) : null,
}));

jest.mock('../../components/modals/EditCorrugationClassModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSuccess }: any) =>
    isOpen ? (
      <div data-testid="edit-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Save</button>
      </div>
    ) : null,
}));

const mockCorrugationClasses = [
  createMockCorrugationClass({ uuid: 'cc-1', code: 'CC-001', description: 'Class A' }),
  createMockCorrugationClass({ uuid: 'cc-2', code: 'CC-002', description: 'Class B' }),
  createMockCorrugationClass({ uuid: 'cc-3', code: 'CC-003', description: 'Premium Class' }),
];

describe('CorrugationClasses Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCorrugationClasses.mockResolvedValue(createMockPaginatedResponse(mockCorrugationClasses));
  });

  describe('Rendering', () => {
    it('should render page title', async () => {
      render(<CorrugationClasses />);

      await waitFor(() => {
        expect(screen.getByText('Corrugation Classes')).toBeInTheDocument();
      });
    });

    it('should render add button', async () => {
      render(<CorrugationClasses />);

      await waitFor(() => {
        expect(screen.getByText('Add Class')).toBeInTheDocument();
      });
    });

    it('should render search input', async () => {
      render(<CorrugationClasses />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search classes...')).toBeInTheDocument();
      });
    });
  });

  describe('Data Loading', () => {
    it('should fetch data on mount', async () => {
      render(<CorrugationClasses />);

      await waitFor(() => {
        expect(mockGetCorrugationClasses).toHaveBeenCalled();
      });
    });

    it('should display data in table', async () => {
      render(<CorrugationClasses />);

      await waitFor(() => {
        expect(screen.getByText('CC-001')).toBeInTheDocument();
        expect(screen.getByText('CC-002')).toBeInTheDocument();
      });
    });

    it('should show loading state', () => {
      mockGetCorrugationClasses.mockImplementation(() => new Promise(() => {}));
      render(<CorrugationClasses />);

      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter by code', async () => {
      render(<CorrugationClasses />);

      await waitFor(() => {
        expect(screen.getByText('CC-001')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search classes...');
      fireEvent.change(searchInput, { target: { value: 'CC-001' } });

      await waitFor(() => {
        expect(screen.getByText('CC-001')).toBeInTheDocument();
        expect(screen.queryByText('CC-002')).not.toBeInTheDocument();
      });
    });

    it('should filter by description', async () => {
      render(<CorrugationClasses />);

      await waitFor(() => {
        expect(screen.getByText('CC-001')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search classes...');
      fireEvent.change(searchInput, { target: { value: 'Premium' } });

      await waitFor(() => {
        expect(screen.getByText('CC-003')).toBeInTheDocument();
        expect(screen.queryByText('CC-001')).not.toBeInTheDocument();
      });
    });
  });

  describe('Create Modal', () => {
    it('should open create modal', async () => {
      render(<CorrugationClasses />);

      await waitFor(() => {
        expect(screen.getByText('Add Class')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Add Class'));

      expect(screen.getByTestId('create-modal')).toBeInTheDocument();
    });

    it('should refresh data on create success', async () => {
      render(<CorrugationClasses />);

      await waitFor(() => {
        expect(screen.getByText('Add Class')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Add Class'));
      fireEvent.click(screen.getByText('Create'));

      await waitFor(() => {
        expect(mockGetCorrugationClasses).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no data', async () => {
      mockGetCorrugationClasses.mockResolvedValue(createMockPaginatedResponse([]));
      render(<CorrugationClasses />);

      await waitFor(() => {
        expect(screen.getByText('No corrugation classes found')).toBeInTheDocument();
      });
    });
  });
});
