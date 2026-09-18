import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { renderWithProviders as render } from '../../test-utils/renderWithProviders';
import BoxTypes from '../../pages/BoxTypes';
import { createMockPaginatedResponse } from '../../test-utils/api.mock';

const mockGetBoxTypes = jest.fn();
const mockDeleteBoxType = jest.fn();

jest.mock('../../contexts/AuthContext', () =>
  require('../../test-utils/renderWithProviders').authContextMock()
);

jest.mock('../../services/api', () => ({
  boxTypesApi: {
    getBoxTypes: (...args: any[]) => mockGetBoxTypes(...args),
    deleteBoxType: (...args: any[]) => mockDeleteBoxType(...args),
  },
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/box-types', state: null }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'boxTypes.title': 'Box Types',
        'boxTypes.subtitle': 'Manage box type catalog',
        'boxTypes.addBoxType': 'Add Box Type',
        'boxTypes.allBoxTypes': 'All Box Types',
        'boxTypes.searchPlaceholder': 'Search box types...',
        'boxTypes.columns.code': 'Code',
        'boxTypes.columns.name': 'Name',
        'boxTypes.columns.created': 'Created',
        'boxTypes.columns.actions': 'Actions',
        'boxTypes.empty.title': 'No box types found',
        'boxTypes.empty.description': 'No results match your search',
        'boxTypes.empty.noData': 'Get started by creating your first box type',
        'filters.advanced': 'Advanced filters',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('../../components/layout/Layout', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));

jest.mock('../../components/modals/CreateBoxTypeModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSuccess }: any) =>
    isOpen ? (
      <div data-testid="create-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Create</button>
      </div>
    ) : null,
}));

jest.mock('../../components/modals/EditBoxTypeModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSuccess }: any) =>
    isOpen ? (
      <div data-testid="edit-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Save</button>
      </div>
    ) : null,
}));

const mockBoxTypes = [
  { uuid: 'bt-1', code: 'BX-001', name: 'Small Box', createdAt: '2024-01-01T00:00:00.000Z' },
  { uuid: 'bt-2', code: 'BX-002', name: 'Large Box', createdAt: '2024-02-01T00:00:00.000Z' },
];

describe('BoxTypes Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetBoxTypes.mockResolvedValue(createMockPaginatedResponse(mockBoxTypes));
  });

  describe('Rendering', () => {
    it('should render page title', async () => {
      render(<BoxTypes />);
      await waitFor(() => {
        expect(screen.getByText('Box Types')).toBeInTheDocument();
      });
    });

    it('should display data in table', async () => {
      render(<BoxTypes />);
      await waitFor(() => {
        expect(screen.getByText('BX-001')).toBeInTheDocument();
      });
    });
  });

  describe('Advanced filters (AC-2/3, AC-5)', () => {
    it('sends createdAtFrom once a date is set in the advanced panel', async () => {
      render(<BoxTypes />);
      await waitFor(() => {
        expect(screen.getByText('BX-001')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Advanced filters/i }));

      const dateInputs = document.querySelectorAll('input[type="date"]');
      expect(dateInputs.length).toBe(2); // createdAtFrom, createdAtTo

      fireEvent.change(dateInputs[0], { target: { value: '2026-03-10' } });

      await waitFor(() => {
        expect(mockGetBoxTypes).toHaveBeenLastCalledWith(
          expect.objectContaining({ createdAtFrom: '2026-03-10' })
        );
      });
    });

    it('shows a badge counting advanced values and clears them without touching search', async () => {
      render(<BoxTypes />);
      await waitFor(() => {
        expect(screen.getByText('BX-001')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search box types...');
      fireEvent.change(searchInput, { target: { value: 'BX' } });

      const advancedToggle = screen.getByRole('button', { name: /Advanced filters/i });
      fireEvent.click(advancedToggle);
      const dateInputs = document.querySelectorAll('input[type="date"]');
      fireEvent.change(dateInputs[0], { target: { value: '2026-03-10' } });

      await waitFor(() => {
        expect(within(advancedToggle).getByText('1')).toBeInTheDocument(); // badge count
      });

      fireEvent.click(screen.getByText('filters.clear'));

      await waitFor(() => {
        expect((dateInputs[0] as HTMLInputElement).value).toBe('');
      });
      expect((searchInput as HTMLInputElement).value).toBe('BX');
    });
  });
});
