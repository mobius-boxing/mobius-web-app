import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SalesOrders from '../../pages/SalesOrders';

/**
 * The pedido grid — AC-30..AC-36 of sales-order-list.
 *
 * Two things this file exists to pin down:
 *  - the list HIDES fulfilled and voided pedidos by default, by SENDING
 *    `fulfilled=false&voided=false`, and a checkbox switches the list rather
 *    than widening it (parity-critical, PedidoRepository.cs:89-97);
 *  - one user action ⇒ exactly one API request, and the grid renders what the
 *    server returned (no client-side re-filtering).
 *
 * `t` is mocked to `##<key>##`, so any hardcoded user-facing literal in the
 * page components shows up as a non-`##…##` string (AC-35).
 */
const mockGetSalesOrders = jest.fn();
const mockDeleteSalesOrder = jest.fn();
const mockGetCustomers = jest.fn();
const mockGetProducts = jest.fn();
const mockGetParts = jest.fn();
const mockGetPaperSheets = jest.fn();
const mockNavigate = jest.fn();
let mockHas: (code: string) => boolean = () => true;

jest.mock('../../services/api', () => ({
  salesOrdersApi: {
    getSalesOrders: (...args: any[]) => mockGetSalesOrders(...args),
    deleteSalesOrder: (...args: any[]) => mockDeleteSalesOrder(...args),
    setFulfillment: jest.fn(),
    setVoid: jest.fn(),
  },
  customersApi: { getCustomers: (...args: any[]) => mockGetCustomers(...args) },
  productsApi: { getProducts: (...args: any[]) => mockGetProducts(...args) },
  partsApi: { getParts: (...args: any[]) => mockGetParts(...args) },
  paperSheetsApi: {
    getPaperSheets: (...args: any[]) => mockGetPaperSheets(...args),
  },
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/sales-orders', state: null }),
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

jest.mock('../../hooks/useEffectiveCompany', () => ({
  __esModule: true,
  default: () => ({ effectiveCompanyId: undefined }),
}));

jest.mock('../../hooks/usePermissions', () => ({
  usePermissions: () => ({ has: (code: string) => mockHas(code) }),
}));

const PRODUCT_UUID = 'prod-uuid-1';
const PART_UUID = 'part-uuid-1';
const SHEET_UUID = 'sheet-uuid-1';

const openOrder = {
  uuid: 'so-1',
  number: '00000001',
  quantity: 100,
  price: 12.5,
  purchaseOrder: 'OC-1',
  supplierCode: 'SUP-1',
  itemDescription: 'Producto: P-1 - Caja regular - Revisión: 3',
  createdAt: '2026-03-01T00:00:00.000Z',
  deliveryDate: '2026-03-10T00:00:00.000Z',
  customer: { uuid: 'cu-1', name: 'Cliente Uno' },
  salesUser: { uuid: 'us-1', name: 'Vendedor Uno' },
  commercialApprovedAt: '2026-03-02T00:00:00.000Z',
  financialApprovedAt: null,
  needsAdvanceInvoice: true,
  invoiceSent: false,
  fulfilledAt: null,
  voidedAt: null,
  fulfilled: false,
  voided: false,
};

const fulfilledOrder = {
  ...openOrder,
  uuid: 'so-2',
  number: '00000002',
  itemDescription: 'Parte: PT-1 - Tapa - Revisión: 1',
  fulfilledAt: '2026-03-05T00:00:00.000Z',
  fulfilled: true,
  price: 99,
};

const page = (data: any[]) => ({
  data,
  total: data.length,
  page: 1,
  limit: 20,
  totalPages: 1,
});

/** The params of the Nth `getSalesOrders` call. */
const paramsOf = (index: number) => mockGetSalesOrders.mock.calls[index][0];
const lastParams = () => paramsOf(mockGetSalesOrders.mock.calls.length - 1);

beforeEach(() => {
  jest.clearAllMocks();
  mockHas = () => true;
  // The server decides what comes back; the mock mirrors the flags it is sent.
  mockGetSalesOrders.mockImplementation(async (params: any) =>
    page(params?.fulfilled === 'true' ? [fulfilledOrder] : [openOrder]),
  );
  mockGetCustomers.mockResolvedValue(
    page([{ uuid: 'cu-1', name: 'Cliente Uno' }]),
  );
  mockGetProducts.mockResolvedValue(
    page([{ uuid: PRODUCT_UUID, code: 'P-1', description: 'Caja' }]),
  );
  mockGetParts.mockResolvedValue(
    page([{ uuid: PART_UUID, code: 'PT-1', description: 'Tapa' }]),
  );
  mockGetPaperSheets.mockResolvedValue(
    page([{ uuid: SHEET_UUID, code: 'PL-1', name: 'Plancha B' }]),
  );
});

const renderGrid = async () => {
  render(<SalesOrders />);
  await waitFor(() => expect(mockGetSalesOrders).toHaveBeenCalled());
  await screen.findByTestId('sales-orders-grid');
};

// ── AC-30 ────────────────────────────────────────────────────────────────────
describe('default visibility (AC-30)', () => {
  it('sends fulfilled=false and voided=false on the first request', async () => {
    await renderGrid();

    expect(paramsOf(0)).toMatchObject({
      fulfilled: 'false',
      voided: 'false',
      page: 1,
    });
    expect(await screen.findByText('00000001')).toBeInTheDocument();
    expect(screen.queryByText('00000002')).toBeNull();
  });

  it('switches the list to only-fulfilled when Cumplidos is checked', async () => {
    await renderGrid();
    const before = mockGetSalesOrders.mock.calls.length;

    fireEvent.click(screen.getByTestId('filter-fulfilled'));

    await waitFor(() =>
      expect(mockGetSalesOrders.mock.calls.length).toBe(before + 1),
    );
    expect(lastParams()).toMatchObject({ fulfilled: 'true', voided: 'false' });
    expect(await screen.findByText('00000002')).toBeInTheDocument();
    expect(screen.queryByText('00000001')).toBeNull();
  });
});

// ── AC-31 ────────────────────────────────────────────────────────────────────
describe('the exclusive producto/parte/plancha trio (AC-31)', () => {
  const chooseType = async (
    type: 'product' | 'part' | 'sheet',
    uuid: string,
  ) => {
    fireEvent.click(screen.getByTestId(`filter-type-${type}`));
    await waitFor(() =>
      expect(screen.getByTestId('filter-item')).not.toBeDisabled(),
    );
    fireEvent.change(screen.getByTestId('filter-item'), {
      target: { value: uuid },
    });
  };

  it('never sends two of the three, in any ordering', async () => {
    await renderGrid();

    await chooseType('part', PART_UUID);
    await waitFor(() => expect(lastParams().partUuid).toBe(PART_UUID));

    await chooseType('product', PRODUCT_UUID);
    await waitFor(() => expect(lastParams().productUuid).toBe(PRODUCT_UUID));
    expect(lastParams().partUuid).toBeUndefined();
    expect(lastParams().sheetSupplyUuid).toBeUndefined();

    await chooseType('sheet', SHEET_UUID);
    await waitFor(() =>
      expect(lastParams().sheetSupplyUuid).toBe(SHEET_UUID),
    );
    expect(lastParams().productUuid).toBeUndefined();
    expect(lastParams().partUuid).toBeUndefined();

    for (const call of mockGetSalesOrders.mock.calls) {
      const sent = ['productUuid', 'partUuid', 'sheetSupplyUuid'].filter(
        (key) => call[0][key],
      );
      expect(sent.length).toBeLessThanOrEqual(1);
    }
  });

  it('disables the entity selector until a type is picked', async () => {
    await renderGrid();

    expect(screen.getByTestId('filter-item')).toBeDisabled();
    fireEvent.click(screen.getByTestId('filter-type-part'));
    await waitFor(() =>
      expect(screen.getByTestId('filter-item')).not.toBeDisabled(),
    );
  });
});

// ── AC-32 ────────────────────────────────────────────────────────────────────
describe('Limpiar (AC-32)', () => {
  it('restores the mount-time state and page 1', async () => {
    await renderGrid();

    fireEvent.change(screen.getByTestId('filter-number'), {
      target: { value: '0042' },
    });
    fireEvent.click(screen.getByTestId('filter-voided'));
    fireEvent.click(screen.getByTestId('filter-without-orders'));
    fireEvent.change(screen.getByTestId('filter-delivery-from'), {
      target: { value: '2026-03-01' },
    });
    fireEvent.click(screen.getByTestId('filter-type-part'));
    await waitFor(() => expect(lastParams().number).toBe('0042'));

    fireEvent.click(screen.getByTestId('filter-clear'));

    await waitFor(() => expect(lastParams().number).toBeUndefined());
    expect(lastParams()).toMatchObject({
      fulfilled: 'false',
      voided: 'false',
      page: 1,
    });
    expect(lastParams().deliveryDateFrom).toBeUndefined();
    expect(lastParams().withoutProductionOrders).toBeUndefined();
    expect(screen.getByTestId('filter-number')).toHaveValue('');
    expect(screen.getByTestId('filter-voided')).not.toBeChecked();
    expect(screen.getByTestId('filter-fulfilled')).not.toBeChecked();
    expect(screen.getByTestId('filter-without-orders')).not.toBeChecked();
    expect(screen.getByTestId('filter-all-orders-fulfilled')).not.toBeChecked();
    expect(screen.getByTestId('filter-item')).toBeDisabled();
  });

  /**
   * `search` is NOT part of the filter object — it lives in `useEntityList`.
   * Restoring only the filters left the typed term in the box AND in every
   * later request, which is exactly what the case above could not see because
   * it never typed anything.
   */
  it('also clears the búsqueda box and stops sending it', async () => {
    await renderGrid();
    const searchBox = screen.getByPlaceholderText(
      '##salesOrders.searchPlaceholder##',
    );

    fireEvent.change(searchBox, { target: { value: 'caja' } });
    await waitFor(() => expect(lastParams().search).toBe('caja'));

    fireEvent.click(screen.getByTestId('filter-clear'));

    // The debounced search settles one request later; what matters is where it
    // settles — an empty box and no `search` on the wire.
    await waitFor(() => expect(lastParams().search).toBeUndefined());
    expect(searchBox).toHaveValue('');
    expect(lastParams()).toMatchObject({
      fulfilled: 'false',
      voided: 'false',
      page: 1,
    });

    const settled = mockGetSalesOrders.mock.calls.length;
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(mockGetSalesOrders).toHaveBeenCalledTimes(settled);
    expect(lastParams().search).toBeUndefined();
  });
});

// ── the delete action ────────────────────────────────────────────────────────
describe('deleting a pedido', () => {
  it('surfaces a failed delete instead of leaving the row silently in place', async () => {
    mockDeleteSalesOrder.mockRejectedValue({
      response: {
        data: { message: 'Insufficient permissions. Required: orders.delete' },
      },
    });
    await renderGrid();

    fireEvent.click(screen.getByTestId('delete-btn'));
    fireEvent.click(await screen.findByText('##confirmModal.confirm##'));

    expect(await screen.findByTestId('sales-orders-action-error')).toHaveTextContent(
      'Insufficient permissions. Required: orders.delete',
    );
  });

  it('leaves the button out of the DOM without orders.delete', async () => {
    mockHas = (code: string) => code !== 'orders.delete';
    await renderGrid();

    expect(screen.queryByTestId('delete-btn')).toBeNull();
  });
});

// ── business dates ───────────────────────────────────────────────────────────
describe('the F. entrega column', () => {
  /**
   * A calendar day stored in a timestamptz column: rendering it as an instant
   * shows the previous day to every user west of UTC.
   */
  it('renders the stored calendar day, not a timezone-shifted instant', async () => {
    await renderGrid();

    expect(await screen.findByTestId('order-delivery-date')).toHaveTextContent(
      '10/03/2026',
    );
  });
});

// ── AC-33 ────────────────────────────────────────────────────────────────────
describe('the Precio column (AC-33)', () => {
  it('renders header and cells for a holder of prices.visible', async () => {
    await renderGrid();

    expect(screen.getByText('##salesOrders.columns.price##')).toBeInTheDocument();
    expect(screen.getByTestId('order-price')).toHaveTextContent('12.5');
  });

  it('leaves both out of the DOM without the code', async () => {
    mockHas = (code: string) => code !== 'prices.visible';
    await renderGrid();

    expect(screen.queryByText('##salesOrders.columns.price##')).toBeNull();
    expect(screen.queryByTestId('order-price')).toBeNull();
  });
});

// ── AC-34 / AC-35 ────────────────────────────────────────────────────────────
describe('the rendered row (AC-34, AC-35)', () => {
  it('prints the server-built item description', async () => {
    await renderGrid();

    expect(await screen.findByTestId('order-item')).toHaveTextContent(
      'Producto: P-1 - Caja regular - Revisión: 3',
    );
  });

  it('takes every visible label from a salesOrders.* key', async () => {
    await renderGrid();

    for (const key of [
      'salesOrders.title',
      'salesOrders.columns.number',
      'salesOrders.columns.item',
      'salesOrders.columns.commercialApproved',
      'salesOrders.filters.number',
      'salesOrders.filters.fulfilled',
      'salesOrders.filters.withoutProductionOrders',
      'salesOrders.filters.clear',
    ]) {
      expect(screen.getByText(`##${key}##`)).toBeInTheDocument();
    }
  });
});

// ── AC-36 ────────────────────────────────────────────────────────────────────
describe('one action, one request (AC-36)', () => {
  it('issues exactly one call per page-size, page, sort and filter change', async () => {
    mockGetSalesOrders.mockImplementation(async () => ({
      ...page([openOrder, fulfilledOrder]),
      total: 40,
      totalPages: 2,
    }));
    await renderGrid();
    expect(mockGetSalesOrders).toHaveBeenCalledTimes(1);

    const step = async (act: () => void, expected: number) => {
      act();
      await waitFor(() =>
        expect(mockGetSalesOrders).toHaveBeenCalledTimes(expected),
      );
      // …and no straggler arrives afterwards.
      await new Promise((resolve) => setTimeout(resolve, 30));
      expect(mockGetSalesOrders).toHaveBeenCalledTimes(expected);
    };

    await step(
      () =>
        fireEvent.change(screen.getByDisplayValue('20'), {
          target: { value: '10' },
        }),
      2,
    );
    expect(lastParams().limit).toBe(10);

    await step(
      () => fireEvent.click(screen.getByText('##salesOrders.columns.number##')),
      3,
    );
    expect(lastParams().sortBy).toBe('number');

    await step(() => fireEvent.click(screen.getByTestId('filter-voided')), 4);
    expect(lastParams()).toMatchObject({ voided: 'true', page: 1 });

    await step(() => fireEvent.click(screen.getByTestId('filter-clear')), 5);
    expect(lastParams()).toMatchObject({ voided: 'false' });
  });

  it('renders exactly the rows the server returned', async () => {
    mockGetSalesOrders.mockResolvedValue(page([openOrder, fulfilledOrder]));
    await renderGrid();

    expect(await screen.findByText('00000002')).toBeInTheDocument();
    expect(screen.getByText('00000001')).toBeInTheDocument();
  });
});
