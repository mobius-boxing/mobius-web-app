import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SalesOrderForm from '../../pages/SalesOrderForm';

/**
 * AC-21 / AC-23 — the cliente-first divergence (D-1) and the read-only edit
 * form.
 *
 * The producto dropdown must be UNUSABLE before a cliente is chosen and must
 * hold exactly that cliente's products afterwards: that is the whole point of
 * inverting Procusto's product-first flow. Switching cliente must clear the
 * chosen producto, or the form could submit a mismatched pair the API then
 * rejects.
 */
const CUSTOMER_A = 'cust-a-uuid';
const CUSTOMER_B = 'cust-b-uuid';
const PRODUCT_A1 = 'prod-a1-uuid';
const PRODUCT_A2 = 'prod-a2-uuid';
const PRODUCT_B1 = 'prod-b1-uuid';
const PART_A1 = 'part-a1-uuid';
const PART_B1 = 'part-b1-uuid';
const ORDER_UUID = 'order-uuid';

const mockGetProducts = jest.fn();
const mockGetParts = jest.fn();
const mockGetDeliveryLocations = jest.fn();
const mockGetSalesOrder = jest.fn();
const mockCreateSalesOrder = jest.fn();
const mockUpdateSalesOrder = jest.fn();
const mockNavigate = jest.fn();

// `mock`-prefixed so the jest.mock factory below may reference it.
let mockRouteParams: { uuid?: string } = {};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uuid: 'user-1', role: 'admin', permissions: [] },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

jest.mock('../../hooks/useEffectiveCompany', () => ({
  __esModule: true,
  default: () => ({
    effectiveCompanyId: undefined,
    isSuperAdmin: false,
    hasCompanySelected: true,
    selectedCompany: null,
  }),
}));

jest.mock('../../services/api', () => ({
  customersApi: {
    getCustomers: async () => ({
      data: [
        { uuid: 'cust-a-uuid', name: 'Cliente A' },
        { uuid: 'cust-b-uuid', name: 'Cliente B' },
      ],
      total: 2,
      page: 1,
      limit: 100,
      totalPages: 1,
    }),
  },
  usersApi: {
    getUsers: async () => ({
      data: [{ uuid: 'user-1', email: 'vendedor@acme.test', firstName: 'Ven', lastName: 'Dedor' }],
      total: 1,
      page: 1,
      limit: 100,
      totalPages: 1,
    }),
  },
  productsApi: { getProducts: (...args: any[]) => mockGetProducts(...args) },
  partsApi: { getParts: (...args: any[]) => mockGetParts(...args) },
  deliveryLocationsApi: {
    getDeliveryLocations: (...args: any[]) => mockGetDeliveryLocations(...args),
  },
  salesOrdersApi: {
    getSalesOrder: (...args: any[]) => mockGetSalesOrder(...args),
    createSalesOrder: (...args: any[]) => mockCreateSalesOrder(...args),
    updateSalesOrder: (...args: any[]) => mockUpdateSalesOrder(...args),
  },
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => mockRouteParams,
  useLocation: () => ({ pathname: '/sales-orders/new', state: null }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../components/layout/Layout', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));

const page = (limit: number, data: any[]) => ({
  data,
  total: data.length,
  page: 1,
  limit,
  totalPages: 1,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockRouteParams = {};
  mockGetProducts.mockImplementation(async (params: any) =>
    page(
      100,
      params.customerUuid === CUSTOMER_A
        ? [
            { uuid: PRODUCT_A1, code: 'P-A1', description: 'producto A1' },
            { uuid: PRODUCT_A2, code: 'P-A2', description: 'producto A2' },
          ]
        : [{ uuid: PRODUCT_B1, code: 'P-B1', description: 'producto B1' }],
    ),
  );
  mockGetDeliveryLocations.mockImplementation(async () => page(100, []));
  mockGetParts.mockImplementation(async () =>
    page(100, [
      {
        uuid: PART_A1,
        code: 'PT-A1',
        description: 'parte A1',
        product: {
          uuid: PRODUCT_A1,
          code: 'P-A1',
          description: 'producto A1',
          customer: { uuid: CUSTOMER_A, name: 'Cliente A' },
        },
      },
      {
        uuid: PART_B1,
        code: 'PT-B1',
        description: 'parte B1',
        product: {
          uuid: PRODUCT_B1,
          code: 'P-B1',
          description: 'producto B1',
          customer: { uuid: CUSTOMER_B, name: 'Cliente B' },
        },
      },
    ]),
  );
});

const optionValues = (testId: string) =>
  Array.from((screen.getByTestId(testId) as HTMLSelectElement).options).map(
    (option) => option.value,
  );

const productOptionValues = () => optionValues('product-select');

/**
 * Pick a cliente only once its <option> exists — jsdom (like a browser)
 * silently ignores a select value with no matching option, which is the same
 * dropdown race the form itself guards against.
 */
const selectCustomer = async (uuid: string) => {
  await waitFor(() => expect(optionValues('customer-select')).toContain(uuid));
  fireEvent.change(screen.getByTestId('customer-select'), {
    target: { value: uuid },
  });
  await waitFor(() =>
    expect((screen.getByTestId('customer-select') as HTMLSelectElement).value).toBe(
      uuid,
    ),
  );
};

const selectProduct = async (uuid: string) => {
  await waitFor(() => expect(productOptionValues()).toContain(uuid));
  fireEvent.change(screen.getByTestId('product-select'), {
    target: { value: uuid },
  });
};

describe('SalesOrderForm create mode (AC-21)', () => {
  it('disables the producto select until a cliente is chosen', async () => {
    render(<SalesOrderForm />);

    await screen.findByTestId('customer-select');
    expect(screen.getByTestId('product-select')).toBeDisabled();
    expect(mockGetProducts).not.toHaveBeenCalled();
  });

  it("loads exactly the chosen cliente's products", async () => {
    render(<SalesOrderForm />);
    await screen.findByTestId('customer-select');

    await selectCustomer(CUSTOMER_A);

    await waitFor(() =>
      expect(mockGetProducts).toHaveBeenCalledWith(
        expect.objectContaining({ customerUuid: CUSTOMER_A }),
      ),
    );
    await waitFor(() => expect(productOptionValues()).toContain(PRODUCT_A1));
    expect(productOptionValues()).toContain(PRODUCT_A2);
    expect(productOptionValues()).not.toContain(PRODUCT_B1);
    expect(screen.getByTestId('product-select')).not.toBeDisabled();
  });

  it('clears the chosen producto and repopulates when the cliente changes', async () => {
    render(<SalesOrderForm />);
    await screen.findByTestId('customer-select');

    await selectCustomer(CUSTOMER_A);
    await selectProduct(PRODUCT_A1);
    expect((screen.getByTestId('product-select') as HTMLSelectElement).value).toBe(
      PRODUCT_A1,
    );

    await selectCustomer(CUSTOMER_B);

    await waitFor(() => expect(productOptionValues()).toContain(PRODUCT_B1));
    expect(productOptionValues()).not.toContain(PRODUCT_A1);
    expect((screen.getByTestId('product-select') as HTMLSelectElement).value).toBe('');
  });

  it('also refetches the lugar de entrega list for the new cliente', async () => {
    render(<SalesOrderForm />);
    await screen.findByTestId('customer-select');

    await selectCustomer(CUSTOMER_A);

    await waitFor(() =>
      expect(mockGetDeliveryLocations).toHaveBeenCalledWith(
        expect.objectContaining({ customerUuid: CUSTOMER_A }),
      ),
    );
  });

  it('shows the número as unassigned before the first save', async () => {
    render(<SalesOrderForm />);

    expect(await screen.findByTestId('order-number')).toHaveTextContent(
      'salesOrders.numberAssignedOnSave',
    );
  });

  it('surfaces the server message instead of swallowing it', async () => {
    mockCreateSalesOrder.mockRejectedValue({
      response: { data: { message: 'Product does not belong to the selected customer' } },
    });
    render(<SalesOrderForm />);
    await screen.findByTestId('customer-select');

    await selectCustomer(CUSTOMER_A);
    await selectProduct(PRODUCT_A1);
    fireEvent.change(screen.getByTestId('quantity-input'), {
      target: { value: '100' },
    });
    fireEvent.submit(screen.getByTestId('sales-order-form'));

    expect(
      await screen.findByText('Product does not belong to the selected customer'),
    ).toBeInTheDocument();
  });

  it('rejects a non-positive cantidad before calling the API', async () => {
    render(<SalesOrderForm />);
    await screen.findByTestId('customer-select');

    await selectCustomer(CUSTOMER_A);
    await selectProduct(PRODUCT_A1);
    fireEvent.change(screen.getByTestId('quantity-input'), {
      target: { value: '0' },
    });
    fireEvent.submit(screen.getByTestId('sales-order-form'));

    expect(
      await screen.findByText('salesOrders.validation.quantityPositive'),
    ).toBeInTheDocument();
    expect(mockCreateSalesOrder).not.toHaveBeenCalled();
  });

  /**
   * D-7 regression: the API applies `customers.salesPersonId` only when the
   * key is ABSENT — `salesUserUuid: null` is an explicit "nobody" and skips the
   * default, so every pedido created from the form shipped with no vendedor.
   */
  it('omits salesUserUuid entirely when no vendedor is picked', async () => {
    mockCreateSalesOrder.mockResolvedValue({ uuid: ORDER_UUID, number: '00000001' });
    render(<SalesOrderForm />);
    await screen.findByTestId('customer-select');

    await selectCustomer(CUSTOMER_A);
    await selectProduct(PRODUCT_A1);
    fireEvent.change(screen.getByTestId('quantity-input'), {
      target: { value: '100' },
    });
    fireEvent.submit(screen.getByTestId('sales-order-form'));

    await waitFor(() => expect(mockCreateSalesOrder).toHaveBeenCalled());
    const payload = mockCreateSalesOrder.mock.calls[0][0];
    expect(payload).not.toHaveProperty('salesUserUuid');
    expect(Object.keys(payload)).not.toContain('salesUserUuid');
  });

  it('sends the vendedor when one IS picked', async () => {
    mockCreateSalesOrder.mockResolvedValue({ uuid: ORDER_UUID, number: '00000001' });
    render(<SalesOrderForm />);
    await screen.findByTestId('customer-select');

    await selectCustomer(CUSTOMER_A);
    await selectProduct(PRODUCT_A1);
    fireEvent.change(screen.getByTestId('quantity-input'), {
      target: { value: '100' },
    });
    fireEvent.change(screen.getByTestId('sales-user-select'), {
      target: { value: 'user-1' },
    });
    fireEvent.submit(screen.getByTestId('sales-order-form'));

    await waitFor(() => expect(mockCreateSalesOrder).toHaveBeenCalled());
    expect(mockCreateSalesOrder.mock.calls[0][0].salesUserUuid).toBe('user-1');
  });

  it('omits an untouched fecha de entrega and sends a chosen one', async () => {
    mockCreateSalesOrder.mockResolvedValue({ uuid: ORDER_UUID, number: '00000001' });
    render(<SalesOrderForm />);
    await screen.findByTestId('customer-select');

    await selectCustomer(CUSTOMER_A);
    await selectProduct(PRODUCT_A1);
    fireEvent.change(screen.getByTestId('quantity-input'), {
      target: { value: '100' },
    });
    fireEvent.submit(screen.getByTestId('sales-order-form'));

    await waitFor(() => expect(mockCreateSalesOrder).toHaveBeenCalled());
    expect(mockCreateSalesOrder.mock.calls[0][0]).not.toHaveProperty(
      'deliveryDate',
    );

    fireEvent.change(screen.getByTestId('delivery-date-input'), {
      target: { value: '2026-04-01' },
    });
    fireEvent.submit(screen.getByTestId('sales-order-form'));

    await waitFor(() => expect(mockCreateSalesOrder).toHaveBeenCalledTimes(2));
    expect(mockCreateSalesOrder.mock.calls[1][0].deliveryDate).toBe(
      '2026-04-01',
    );
  });

  it('navigates to the created order on success', async () => {
    mockCreateSalesOrder.mockResolvedValue({ uuid: ORDER_UUID, number: '00000001' });
    render(<SalesOrderForm />);
    await screen.findByTestId('customer-select');

    await selectCustomer(CUSTOMER_A);
    await selectProduct(PRODUCT_A1);
    fireEvent.change(screen.getByTestId('quantity-input'), {
      target: { value: '100' },
    });
    fireEvent.submit(screen.getByTestId('sales-order-form'));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(`/sales-orders/${ORDER_UUID}`),
    );
    expect(mockCreateSalesOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        customerUuid: CUSTOMER_A,
        productUuid: PRODUCT_A1,
        quantity: 100,
      }),
    );
  });
});

/**
 * AC-8 — "alta de pedido de parte" (`PedidoDeParteForm.cs`). The parte lookup
 * spans every parte of the company, and cliente + producto are DERIVED from
 * it (`:142-153`), so the payload carries `partUuid` and no `productUuid`.
 */
describe('SalesOrderForm parte path (AC-8)', () => {
  const chooseParteMode = async () => {
    await screen.findByTestId('customer-select');
    fireEvent.change(screen.getByTestId('order-type-select'), {
      target: { value: 'part' },
    });
    await screen.findByTestId('part-select');
  };

  const selectPart = async (uuid: string) => {
    await waitFor(() => expect(optionValues('part-select')).toContain(uuid));
    fireEvent.change(screen.getByTestId('part-select'), {
      target: { value: uuid },
    });
  };

  it('swaps the producto picker for a parte picker over every parte', async () => {
    render(<SalesOrderForm />);
    await chooseParteMode();

    await waitFor(() => expect(mockGetParts).toHaveBeenCalled());
    expect(mockGetParts.mock.calls[0][0]).not.toHaveProperty('productUuid');
    expect(optionValues('part-select')).toEqual(
      expect.arrayContaining([PART_A1, PART_B1]),
    );
    expect(screen.queryByTestId('product-select')).not.toBeInTheDocument();
  });

  it('shows the cliente and producto derived from the chosen parte, read-only', async () => {
    render(<SalesOrderForm />);
    await chooseParteMode();
    await selectPart(PART_A1);

    await waitFor(() =>
      expect(screen.getByTestId('derived-customer')).toHaveTextContent('Cliente A'),
    );
    expect(screen.getByTestId('derived-product')).toHaveTextContent('P-A1');
    expect(screen.queryByTestId('customer-select')).not.toBeInTheDocument();
  });

  it('submits partUuid and never productUuid or customerUuid (AC-8)', async () => {
    mockCreateSalesOrder.mockResolvedValue({ uuid: ORDER_UUID, number: '00000009' });
    render(<SalesOrderForm />);
    await chooseParteMode();
    await selectPart(PART_A1);
    fireEvent.change(screen.getByTestId('quantity-input'), {
      target: { value: '300' },
    });
    fireEvent.submit(screen.getByTestId('sales-order-form'));

    await waitFor(() => expect(mockCreateSalesOrder).toHaveBeenCalled());
    const payload = mockCreateSalesOrder.mock.calls[0][0];
    expect(payload.partUuid).toBe(PART_A1);
    expect(payload.quantity).toBe(300);
    expect(payload).not.toHaveProperty('productUuid');
    expect(payload).not.toHaveProperty('customerUuid');
  });

  it('refetches the lugar de entrega list for the DERIVED cliente', async () => {
    render(<SalesOrderForm />);
    await chooseParteMode();
    await selectPart(PART_B1);

    await waitFor(() =>
      expect(mockGetDeliveryLocations).toHaveBeenCalledWith(
        expect.objectContaining({ customerUuid: CUSTOMER_B }),
      ),
    );
  });

  it('blocks the submit until a parte is chosen', async () => {
    render(<SalesOrderForm />);
    await chooseParteMode();
    fireEvent.change(screen.getByTestId('quantity-input'), {
      target: { value: '300' },
    });
    fireEvent.submit(screen.getByTestId('sales-order-form'));

    expect(
      await screen.findByText('salesOrders.validation.partRequired'),
    ).toBeInTheDocument();
    expect(mockCreateSalesOrder).not.toHaveBeenCalled();
  });

  /**
   * Switching back must not leave the parte's `required` rule armed on a
   * control the user can no longer see — the submit would be blocked with no
   * visible error.
   */
  it('goes back to the producto path with a clean payload', async () => {
    mockCreateSalesOrder.mockResolvedValue({ uuid: ORDER_UUID, number: '00000010' });
    render(<SalesOrderForm />);
    await chooseParteMode();
    await selectPart(PART_A1);

    fireEvent.change(screen.getByTestId('order-type-select'), {
      target: { value: 'product' },
    });
    await screen.findByTestId('product-select');

    await selectCustomer(CUSTOMER_A);
    await selectProduct(PRODUCT_A1);
    fireEvent.change(screen.getByTestId('quantity-input'), {
      target: { value: '100' },
    });
    fireEvent.submit(screen.getByTestId('sales-order-form'));

    await waitFor(() => expect(mockCreateSalesOrder).toHaveBeenCalled());
    const payload = mockCreateSalesOrder.mock.calls[0][0];
    expect(payload.productUuid).toBe(PRODUCT_A1);
    expect(payload.customerUuid).toBe(CUSTOMER_A);
    expect(payload).not.toHaveProperty('partUuid');
  });
});

describe('SalesOrderForm edit mode (AC-23)', () => {
  beforeEach(() => {
    mockRouteParams = { uuid: ORDER_UUID };
    mockGetSalesOrder.mockResolvedValue({
      uuid: ORDER_UUID,
      number: '00000007',
      quantity: 100,
      status: 'pending',
      customer: { uuid: CUSTOMER_A, name: 'Cliente A' },
      product: { uuid: PRODUCT_A1, code: 'P-A1' },
      salesUser: { uuid: 'user-1', name: 'Ven Dedor' },
      // A time-bearing instant: re-sending it truncated to its day is both a
      // 403 risk and a silent rewrite to UTC midnight.
      deliveryDate: '2026-03-10T15:30:00.000Z',
      orderData: { uuid: 'od-uuid', notes: 'obs' },
      createdAt: '2026-08-20T00:00:00.000Z',
    });
  });

  it('renders cliente and producto as disabled controls', async () => {
    render(<SalesOrderForm />);

    await waitFor(() =>
      expect((screen.getByTestId('customer-select') as HTMLSelectElement).value).toBe(
        CUSTOMER_A,
      ),
    );
    expect(screen.getByTestId('customer-select')).toBeDisabled();
    expect(screen.getByTestId('product-select')).toBeDisabled();
    expect((screen.getByTestId('product-select') as HTMLSelectElement).value).toBe(
      PRODUCT_A1,
    );
  });

  it('shows the assigned número and the derived estado', async () => {
    render(<SalesOrderForm />);

    await waitFor(() =>
      expect(screen.getByTestId('order-number')).toHaveTextContent('00000007'),
    );
    expect(screen.getByTestId('order-status')).toHaveTextContent(
      'salesOrders.status.pending',
    );
  });

  /**
   * REWRITTEN by `sales-order-list`. The original case asserted that the edit
   * form exposes NO approval / cumplimiento / anulación control — true when the
   * create feature shipped, false since `sales-order-approvals` and
   * `sales-order-fulfillment` landed. It stayed green only because it probed
   * testids (`approve-commercial-btn`, `fulfill-btn`, …) that no component in
   * this repo has ever used, so it protected nothing. What it now asserts is
   * what is actually true: the edit page mounts both blocks, by their real
   * testids.
   */
  it('mounts the approval and the cumplimiento/anulación blocks', async () => {
    render(<SalesOrderForm />);
    await waitFor(() =>
      expect(screen.getByTestId('order-number')).toHaveTextContent('00000007'),
    );

    for (const testId of [
      'sales-order-approvals',
      'sales-order-approval-commercial',
      'sales-order-approval-financial',
      'sales-order-lifecycle',
      'sales-order-lifecycle-fulfillment',
      'sales-order-lifecycle-void',
    ]) {
      expect(screen.getByTestId(testId)).toBeInTheDocument();
    }
  });

  it('never re-sends the immutable cliente/producto on save', async () => {
    mockUpdateSalesOrder.mockResolvedValue({ uuid: ORDER_UUID, number: '00000007' });
    render(<SalesOrderForm />);
    await waitFor(() =>
      expect(screen.getByTestId('order-number')).toHaveTextContent('00000007'),
    );

    fireEvent.change(screen.getByTestId('quantity-input'), {
      target: { value: '250' },
    });
    fireEvent.submit(screen.getByTestId('sales-order-form'));

    await waitFor(() => expect(mockUpdateSalesOrder).toHaveBeenCalled());
    const payload = mockUpdateSalesOrder.mock.calls[0][1];
    expect(payload).not.toHaveProperty('customerUuid');
    expect(payload).not.toHaveProperty('productUuid');
    expect(payload.quantity).toBe(250);
    expect(mockNavigate).not.toHaveBeenCalledWith(`/sales-orders/${ORDER_UUID}`);
  });

  it('leaves an untouched fecha de entrega out of the update payload', async () => {
    mockUpdateSalesOrder.mockResolvedValue({ uuid: ORDER_UUID, number: '00000007' });
    render(<SalesOrderForm />);
    await waitFor(() =>
      expect(screen.getByTestId('order-number')).toHaveTextContent('00000007'),
    );

    fireEvent.change(screen.getByTestId('quantity-input'), {
      target: { value: '250' },
    });
    fireEvent.submit(screen.getByTestId('sales-order-form'));

    await waitFor(() => expect(mockUpdateSalesOrder).toHaveBeenCalled());
    expect(mockUpdateSalesOrder.mock.calls[0][1]).not.toHaveProperty(
      'deliveryDate',
    );
  });

  it('sends the fecha de entrega once it is actually changed', async () => {
    mockUpdateSalesOrder.mockResolvedValue({ uuid: ORDER_UUID, number: '00000007' });
    render(<SalesOrderForm />);
    await waitFor(() =>
      expect(screen.getByTestId('order-number')).toHaveTextContent('00000007'),
    );

    fireEvent.change(screen.getByTestId('delivery-date-input'), {
      target: { value: '2026-04-02' },
    });
    fireEvent.submit(screen.getByTestId('sales-order-form'));

    await waitFor(() => expect(mockUpdateSalesOrder).toHaveBeenCalled());
    expect(mockUpdateSalesOrder.mock.calls[0][1].deliveryDate).toBe(
      '2026-04-02',
    );
  });

  /** Clearing must stay possible: on UPDATE an explicit null is the eraser. */
  it('clears the vendedor with an explicit null', async () => {
    mockUpdateSalesOrder.mockResolvedValue({ uuid: ORDER_UUID, number: '00000007' });
    render(<SalesOrderForm />);
    await waitFor(() =>
      expect(
        (screen.getByTestId('sales-user-select') as HTMLSelectElement).value,
      ).toBe('user-1'),
    );

    fireEvent.change(screen.getByTestId('sales-user-select'), {
      target: { value: '' },
    });
    fireEvent.submit(screen.getByTestId('sales-order-form'));

    await waitFor(() => expect(mockUpdateSalesOrder).toHaveBeenCalled());
    expect(mockUpdateSalesOrder.mock.calls[0][1].salesUserUuid).toBeNull();
  });
});

/**
 * Trello #39 — the Total printed `220000.0000`, the `numeric(18,4)` storage
 * scale leaking into the UI. It is a DISPLAY concern only: the price box stays
 * a raw `type="number"` field, or grouped text would break typing and the
 * numeric parse on submit.
 */
describe('SalesOrderForm amount formatting (Trello #39)', () => {
  const enterAmounts = async (quantity: string, price: string) => {
    render(<SalesOrderForm />);
    await screen.findByTestId('customer-select');

    await selectCustomer(CUSTOMER_A);
    await selectProduct(PRODUCT_A1);
    fireEvent.change(screen.getByTestId('quantity-input'), {
      target: { value: quantity },
    });
    fireEvent.change(screen.getByTestId('price-input'), {
      target: { value: price },
    });
  };

  it('renders the total es-AR with two decimals, not four', async () => {
    await enterAmounts('1000', '220');

    await waitFor(() =>
      expect(screen.getByTestId('price-total')).toHaveTextContent('220.000,00'),
    );
  });

  it('shows the dash placeholder while no price is entered', async () => {
    render(<SalesOrderForm />);
    await screen.findByTestId('customer-select');

    await selectCustomer(CUSTOMER_A);
    fireEvent.change(screen.getByTestId('quantity-input'), {
      target: { value: '1000' },
    });

    expect(screen.getByTestId('price-total')).toHaveTextContent('-');
  });

  it('leaves the precio input itself unformatted and still typable', async () => {
    await enterAmounts('1000', '1234.5');

    const priceInput = screen.getByTestId('price-input') as HTMLInputElement;
    await waitFor(() => expect(priceInput.value).toBe('1234.5'));
    expect(screen.getByTestId('price-total')).toHaveTextContent('1.234.500,00');

    fireEvent.change(priceInput, { target: { value: '1234.56' } });
    await waitFor(() => expect(priceInput.value).toBe('1234.56'));
  });

  it('sends the price as a plain number on submit', async () => {
    mockCreateSalesOrder.mockResolvedValue({ uuid: ORDER_UUID, number: '00000009' });
    await enterAmounts('1000', '220');
    fireEvent.submit(screen.getByTestId('sales-order-form'));

    await waitFor(() => expect(mockCreateSalesOrder).toHaveBeenCalled());
    expect(mockCreateSalesOrder.mock.calls[0][0].price).toBe(220);
  });
});
