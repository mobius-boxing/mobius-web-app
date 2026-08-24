import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import SalesOrderProductionOrders from '../../pages/SalesOrderProductionOrders';

/**
 * Órdenes asociadas al pedido — AC-26 and AC-35 of sales-order-list.
 *
 * The screen is READ-ONLY (PLS parity): ten columns, a back link, and no edit
 * or delete control anywhere. `t` is mocked to `##<key>##` so a hardcoded
 * user-facing literal would stand out.
 */
const mockGetAssociated = jest.fn();
const mockGetSalesOrder = jest.fn();

jest.mock('../../services/api', () => ({
  salesOrdersApi: {
    getAssociatedProductionOrders: (...args: any[]) =>
      mockGetAssociated(...args),
    getSalesOrder: (...args: any[]) => mockGetSalesOrder(...args),
  },
}));

jest.mock('react-router-dom', () => ({
  useParams: () => ({ uuid: 'so-1' }),
  useLocation: () => ({ pathname: '/sales-orders/so-1/production-orders' }),
  Link: ({ to, children, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => `##${key}##` }),
}));

jest.mock('../../components/layout/Layout', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));

const COLUMN_KEYS = [
  'number',
  'customer',
  'part',
  'description',
  'quantity',
  'orderDate',
  'deliveryDate',
  'schedulingApproved',
  'completed',
  'voided',
];

const row = {
  uuid: 'op-1',
  number: '00000042\\1',
  orderDate: '2026-03-01T00:00:00.000Z',
  deliveryDate: '2026-03-20T00:00:00.000Z',
  quantity: 500,
  part: { uuid: 'pa-1', code: 'PT-1', description: 'Tapa reforzada' },
  customer: { uuid: 'cu-1', name: 'Cliente Uno' },
  schedulingApprovedAt: '2026-03-02T00:00:00.000Z',
  completedAt: null,
  voidedAt: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetSalesOrder.mockResolvedValue({ uuid: 'so-1', number: '00000042' });
  mockGetAssociated.mockResolvedValue({
    data: [row],
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
});

describe('the associated production orders page (AC-25, AC-35)', () => {
  it('renders the ten columns in order, from i18n keys', async () => {
    render(<SalesOrderProductionOrders />);

    await screen.findByText('PT-1');
    const headers = screen
      .getAllByRole('columnheader')
      .map((cell) => cell.textContent);
    expect(headers).toEqual(
      COLUMN_KEYS.map(
        (key) => `##salesOrders.associatedOrders.columns.${key}##`,
      ),
    );
  });

  it('prints the row through the pedido-scoped endpoint', async () => {
    render(<SalesOrderProductionOrders />);

    await screen.findByText('00000042\\1');
    expect(mockGetAssociated).toHaveBeenCalledWith('so-1', {
      page: 1,
      limit: 20,
    });
    expect(screen.getByText('Cliente Uno')).toBeInTheDocument();
    expect(screen.getByText('Tapa reforzada')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByTestId('op-tick-scheduling')).toBeInTheDocument();
    expect(screen.queryByTestId('op-tick-completed')).toBeNull();
  });

  it('offers a back link and no edit or delete control (PLS parity)', async () => {
    render(<SalesOrderProductionOrders />);

    await screen.findByText('PT-1');
    expect(screen.getByTestId('back-to-sales-orders')).toHaveAttribute(
      'href',
      '/sales-orders',
    );
    expect(screen.queryByTestId('edit-btn')).toBeNull();
    expect(screen.queryByTestId('delete-btn')).toBeNull();
  });

  it('shows the empty state for a pedido with no orders (AC-26)', async () => {
    mockGetAssociated.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
    render(<SalesOrderProductionOrders />);

    expect(await screen.findByTestId('associated-orders-empty')).toHaveTextContent(
      '##salesOrders.associatedOrders.empty##',
    );
  });

  it('renders the business dates as the calendar day they carry', async () => {
    render(<SalesOrderProductionOrders />);

    await screen.findByText('PT-1');
    // Instant-formatting a timestamptz business date shows the previous day to
    // every user west of UTC.
    expect(screen.getByTestId('op-order-date')).toHaveTextContent('01/03/2026');
    expect(screen.getByTestId('op-delivery-date')).toHaveTextContent(
      '20/03/2026',
    );
  });

  it('shows the API message when the read fails', async () => {
    mockGetAssociated.mockRejectedValue({
      response: { data: { message: 'Sales order not found' } },
    });
    render(<SalesOrderProductionOrders />);

    expect(await screen.findByTestId('associated-orders-error')).toHaveTextContent(
      'Sales order not found',
    );
  });

  /** A 404 used to render the error banner AND the empty state together. */
  it('does not claim the pedido has no orders when the read failed', async () => {
    mockGetAssociated.mockRejectedValue({
      response: { status: 404, data: { message: 'Sales order not found' } },
    });
    render(<SalesOrderProductionOrders />);

    await screen.findByTestId('associated-orders-error');
    expect(screen.queryByTestId('associated-orders-empty')).toBeNull();
  });

  it('falls back to the i18n error key when the failure carries no message', async () => {
    mockGetAssociated.mockRejectedValue(new Error('network'));
    render(<SalesOrderProductionOrders />);

    await waitFor(() =>
      expect(screen.getByTestId('associated-orders-error')).toHaveTextContent(
        '##salesOrders.associatedOrders.error##',
      ),
    );
  });
});
