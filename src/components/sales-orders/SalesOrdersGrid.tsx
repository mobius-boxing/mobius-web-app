import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, Edit, ListOrdered, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import Table from '../ui/Table';
import Pagination from '../ui/Pagination';
import ConfirmModal from '../ui/ConfirmModal';
import SalesOrdersFilterBar from './SalesOrdersFilterBar';
import SalesOrderLifecycleQuickActions from './SalesOrderLifecycleQuickActions';
import { SalesOrder, SalesOrderListFilters } from '../../types';
import { salesOrdersApi } from '../../services/api';
import { useEntityList } from '../../hooks/useEntityList';
import { useConfirmModal } from '../../hooks/useConfirmModal';
import { usePermissions } from '../../hooks/usePermissions';
import useEffectiveCompany from '../../hooks/useEffectiveCompany';
import { formatBusinessDate } from '../../utils/dates';
import { logger } from '../../utils/logger';
import { formatMoney } from '../../utils/money';

/**
 * The mount-time filter state, and what `Limpiar` restores
 * (PedidosForm.cs:489-490). Both flags are sent EXPLICITLY as `false`: the grid
 * hides fulfilled and voided pedidos by default, and checking a box switches
 * the list rather than widening it.
 */
const MOUNT_FILTERS: SalesOrderListFilters = {
  fulfilled: 'false',
  voided: 'false',
};

/**
 * The API's sort whitelist (own-table columns only — a joined column would
 * 42703 the count query). Column keys below match these names exactly, and
 * `sortable: true` appears on those seven columns and no others.
 */
const SORTABLE = [
  'number',
  'createdAt',
  'deliveryDate',
  'quantity',
  'price',
  'purchaseOrder',
  'supplierCode',
] as const;

const PRICES_CODE = 'prices.visible';
const DELETE_CODE = 'orders.delete';

/** `createdAt` is an instant, not a business date — see utils/dates. */
const formatInstant = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString() : '-';

const tick = (on: boolean, testId: string) =>
  on ? (
    <Check className="h-4 w-4 text-green-600" data-testid={testId} />
  ) : (
    <span className="text-secondary-300">-</span>
  );

/**
 * Pedidos grid (`PedidosForm`): the Procusto filter bar, backend pagination and
 * the sixteen default columns.
 *
 * Filter wiring, deliberately: the bar's state lives here and is injected into
 * the request through `fetchFn` (last writer wins), and the SAME object is
 * mirrored into `list.setFilters` purely to trigger exactly one refetch and the
 * page-1 reset. `useEntityList`'s `defaultFilters` is NOT used — it overrides
 * `filters` inside `fetch()`, so a value seeded through it could never be
 * changed by the checkboxes again.
 */
const SalesOrdersGrid: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { has } = usePermissions();
  const { effectiveCompanyId } = useEffectiveCompany();
  const confirmModal = useConfirmModal();
  const [bar, setBar] = useState<SalesOrderListFilters>(MOUNT_FILTERS);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rowOverrides, setRowOverrides] = useState<Record<string, SalesOrder>>(
    {},
  );

  const fetchSalesOrders = useCallback(
    (params: Record<string, unknown>) =>
      salesOrdersApi.getSalesOrders({
        ...params,
        ...bar,
        ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}),
      }),
    [bar, effectiveCompanyId],
  );

  const list = useEntityList<SalesOrder>({ fetchFn: fetchSalesOrders });

  /**
   * Scope changes only — the same effect every other list screen carries.
   * `fetchFn` is not one of `useEntityList`'s auto-fetch deps, so switching
   * company rebuilt the request but never fired it and the grid kept showing
   * the previous company's pedidos.
   *
   * The ref guard skips the mount run: `useEntityList` already fetches on
   * mount, and firing again here would break the one-action / one-request rule
   * (AC-36). Filter changes are deliberately NOT handled here either — they go
   * through `applyFilters`, which resets to page 1 and refetches on its own,
   * and a second request from here would carry the stale page number.
   */
  const fetchedCompanyId = useRef(effectiveCompanyId);
  useEffect(() => {
    if (fetchedCompanyId.current === effectiveCompanyId) return;
    fetchedCompanyId.current = effectiveCompanyId;
    // Patched rows are keyed by uuid and belong to the company we are leaving.
    setRowOverrides({});
    setActionError(null);
    list.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  /** One state write plus one mirrored setFilters ⇒ exactly one request. */
  const applyFilters = (next: SalesOrderListFilters) => {
    setBar(next);
    list.setFilters({ ...next });
  };

  /**
   * `Limpiar` restores the mount-time state — including the búsqueda, which is
   * NOT part of the filter object: it lives in `useEntityList` and would
   * otherwise stay in the box and keep riding along as `params.search`.
   * Clearing an already-empty term is a no-op, so the usual one-action /
   * one-request rule holds; clearing a real term settles on a second request
   * once the hook's 300 ms search debounce fires.
   */
  const clearAll = () => {
    list.setSearch('');
    applyFilters(MOUNT_FILTERS);
  };

  const rows = list.data.map((order) => rowOverrides[order.uuid] ?? order);

  /** Patch ONE row from the DTO a quick action returned — no reload. */
  const patchRow = useCallback((updated: SalesOrder) => {
    setRowOverrides((current) => ({ ...current, [updated.uuid]: updated }));
    setActionError(null);
  }, []);

  const handleDelete = (uuid: string) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('salesOrders.deleteConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionError(null);
          await salesOrdersApi.deleteSalesOrder(uuid);
          setRowOverrides({});
          await list.refresh();
        } catch (error: any) {
          // The confirm modal closes either way, so a swallowed failure looks
          // exactly like a success that did not refresh — say what happened.
          logger.error('Error deleting sales order:', error);
          setActionError(
            error?.response?.data?.message || t('salesOrders.deleteFailed'),
          );
        }
      },
    });
  };

  const columns = [
    {
      key: 'number',
      header: t('salesOrders.columns.number'),
      sortable: true,
      render: (_: unknown, order: SalesOrder) => (
        <Link
          to={`/sales-orders/${order.uuid}`}
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
          data-testid="order-number-link"
        >
          {order.number}
        </Link>
      ),
    },
    {
      key: 'createdAt',
      header: t('salesOrders.columns.createdAt'),
      sortable: true,
      render: (_: unknown, order: SalesOrder) => (
        <span className="text-sm text-secondary-500">
          {formatInstant(order.createdAt)}
        </span>
      ),
    },
    {
      key: 'deliveryDate',
      header: t('salesOrders.columns.deliveryDate'),
      sortable: true,
      render: (_: unknown, order: SalesOrder) => (
        <span className="text-sm text-secondary-500" data-testid="order-delivery-date">
          {formatBusinessDate(order.deliveryDate)}
        </span>
      ),
    },
    {
      key: 'customer',
      header: t('salesOrders.columns.customer'),
      render: (_: unknown, order: SalesOrder) => (
        <span className="text-sm text-secondary-900">
          {order.customer?.name ?? '-'}
        </span>
      ),
    },
    {
      key: 'purchaseOrder',
      header: t('salesOrders.columns.purchaseOrder'),
      sortable: true,
      render: (_: unknown, order: SalesOrder) => (
        <span className="text-sm text-secondary-700">
          {order.purchaseOrder ?? '-'}
        </span>
      ),
    },
    {
      key: 'itemDescription',
      header: t('salesOrders.columns.item'),
      render: (_: unknown, order: SalesOrder) => (
        <span className="text-sm text-secondary-700" data-testid="order-item">
          {order.itemDescription || '-'}
        </span>
      ),
    },
    {
      key: 'quantity',
      header: t('salesOrders.columns.quantity'),
      sortable: true,
      render: (_: unknown, order: SalesOrder) => (
        <span className="text-sm text-secondary-900">{order.quantity}</span>
      ),
    },
    {
      key: 'supplierCode',
      header: t('salesOrders.columns.supplierCode'),
      sortable: true,
      render: (_: unknown, order: SalesOrder) => (
        <span className="text-sm text-secondary-700">
          {order.supplierCode ?? '-'}
        </span>
      ),
    },
    {
      key: 'salesUser',
      header: t('salesOrders.columns.salesUser'),
      render: (_: unknown, order: SalesOrder) => (
        <span className="text-sm text-secondary-700">
          {order.salesUser?.name ?? order.salesUser?.email ?? '-'}
        </span>
      ),
    },
    {
      key: 'commercialApproved',
      header: t('salesOrders.columns.commercialApproved'),
      render: (_: unknown, order: SalesOrder) =>
        tick(!!order.commercialApprovedAt, 'tick-commercial'),
    },
    {
      key: 'financialApproved',
      header: t('salesOrders.columns.financialApproved'),
      render: (_: unknown, order: SalesOrder) =>
        tick(!!order.financialApprovedAt, 'tick-financial'),
    },
    {
      key: 'needsAdvanceInvoice',
      header: t('salesOrders.columns.needsAdvanceInvoice'),
      render: (_: unknown, order: SalesOrder) =>
        tick(!!order.needsAdvanceInvoice, 'tick-advance'),
    },
    {
      key: 'invoiceSent',
      header: t('salesOrders.columns.invoiceSent'),
      render: (_: unknown, order: SalesOrder) =>
        tick(!!order.invoiceSent, 'tick-invoice'),
    },
    {
      key: 'fulfilled',
      header: t('salesOrders.columns.fulfilled'),
      render: (_: unknown, order: SalesOrder) =>
        tick(!!order.fulfilledAt, 'tick-fulfilled'),
    },
    {
      key: 'voided',
      header: t('salesOrders.columns.voided'),
      render: (_: unknown, order: SalesOrder) =>
        tick(!!order.voidedAt, 'tick-voided'),
    },
    // Column 16 — absent from the DOM without `prices.visible`
    // (PedidosForm.cs:233-237), never merely blanked.
    ...(has(PRICES_CODE)
      ? [
          {
            key: 'price',
            header: t('salesOrders.columns.price'),
            sortable: true,
            render: (_: unknown, order: SalesOrder) => (
              <span className="text-sm text-secondary-900" data-testid="order-price">
                {formatMoney(order.price)}
              </span>
            ),
          },
        ]
      : []),
    {
      key: 'actions',
      header: t('salesOrders.columns.actions'),
      render: (_: unknown, order: SalesOrder) => (
        <div className="flex items-center space-x-2">
          {/* Cumplir / Anular without opening the form — the fulfillment
              feature's component, mounted verbatim. */}
          <SalesOrderLifecycleQuickActions
            order={order}
            onChanged={patchRow}
            onError={setActionError}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              navigate(`/sales-orders/${order.uuid}/production-orders`)
            }
            title={t('salesOrders.viewProductionOrders')}
            data-testid="view-production-orders-btn"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/sales-orders/${order.uuid}`)}
            title={t('salesOrders.editOrder')}
            data-testid="edit-btn"
          >
            <Edit className="h-4 w-4" />
          </Button>
          {/* Absent from the DOM without `orders.delete`, the code the API
              requires — the same rule the Precio column follows. */}
          {has(DELETE_CODE) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(order.uuid)}
              className="text-red-600 hover:text-red-700"
              title={t('salesOrders.deleteOrder')}
              data-testid="delete-btn"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4" data-testid="sales-orders-grid">
      <SalesOrdersFilterBar
        value={bar}
        onChange={applyFilters}
        search={list.search}
        onSearchChange={list.setSearch}
        onClear={clearAll}
        companyId={effectiveCompanyId}
      />

      {actionError && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          data-testid="sales-orders-action-error"
        >
          {actionError}
        </div>
      )}

      {list.error && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          data-testid="sales-orders-error"
        >
          {list.error}
        </div>
      )}

      <div className="rounded-lg border border-secondary-200 bg-white shadow-sm">
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-secondary-900">
              {t('salesOrders.allOrders')} ({list.pagination.total})
            </h2>
          </div>

          {list.loading ? (
            <div
              className="flex h-32 items-center justify-center"
              data-testid="sales-orders-loading"
            >
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
            </div>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center" data-testid="sales-orders-empty">
              <h3 className="text-sm font-medium text-secondary-900">
                {t('salesOrders.empty.title')}
              </h3>
              <p className="mt-1 text-sm text-secondary-500">
                {t('salesOrders.empty.description')}
              </p>
            </div>
          ) : (
            <>
              <Table
                columns={columns}
                data={rows}
                sortBy={list.sortBy}
                sortOrder={list.sortOrder}
                          onSort={(field, order) =>
                  list.setSort(
                    (SORTABLE as readonly string[]).includes(field)
                      ? field
                      : null,
                    order,
                  )
                }
              />
              <Pagination {...list.paginationProps} />
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={confirmModal.handleClose}
        onConfirm={confirmModal.handleConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        loading={confirmModal.loading}
      />
    </div>
  );
};

export default SalesOrdersGrid;
