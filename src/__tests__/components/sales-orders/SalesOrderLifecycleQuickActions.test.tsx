import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SalesOrderLifecycleQuickActions from '../../../components/sales-orders/SalesOrderLifecycleQuickActions';

/**
 * The grid's one-click anulación shows the same confirmation contract as the
 * edit page's lifecycle block: the cascade clause must describe the ACTION.
 * Cancelling an anulación leaves the linked OPs exactly as they are, so the
 * `void` sentence ("NO serán anuladas") is the wrong promise there — it is the
 * bug `SalesOrderLifecycleControl` was fixed for and this twin kept.
 *
 * This surface never cascades (`includeProductionOrders: false`, D-4), so only
 * the two "Keeps" clauses can ever appear.
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
  fulfilled: false,
  voided: false,
} as any;

const VOIDED_ORDER = { ...ORDER, voided: true };

const message = () =>
  screen.getByText(/##salesOrders\.lifecycle\.confirmVoid/).textContent ?? '';

const openVoidConfirm = (order: any) => {
  render(
    <SalesOrderLifecycleQuickActions order={order} onChanged={jest.fn()} />,
  );
  fireEvent.click(screen.getByTestId('void-quick-btn'));
};

describe('the quick anulación confirmation names the cascade it performs', () => {
  it('promises the associated orders are left un-anuladas when Anular runs', () => {
    openVoidConfirm(ORDER);

    expect(message()).toContain('##salesOrders.lifecycle.confirmVoid##');
    expect(message()).toContain(
      '##salesOrders.lifecycle.confirmVoidKeepsOrders##',
    );
    expect(message()).not.toContain(
      '##salesOrders.lifecycle.confirmVoidCancelKeepsOrders##',
    );
  });

  it('promises they keep their current state when the anulación is cancelled', () => {
    openVoidConfirm(VOIDED_ORDER);

    expect(message()).toContain('##salesOrders.lifecycle.confirmVoidCancel##');
    expect(message()).toContain(
      '##salesOrders.lifecycle.confirmVoidCancelKeepsOrders##',
    );
    expect(message()).not.toContain(
      '##salesOrders.lifecycle.confirmVoidKeepsOrders##',
    );
  });
});
