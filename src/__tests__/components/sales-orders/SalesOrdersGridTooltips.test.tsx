import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import SalesOrdersGrid from '../../../components/sales-orders/SalesOrdersGrid';

/**
 * Round 2 fix brief: the dev DB has no sales orders, so the grid's own
 * ActionButtons (view production orders, edit, delete) and the two quick
 * actions SalesOrderLifecycleQuickActions renders in the same cell (fulfill,
 * void — the pair the bug report says showed no tooltip in production) were
 * never exercised in a browser. This mounts the grid with one order and
 * proves every one of the five row actions shows role="tooltip" text equal
 * to its own aria-label, on hover after 150ms and immediately on focus.
 */
const mockGetSalesOrders = jest.fn();

jest.mock('../../../services/api', () => ({
  salesOrdersApi: {
    getSalesOrders: (...args: any[]) => mockGetSalesOrders(...args),
    deleteSalesOrder: jest.fn(),
    setFulfillment: jest.fn(),
    setVoid: jest.fn(),
  },
  customersApi: { getCustomers: jest.fn().mockResolvedValue({ data: [] }) },
  productsApi: { getProducts: jest.fn().mockResolvedValue({ data: [] }) },
  paperSheetsApi: { getPaperSheets: jest.fn().mockResolvedValue({ data: [] }) },
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ to, children, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => `##${key}##` }),
}));

jest.mock('../../../hooks/useEffectiveCompany', () => ({
  __esModule: true,
  default: () => ({ effectiveCompanyId: undefined }),
}));

jest.mock('../../../hooks/usePermissions', () => ({
  usePermissions: () => ({ has: () => true }),
}));

const ORDER = {
  uuid: 'so-1',
  number: '00000001',
  quantity: 10,
  price: 5,
  fulfilled: false,
  voided: false,
  fulfilledAt: null,
  voidedAt: null,
  commercialApprovedAt: null,
  financialApprovedAt: null,
  needsAdvanceInvoice: false,
  invoiceSent: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  deliveryDate: '2026-01-10T00:00:00.000Z',
};

const page = (data: any[]) => ({
  data,
  total: data.length,
  page: 1,
  limit: 20,
  totalPages: 1,
});

/** The five row actions the fix brief names, in the order they render. */
const ACTION_TEST_IDS = [
  'fulfillment-quick-btn',
  'void-quick-btn',
  'view-production-orders-btn',
  'edit-btn',
  'delete-btn',
];

beforeEach(() => {
  jest.clearAllMocks();
  mockGetSalesOrders.mockResolvedValue(page([ORDER]));
});

afterEach(() => {
  jest.useRealTimers();
});

describe('SalesOrdersGrid action tooltips (round 2 fix brief)', () => {
  it('shows a role=tooltip on 150ms hover, and on focus, matching each button own aria-label', async () => {
    render(<SalesOrdersGrid />);
    await waitFor(() => expect(mockGetSalesOrders).toHaveBeenCalled());
    await screen.findByTestId('sales-orders-grid');
    for (const testId of ACTION_TEST_IDS) {
      await screen.findByTestId(testId);
    }

    jest.useFakeTimers();

    for (const testId of ACTION_TEST_IDS) {
      const button = screen.getByTestId(testId);
      const label = button.getAttribute('aria-label');
      expect(label).toBeTruthy();
      const wrapper = button.parentElement as HTMLElement;

      fireEvent.mouseEnter(wrapper);
      expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument();
      act(() => {
        jest.advanceTimersByTime(149);
      });
      expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument();
      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent(label!);
      fireEvent.mouseLeave(wrapper);
      expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument();

      fireEvent.focus(button);
      expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent(label!);
      fireEvent.blur(button);
      expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument();
    }
  });
});
