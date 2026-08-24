import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SalesOrderApprovalControl from '../../../components/sales-orders/SalesOrderApprovalControl';

/**
 * The two approval machines are independent (AprobacionControl.cs): a request
 * in flight on one must not freeze the other's buttons.
 */
const mockSetApproval = jest.fn();

jest.mock('../../../services/api', () => ({
  salesOrdersApi: {
    setApproval: (...args: any[]) => mockSetApproval(...args),
  },
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
  commercialApprovedAt: null,
  financialApprovedAt: null,
} as any;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SalesOrderApprovalControl', () => {
  it('locks only the machine whose request is in flight', async () => {
    // Never settles: the component stays in its in-flight state.
    mockSetApproval.mockImplementation(() => new Promise(() => {}));
    render(<SalesOrderApprovalControl order={ORDER} onChanged={jest.fn()} />);

    fireEvent.click(
      screen.getByTestId('sales-order-approval-commercial-approve'),
    );

    await waitFor(() =>
      expect(
        screen.getByTestId('sales-order-approval-commercial-approve'),
      ).toBeDisabled(),
    );
    expect(
      screen.getByTestId('sales-order-approval-financial-approve'),
    ).not.toBeDisabled();
  });
});
