import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SalesOrderLifecycleControl from '../../../components/sales-orders/SalesOrderLifecycleControl';

/**
 * The anulación confirmation is the only screen in the app that cascades onto
 * the pedido's production orders, so its wording is part of the contract:
 * `void` + checkbox VOIDS the linked OPs, while `cancel` + checkbox CLEARS
 * their `voidedAt` (sales-order-lifecycle.dao.ts:224-240). Announcing "también
 * serán anuladas" for the reversal told the operator the opposite of what the
 * button does.
 *
 * `t` is mocked to `##<key>##`, so each case pins the CLAUSE that is chosen.
 */
jest.mock('../../../services/api', () => ({
  salesOrdersApi: { setFulfillment: jest.fn(), setVoid: jest.fn() },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => `##${key}##` }),
}));

jest.mock('../../../hooks/usePermissions', () => ({
  usePermissions: () => ({ has: () => true }),
}));

const ORDER = {
  uuid: 'so-1',
  number: '00000001',
  quantity: 10,
  fulfilledAt: null,
  voidedAt: null,
} as any;

const VOIDED_ORDER = {
  ...ORDER,
  voidedAt: '2026-03-05T00:00:00.000Z',
  voidedBy: 'admin',
};

const message = () =>
  screen.getByText(/##salesOrders\.lifecycle\.confirmVoid/).textContent ?? '';

const openVoidConfirm = (order: any, action: 'void' | 'cancel', include: boolean) => {
  render(<SalesOrderLifecycleControl order={order} onChanged={jest.fn()} />);
  if (include) {
    fireEvent.click(screen.getByTestId('sales-order-lifecycle-include-orders'));
  }
  fireEvent.click(
    screen.getByTestId(
      action === 'void'
        ? 'sales-order-lifecycle-void-action'
        : 'sales-order-lifecycle-void-cancel',
    ),
  );
};

describe('the anulación confirmation names the cascade it performs', () => {
  it('voids the associated orders when Anular runs with the box ticked', () => {
    openVoidConfirm(ORDER, 'void', true);

    expect(message()).toContain('##salesOrders.lifecycle.confirmVoid##');
    expect(message()).toContain(
      '##salesOrders.lifecycle.confirmVoidIncludesOrders##',
    );
  });

  it('leaves them alone when Anular runs with the box unticked', () => {
    openVoidConfirm(ORDER, 'void', false);

    expect(message()).toContain(
      '##salesOrders.lifecycle.confirmVoidKeepsOrders##',
    );
  });

  it('says the associated orders STOP being voided when the anulación is cancelled', () => {
    openVoidConfirm(VOIDED_ORDER, 'cancel', true);

    expect(message()).toContain('##salesOrders.lifecycle.confirmVoidCancel##');
    expect(message()).toContain(
      '##salesOrders.lifecycle.confirmVoidCancelIncludesOrders##',
    );
    expect(message()).not.toContain(
      '##salesOrders.lifecycle.confirmVoidIncludesOrders##',
    );
  });

  it('promises no change to them when the anulación is cancelled with the box unticked', () => {
    openVoidConfirm(VOIDED_ORDER, 'cancel', false);

    expect(message()).toContain(
      '##salesOrders.lifecycle.confirmVoidCancelKeepsOrders##',
    );
    expect(message()).not.toContain(
      '##salesOrders.lifecycle.confirmVoidKeepsOrders##',
    );
  });
});
