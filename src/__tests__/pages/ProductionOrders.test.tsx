import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ProductionOrders from '../../pages/ProductionOrders';

const mockGetProductionOrders = jest.fn();
const mockGetSalesOrders = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uuid: 'user-1', role: 'admin', permissions: [] },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

jest.mock('../../services/api', () => ({
  productionOrdersApi: {
    getProductionOrders: (...args: any[]) => mockGetProductionOrders(...args),
    deleteProductionOrder: jest.fn(),
    getGenerationEligibility: jest.fn(),
    generate: jest.fn(),
    lifecycle: jest.fn(),
  },
  salesOrdersApi: {
    getSalesOrders: (...args: any[]) => mockGetSalesOrders(...args),
  },
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/production-orders', state: null }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('../../components/layout/Layout', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));

jest.mock('../../hooks/useEffectiveCompany', () => ({
  __esModule: true,
  default: () => ({ effectiveCompanyId: undefined }),
}));

const orders = [
  {
    uuid: 'op-1',
    number: '00014091\\1',
    quantity: 100,
    orderDate: '2026-08-20T00:00:00.000Z',
    deliveryDate: '2030-01-01T00:00:00.000Z',
    schedulingApprovedAt: '2026-08-20T00:00:00.000Z',
    completedAt: null,
    salesOrder: { uuid: 'so-1', number: '00014091' },
    customer: { uuid: 'cu-1', name: 'Cliente Uno' },
    product: { uuid: 'pr-1', code: 'PRD-1' },
    part: { uuid: 'pa-1', description: 'parte uno' },
  },
  {
    uuid: 'op-2',
    number: '00014091\\2',
    quantity: 200,
    orderDate: '2026-08-20T00:00:00.000Z',
    deliveryDate: null,
    schedulingApprovedAt: null,
    completedAt: '2026-08-21T00:00:00.000Z',
    salesOrder: { uuid: 'so-1', number: '00014091' },
    customer: { uuid: 'cu-1', name: 'Cliente Uno' },
    product: { uuid: 'pr-1', code: 'PRD-1' },
    part: { uuid: 'pa-1', description: 'parte uno' },
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockGetProductionOrders.mockResolvedValue({
    data: orders,
    total: 2,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  mockGetSalesOrders.mockResolvedValue({
    data: [{ uuid: 'so-1', number: '00014091' }],
    total: 1,
    page: 1,
    limit: 100,
    totalPages: 1,
  });
});

describe('ProductionOrders page (AC-29)', () => {
  it('renders the page shell and a populated grid', async () => {
    render(<ProductionOrders />);

    expect(screen.getByText('productionOrders.title')).toBeInTheDocument();
    expect(screen.getByText('productionOrders.subtitle')).toBeInTheDocument();

    expect(
      await screen.findByTestId('open-production-order-op-1'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('open-production-order-op-2')).toBeInTheDocument();
    expect(screen.getAllByText('Cliente Uno').length).toBeGreaterThan(0);
    expect(screen.getAllByText('PRD-1').length).toBeGreaterThan(0);
  });

  it('ships the filter controls the list endpoint documents', async () => {
    render(<ProductionOrders />);

    expect(
      await screen.findByTestId('filter-scheduling-state'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('filter-completion-state')).toBeInTheDocument();
    expect(screen.getByTestId('filter-void-state')).toBeInTheDocument();
    expect(screen.getByTestId('filter-delivery-from')).toBeInTheDocument();
    expect(screen.getByTestId('filter-delivery-to')).toBeInTheDocument();
  });

  it('asks the API for the first page on mount', async () => {
    render(<ProductionOrders />);

    await waitFor(() => expect(mockGetProductionOrders).toHaveBeenCalled());
    expect(mockGetProductionOrders.mock.calls[0][0]).toMatchObject({
      page: 1,
      limit: 20,
    });
  });
});

// ── business dates ───────────────────────────────────────────────────────────
describe('the Fecha and F. entrega columns', () => {
  /**
   * `orderDate` and `deliveryDate` are calendar days that happen to live in
   * timestamptz columns: rendering them as instants shows the PREVIOUS day to
   * every user west of UTC. The assertion is on the zero-padded dd/MM/yyyy
   * `formatBusinessDate` prints, so it holds in any timezone and any locale.
   */
  it('renders the stored calendar days, not timezone-shifted instants', async () => {
    render(<ProductionOrders />);

    const orderDates = await screen.findAllByTestId('order-date');
    expect(orderDates[0]).toHaveTextContent('20/08/2026');

    const deliveryDates = screen.getAllByTestId('order-delivery-date');
    expect(deliveryDates[0]).toHaveTextContent('01/01/2030');
    expect(deliveryDates[1]).toHaveTextContent('-');
  });
});

// ── filters ──────────────────────────────────────────────────────────────────
describe('the filter bar', () => {
  /**
   * The filters used to live in five `useState` hooks with a manual
   * `refresh()` effect, which refetched at whatever page the user was on.
   * Narrowing the set from page 2 then returned an empty grid: the server had
   * one page of results and was being asked for the second. The whole filter
   * object now flows through `useEntityList.setFilters`, which resets the page.
   */
  it('resets to page 1 when a filter changes', async () => {
    mockGetProductionOrders.mockResolvedValue({
      data: orders,
      total: 50,
      page: 2,
      limit: 20,
      totalPages: 3,
    });

    render(<ProductionOrders />);
    await waitFor(() => expect(mockGetProductionOrders).toHaveBeenCalled());

    // Walk to page 2 and confirm the API really was asked for it.
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    await waitFor(() =>
      expect(mockGetProductionOrders).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 }),
      ),
    );

    const beforeFilter = mockGetProductionOrders.mock.calls.length;

    fireEvent.change(screen.getByTestId('filter-scheduling-state'), {
      target: { value: 'enabled' },
    });

    await waitFor(() =>
      expect(mockGetProductionOrders.mock.calls.length).toBeGreaterThan(
        beforeFilter,
      ),
    );

    const last = mockGetProductionOrders.mock.calls.at(-1)![0];
    expect(last).toMatchObject({ page: 1, schedulingState: 'enabled' });
  });

  it('sends each filter through to the list endpoint', async () => {
    render(<ProductionOrders />);
    await waitFor(() => expect(mockGetProductionOrders).toHaveBeenCalled());

    fireEvent.change(screen.getByTestId('filter-completion-state'), {
      target: { value: 'completed' },
    });
    fireEvent.change(screen.getByTestId('filter-delivery-from'), {
      target: { value: '2026-08-01' },
    });

    await waitFor(() =>
      expect(mockGetProductionOrders).toHaveBeenLastCalledWith(
        expect.objectContaining({
          completionState: 'completed',
          deliveryDateFrom: '2026-08-01',
        }),
      ),
    );
  });

  it('Limpiar drops every filter and is inert until one is set', async () => {
    render(<ProductionOrders />);
    await waitFor(() => expect(mockGetProductionOrders).toHaveBeenCalled());

    const clear = screen.getByTestId('filter-clear');
    expect(clear).toBeDisabled();

    fireEvent.change(screen.getByTestId('filter-void-state'), {
      target: { value: 'voided' },
    });
    await waitFor(() => expect(clear).not.toBeDisabled());

    fireEvent.click(clear);

    await waitFor(() =>
      expect(mockGetProductionOrders).toHaveBeenLastCalledWith(
        expect.not.objectContaining({ voidState: 'voided' }),
      ),
    );
    expect(screen.getByTestId('filter-void-state')).toHaveValue('');
  });
});
