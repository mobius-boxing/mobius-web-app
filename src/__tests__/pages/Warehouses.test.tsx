/**
 * Warehouses Page Unit Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Warehouses from '../../pages/Warehouses';
import { createMockWarehouse, createMockPaginatedResponse } from '../../test-utils/api.mock';

const mockGetWarehouses = jest.fn();
const mockDeleteWarehouse = jest.fn();

jest.mock('../../services/api', () => ({
  warehousesApi: {
    getWarehouses: () => mockGetWarehouses(),
    deleteWarehouse: (...args: any[]) => mockDeleteWarehouse(...args),
  },
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/warehouses', state: null }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'warehouses.title': 'Warehouses',
        'warehouses.subtitle': 'Manage warehouse locations',
        'warehouses.addWarehouse': 'Add Warehouse',
        'warehouses.allWarehouses': 'All Warehouses',
        'warehouses.searchPlaceholder': 'Search warehouses...',
        'warehouses.columns.name': 'Name',
        'warehouses.columns.gridRows': 'Rows',
        'warehouses.columns.gridCols': 'Columns',
        'warehouses.columns.created': 'Created',
        'warehouses.columns.actions': 'Actions',
        'warehouses.empty.title': 'No warehouses found',
        'warehouses.empty.description': 'No results match your search',
        'warehouses.empty.noData': 'Get started by creating your first warehouse',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('../../components/layout/Layout', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));

jest.mock('../../components/modals/CreateWarehouseModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSuccess }: any) =>
    isOpen ? (
      <div data-testid="create-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Create</button>
      </div>
    ) : null,
}));

jest.mock('../../components/modals/EditWarehouseModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSuccess }: any) =>
    isOpen ? (
      <div data-testid="edit-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Save</button>
      </div>
    ) : null,
}));

const mockWarehouses = [
  createMockWarehouse({ uuid: 'wh-1', name: 'Main Warehouse', gridRows: 10, gridCols: 20 }),
  createMockWarehouse({ uuid: 'wh-2', name: 'Secondary Warehouse', gridRows: 5, gridCols: 10 }),
  createMockWarehouse({ uuid: 'wh-3', name: 'Distribution Center', gridRows: 15, gridCols: 25 }),
];

describe('Warehouses Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetWarehouses.mockResolvedValue(createMockPaginatedResponse(mockWarehouses));
  });

  describe('Rendering', () => {
    it('should render page title', async () => {
      render(<Warehouses />);
      await waitFor(() => {
        expect(screen.getByText('Warehouses')).toBeInTheDocument();
      });
    });

    it('should render add button', async () => {
      render(<Warehouses />);
      await waitFor(() => {
        expect(screen.getByText('Add Warehouse')).toBeInTheDocument();
      });
    });

    it('should render search input', async () => {
      render(<Warehouses />);
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search warehouses...')).toBeInTheDocument();
      });
    });
  });

  describe('Data Loading', () => {
    it('should fetch data on mount', async () => {
      render(<Warehouses />);
      await waitFor(() => {
        expect(mockGetWarehouses).toHaveBeenCalled();
      });
    });

    it('should display data in table', async () => {
      render(<Warehouses />);
      await waitFor(() => {
        expect(screen.getByText('Main Warehouse')).toBeInTheDocument();
        expect(screen.getByText('Secondary Warehouse')).toBeInTheDocument();
      });
    });

    it('should show loading state', () => {
      mockGetWarehouses.mockImplementation(() => new Promise(() => {}));
      render(<Warehouses />);
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter by name', async () => {
      render(<Warehouses />);
      await waitFor(() => {
        expect(screen.getByText('Main Warehouse')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search warehouses...');
      fireEvent.change(searchInput, { target: { value: 'Main' } });

      await waitFor(() => {
        expect(screen.getByText('Main Warehouse')).toBeInTheDocument();
        expect(screen.queryByText('Secondary Warehouse')).not.toBeInTheDocument();
      });
    });
  });

  describe('Create Modal', () => {
    it('should open create modal', async () => {
      render(<Warehouses />);
      await waitFor(() => {
        expect(screen.getByText('Add Warehouse')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Add Warehouse'));
      expect(screen.getByTestId('create-modal')).toBeInTheDocument();
    });

    it('should refresh data on create success', async () => {
      render(<Warehouses />);
      await waitFor(() => {
        expect(screen.getByText('Add Warehouse')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Add Warehouse'));
      fireEvent.click(screen.getByText('Create'));
      await waitFor(() => {
        expect(mockGetWarehouses).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no data', async () => {
      mockGetWarehouses.mockResolvedValue(createMockPaginatedResponse([]));
      render(<Warehouses />);
      await waitFor(() => {
        expect(screen.getByText('No warehouses found')).toBeInTheDocument();
      });
    });
  });
});
