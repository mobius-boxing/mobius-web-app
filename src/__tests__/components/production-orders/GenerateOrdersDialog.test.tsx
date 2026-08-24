import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GenerateOrdersDialog from '../../../components/production-orders/GenerateOrdersDialog';

const mockGetEligibility = jest.fn();
const mockGenerate = jest.fn();

jest.mock('../../../services/api', () => ({
  productionOrdersApi: {
    getGenerationEligibility: (...args: any[]) => mockGetEligibility(...args),
    generate: (...args: any[]) => mockGenerate(...args),
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}));

const eligibility = (overrides: Record<string, unknown> = {}) => ({
  canGenerate: true,
  alreadyHasOrders: false,
  blockingReasons: [],
  requiresForce: false,
  oneOrderPerSalesOrder: false,
  defaultRow: { quantity: 300, deliveryDate: '2030-01-01T00:00:00.000Z' },
  ...overrides,
});

const renderDialog = async (props: Record<string, unknown> = {}) => {
  render(
    <GenerateOrdersDialog
      salesOrderUuid="pedido-uuid"
      open
      onClose={jest.fn()}
      {...props}
    />,
  );
  await waitFor(() =>
    expect(screen.queryByTestId('generate-loading')).not.toBeInTheDocument(),
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetEligibility.mockResolvedValue(eligibility());
  mockGenerate.mockResolvedValue({ generated: [], warnings: [] });
});

describe('GenerateOrdersDialog — the two-way percentage column (AC-30)', () => {
  it('seeds exactly one row with the whole pedido', async () => {
    await renderDialog();

    expect(
      (screen.getByTestId('generate-quantity-0') as HTMLInputElement).value,
    ).toBe('300');
    expect(
      (screen.getByTestId('generate-percentage-0') as HTMLInputElement).value,
    ).toBe('100');
    expect(screen.queryByTestId('generate-row-1')).not.toBeInTheDocument();
  });

  it('typing 50 in Porcentaje halves the quantity', async () => {
    await renderDialog();

    fireEvent.change(screen.getByTestId('generate-percentage-0'), {
      target: { value: '50' },
    });

    expect(
      (screen.getByTestId('generate-quantity-0') as HTMLInputElement).value,
    ).toBe('150');
  });

  it('typing a quantity updates Porcentaje', async () => {
    await renderDialog();

    fireEvent.change(screen.getByTestId('generate-quantity-0'), {
      target: { value: '75' },
    });

    expect(
      (screen.getByTestId('generate-percentage-0') as HTMLInputElement).value,
    ).toBe('25');
  });

  it('renders 0 rather than NaN when the pedido quantity is zero', async () => {
    mockGetEligibility.mockResolvedValue(
      eligibility({ defaultRow: { quantity: 0, deliveryDate: null } }),
    );

    await renderDialog();

    expect(
      (screen.getByTestId('generate-percentage-0') as HTMLInputElement).value,
    ).toBe('0');
  });
});

describe('GenerateOrdersDialog — the Σ-mismatch warning', () => {
  it('is hidden while the rows add up to the pedido', async () => {
    await renderDialog();

    expect(screen.queryByTestId('generate-sum-warning')).not.toBeInTheDocument();
  });

  it('appears as soon as they do not', async () => {
    await renderDialog();

    fireEvent.change(screen.getByTestId('generate-quantity-0'), {
      target: { value: '299' },
    });

    expect(screen.getByTestId('generate-sum-warning')).toBeInTheDocument();
  });

  it('a second row can restore the total and clear the warning', async () => {
    await renderDialog();

    fireEvent.change(screen.getByTestId('generate-quantity-0'), {
      target: { value: '100' },
    });
    fireEvent.click(screen.getByTestId('generate-add-row'));
    fireEvent.change(screen.getByTestId('generate-quantity-1'), {
      target: { value: '200' },
    });

    expect(screen.queryByTestId('generate-sum-warning')).not.toBeInTheDocument();
  });
});

describe('GenerateOrdersDialog — UnaOrdenPorPedido', () => {
  it('disables every split control', async () => {
    mockGetEligibility.mockResolvedValue(
      eligibility({ oneOrderPerSalesOrder: true }),
    );

    await renderDialog();

    expect(screen.getByTestId('generate-quantity-0')).toBeDisabled();
    expect(screen.getByTestId('generate-percentage-0')).toBeDisabled();
    expect(screen.getByTestId('generate-delivery-date-0')).toBeDisabled();
    expect(screen.getByTestId('generate-add-row')).toBeDisabled();
    expect(screen.getByTestId('generate-remove-row')).toBeDisabled();
    // The pedido can still be generated as one whole order.
    expect(screen.getByTestId('generate-yes')).not.toBeDisabled();
  });
});

describe('GenerateOrdersDialog — a voided pedido', () => {
  it('confirms before posting, and only then sends force', async () => {
    mockGetEligibility.mockResolvedValue(eligibility({ requiresForce: true }));

    await renderDialog();
    fireEvent.click(screen.getByTestId('generate-yes'));

    // The confirm intercepts: nothing has been posted yet.
    expect(mockGenerate).not.toHaveBeenCalled();
    expect(
      screen.getByText('productionOrders.generate.voidedConfirm'),
    ).toBeInTheDocument();

    // Two buttons carry the `Sí` label now — the dialog's and the confirm's.
    // The confirm modal renders last, so its button is the last match.
    const yesButtons = screen.getAllByText('productionOrders.generate.yes', {
      selector: 'button',
    });
    fireEvent.click(yesButtons[yesButtons.length - 1]);

    await waitFor(() => expect(mockGenerate).toHaveBeenCalled());
    expect(mockGenerate).toHaveBeenCalledWith(
      'pedido-uuid',
      [{ quantity: 300, deliveryDate: '2030-01-01T00:00:00.000Z' }],
      true,
    );
  });

  it('posts straight away when the pedido is not voided', async () => {
    const onGenerated = jest.fn();
    await renderDialog({ onGenerated });

    fireEvent.click(screen.getByTestId('generate-yes'));

    await waitFor(() => expect(mockGenerate).toHaveBeenCalled());
    expect(mockGenerate).toHaveBeenCalledWith(
      'pedido-uuid',
      [{ quantity: 300, deliveryDate: '2030-01-01T00:00:00.000Z' }],
      false,
    );
    expect(onGenerated).toHaveBeenCalled();
  });
});

describe('GenerateOrdersDialog — blocked pedidos', () => {
  it('lists the blocking reasons instead of the grid', async () => {
    mockGetEligibility.mockResolvedValue(
      eligibility({
        canGenerate: false,
        blockingReasons: [
          {
            code: 'SALES_ORDER_NOT_APPROVED',
            message:
              'No es posible generar órdenes sin aprobación comercial/financiera del pedido',
          },
        ],
      }),
    );

    await renderDialog();

    expect(
      screen.getByTestId('blocking-reason-SALES_ORDER_NOT_APPROVED'),
    ).toHaveTextContent(
      'No es posible generar órdenes sin aprobación comercial/financiera del pedido',
    );
    expect(screen.queryByTestId('generate-quantity-0')).not.toBeInTheDocument();
    expect(screen.getByTestId('generate-yes')).toBeDisabled();
  });
});
