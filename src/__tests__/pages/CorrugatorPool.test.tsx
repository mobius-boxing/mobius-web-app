import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CorrugatorPool from '../../pages/CorrugatorPool';

const mockGetPool = jest.fn();
const mockGetMachines = jest.fn();
const mockCreatePlan = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../services/api', () => ({
  corrugatorPlansApi: {
    getPool: (...args: any[]) => mockGetPool(...args),
    createPlan: (...args: any[]) => mockCreatePlan(...args),
  },
  machinesApi: {
    getMachines: (...args: any[]) => mockGetMachines(...args),
  },
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, opts?: any) => (opts ? `${key}:${JSON.stringify(opts)}` : key) }),
}));

jest.mock('../../components/layout/Layout', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uuid: 'user-1', role: 'admin', permissions: ['corrugator.plan'] },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

jest.mock('../../hooks/useEffectiveCompany', () => ({
  __esModule: true,
  default: () => ({ effectiveCompanyId: undefined }),
  useEffectiveCompany: () => ({ effectiveCompanyId: undefined }),
}));

const POOL = {
  groups: [
    {
      board: {
        key: '1:L:KL:-',
        corrugations: [{ uuid: 'c-1', code: 'C-512' }],
        fluteTypes: ['C'],
        paperClasses: [{ code: 'KL', name: 'Kraft liner' }],
        theoreticalGrammage: 512,
      },
      orders: [
        {
          productionOrder: { uuid: 'po-1', number: 'OP-2211' },
          customer: { uuid: 'cu-1', name: 'Frutas SA' },
          product: { uuid: 'pr-1', code: 'CJ-40', description: 'Caja 40x30' },
          deliveryDate: '2026-10-02T00:00:00.000Z',
          sheetLength: 1180,
          sheetWidth: 800,
          allowsRotation: true,
          orderQuantity: 5000,
          sheetsPerUnit: 1,
          sheetsSource: 'quantity',
          requiredSheets: 5000,
          allocatedSheets: 0,
          pendingSheets: 5000,
          inPlans: [],
        },
      ],
    },
  ],
  notPlannable: [
    {
      productionOrder: { uuid: 'po-2', number: 'OP-2190' },
      reason: 'no-sheet-dimensions',
      detail: 'El producto CJ-12 no tiene largo/ancho de plancha',
    },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetPool.mockResolvedValue(POOL);
  mockGetMachines.mockResolvedValue({ data: [], total: 0, page: 1, limit: 100, totalPages: 1 });
});

describe('CorrugatorPool page (AC-1, AC-10)', () => {
  it('renders board groups with order rows and the sheets-source warning chip', async () => {
    render(<CorrugatorPool />);

    expect(await screen.findByTestId('corrugator-pool-group')).toBeInTheDocument();
    expect(screen.getByText('OP-2211')).toBeInTheDocument();
    expect(screen.getByText('Frutas SA')).toBeInTheDocument();
    expect(screen.getByTestId('sheets-warning-chip')).toBeInTheDocument();
  });

  it('lists not-plannable orders with a translated reason, collapsed by default', async () => {
    render(<CorrugatorPool />);
    await screen.findByTestId('corrugator-pool-group');

    expect(screen.queryByText('OP-2190')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('not-plannable-toggle'));
    expect(await screen.findByText('OP-2190')).toBeInTheDocument();
  });

  it('enables "Crear programa" once an order is checked and opens the create modal', async () => {
    render(<CorrugatorPool />);
    await screen.findByTestId('corrugator-pool-group');

    const createBtn = screen.getByTestId('create-plan-btn');
    expect(createBtn).toBeDisabled();

    fireEvent.click(screen.getByTestId('pool-order-checkbox-po-1'));
    expect(createBtn).not.toBeDisabled();

    fireEvent.click(createBtn);
    expect(await screen.findByTestId('create-plan-name')).toBeInTheDocument();
  });

  it('re-fetches the pool when the search box changes', async () => {
    render(<CorrugatorPool />);
    await waitFor(() => expect(mockGetPool).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByTestId('corrugator-pool-search'), { target: { value: 'OP-22' } });

    await waitFor(() =>
      expect(mockGetPool).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'OP-22' })),
    );
  });
});
