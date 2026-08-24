import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Clock, Trash2, XCircle } from 'lucide-react';
import Button from '../ui/Button';
import Table from '../ui/Table';
import Pagination from '../ui/Pagination';
import { SearchInput } from '../ui/SearchInput';
import ConfirmModal from '../ui/ConfirmModal';
import Modal from '../ui/Modal';
import GenerateOrdersDialog from './GenerateOrdersDialog';
import ProductionOrderLifecycleControl from './ProductionOrderLifecycleControl';
import { ProductionOrder, SalesOrder } from '../../types';
import { productionOrdersApi, salesOrdersApi } from '../../services/api';
import { useEntityList } from '../../hooks/useEntityList';
import { useConfirmModal } from '../../hooks/useConfirmModal';
import { usePermissions } from '../../hooks/usePermissions';
import useEffectiveCompany from '../../hooks/useEffectiveCompany';
import { formatBusinessDate } from '../../utils/dates';
import { logger } from '../../utils/logger';

interface Props {
  /** When set: the grid embedded on a pedido, scoped to that pedido's orders. */
  salesOrderUuid?: string;
  /** Compact mode hides the filter bar (embedded usage). */
  compact?: boolean;
  /** Fired after any mutation that changes the order set. */
  onOrdersChanged?: () => void;
}

const stateChip = (
  at: string | null | undefined,
  cancelledAt: string | null | undefined,
) =>
  at ? (
    <CheckCircle2 className="inline h-4 w-4 text-green-600" />
  ) : cancelledAt ? (
    <XCircle className="inline h-4 w-4 text-red-600" />
  ) : (
    <Clock className="inline h-4 w-4 text-secondary-400" />
  );

/**
 * Órdenes de producción list — used standalone (/production-orders) and
 * embedded under a pedido. Columns mirror `OrdenesAsociadasForm`:
 * Número, Pedido, Cliente, Producto, Descripción, Cantidad, Fecha, F. entrega,
 * A/P (habilitación) and Cumpl.
 */
const ProductionOrdersGrid: React.FC<Props> = ({
  salesOrderUuid,
  compact = false,
  onOrdersChanged,
}) => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const { has } = usePermissions();
  const confirmModal = useConfirmModal();
  const [schedulingState, setSchedulingState] = useState('');
  const [completionState, setCompletionState] = useState('');
  const [voidState, setVoidState] = useState('');
  const [deliveryDateFrom, setDeliveryDateFrom] = useState('');
  const [deliveryDateTo, setDeliveryDateTo] = useState('');
  const [generateFor, setGenerateFor] = useState<string | null>(null);
  const [detail, setDetail] = useState<ProductionOrder | null>(null);
  /** Standalone page only: the pedido the manual "Generar órdenes" acts on. */
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [pickedSalesOrder, setPickedSalesOrder] = useState('');

  const fetchOrders = useCallback(
    (params: Record<string, unknown>) => {
      const query: Record<string, unknown> = { ...params };
      if (effectiveCompanyId) query.companyId = effectiveCompanyId;
      if (salesOrderUuid) query.salesOrderUuid = salesOrderUuid;
      if (schedulingState) query.schedulingState = schedulingState;
      if (completionState) query.completionState = completionState;
      if (voidState) query.voidState = voidState;
      if (deliveryDateFrom) query.deliveryDateFrom = deliveryDateFrom;
      if (deliveryDateTo) query.deliveryDateTo = deliveryDateTo;
      return productionOrdersApi.getProductionOrders(query);
    },
    [
      effectiveCompanyId,
      salesOrderUuid,
      schedulingState,
      completionState,
      voidState,
      deliveryDateFrom,
      deliveryDateTo,
    ],
  );

  const {
    filteredData: orders,
    loading,
    search,
    setSearch,
    refresh,
    paginationProps,
    sortBy,
    sortOrder,
    setSort,
  } = useEntityList<ProductionOrder>({
    fetchFn: fetchOrders,
    searchFields: ['number'],
  });

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    effectiveCompanyId,
    salesOrderUuid,
    schedulingState,
    completionState,
    voidState,
    deliveryDateFrom,
    deliveryDateTo,
  ]);

  // UI §7: the standalone page offers generation on demand, so it needs a
  // pedido to act on. Embedded under a pedido this list is already scoped.
  const canGenerate = has('production-orders.generate');
  useEffect(() => {
    if (salesOrderUuid || compact || !canGenerate) return;
    let cancelled = false;
    salesOrdersApi
      .getSalesOrders({ limit: 100, ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}) })
      .then((page) => {
        if (!cancelled) setSalesOrders(page.data || []);
      })
      .catch((err) => logger.error('Error loading sales orders:', err));
    return () => {
      cancelled = true;
    };
  }, [salesOrderUuid, compact, canGenerate, effectiveCompanyId]);

  const handleDelete = (order: ProductionOrder) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('productionOrders.deleteConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          await productionOrdersApi.deleteProductionOrder(order.uuid);
          await refresh();
          onOrdersChanged?.();
        } catch (err) {
          logger.error('Error deleting production order:', err);
        }
      },
    });
  };

  const columns = [
    {
      key: 'number',
      header: t('productionOrders.columns.number'),
      sortable: true,
      render: (_: any, o: ProductionOrder) => (
        <button
          type="button"
          className="text-sm font-medium text-primary-700 hover:underline"
          data-testid={`open-production-order-${o.uuid}`}
          onClick={() => setDetail(o)}
        >
          {o.number}
        </button>
      ),
    },
    {
      key: 'salesOrder',
      header: t('productionOrders.columns.salesOrder'),
      render: (_: any, o: ProductionOrder) => (
        <span className="text-sm text-secondary-600">
          {o.salesOrder?.number ?? o.orderData?.number ?? '-'}
        </span>
      ),
    },
    {
      key: 'customer',
      header: t('productionOrders.columns.customer'),
      render: (_: any, o: ProductionOrder) => (
        <span className="text-sm text-secondary-600">{o.customer?.name ?? '-'}</span>
      ),
    },
    {
      key: 'product',
      header: t('productionOrders.columns.product'),
      render: (_: any, o: ProductionOrder) => (
        <span className="text-sm text-secondary-600">{o.product?.code ?? '-'}</span>
      ),
    },
    {
      key: 'description',
      header: t('productionOrders.columns.description'),
      render: (_: any, o: ProductionOrder) => (
        <span className="text-sm text-secondary-600">{o.part?.description ?? '-'}</span>
      ),
    },
    {
      key: 'quantity',
      header: t('productionOrders.columns.quantity'),
      sortable: true,
      render: (_: any, o: ProductionOrder) => (
        <span className="text-sm text-secondary-900">{o.quantity}</span>
      ),
    },
    {
      key: 'orderDate',
      header: t('productionOrders.columns.orderDate'),
      sortable: true,
      render: (_: any, o: ProductionOrder) => (
        <span className="text-sm text-secondary-600" data-testid="order-date">
          {formatBusinessDate(o.orderDate)}
        </span>
      ),
    },
    {
      key: 'deliveryDate',
      header: t('productionOrders.columns.deliveryDate'),
      sortable: true,
      render: (_: any, o: ProductionOrder) => (
        <span
          className="text-sm text-secondary-600"
          data-testid="order-delivery-date"
        >
          {formatBusinessDate(o.deliveryDate)}
        </span>
      ),
    },
    {
      key: 'scheduling',
      header: t('productionOrders.columns.scheduling'),
      render: (_: any, o: ProductionOrder) =>
        stateChip(o.schedulingApprovedAt, o.schedulingCancelledAt),
    },
    {
      key: 'completion',
      header: t('productionOrders.columns.completion'),
      render: (_: any, o: ProductionOrder) =>
        stateChip(o.completedAt, o.completionCancelledAt),
    },
    {
      key: 'actions',
      header: t('productionOrders.columns.actions'),
      render: (_: any, o: ProductionOrder) => (
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600"
          title={t('productionOrders.deleteOrder') ?? ''}
          data-testid={`delete-production-order-${o.uuid}`}
          onClick={() => handleDelete(o)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-3" data-testid="production-orders-list">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {!compact && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-64">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('productionOrders.searchPlaceholder')}
              />
            </div>
            <select
              name="schedulingState"
              className="input-field"
              data-testid="filter-scheduling-state"
              value={schedulingState}
              onChange={(e) => setSchedulingState(e.target.value)}
            >
              <option value="">{t('productionOrders.filters.allScheduling')}</option>
              <option value="enabled">{t('productionOrders.filters.enabled')}</option>
              <option value="disabled">{t('productionOrders.filters.disabled')}</option>
            </select>
            <select
              name="completionState"
              className="input-field"
              data-testid="filter-completion-state"
              value={completionState}
              onChange={(e) => setCompletionState(e.target.value)}
            >
              <option value="">{t('productionOrders.filters.allCompletion')}</option>
              <option value="open">{t('productionOrders.filters.open')}</option>
              <option value="completed">{t('productionOrders.filters.completed')}</option>
            </select>
            <select
              name="voidState"
              className="input-field"
              data-testid="filter-void-state"
              value={voidState}
              onChange={(e) => setVoidState(e.target.value)}
            >
              <option value="">{t('productionOrders.filters.allVoid')}</option>
              <option value="active">{t('productionOrders.filters.active')}</option>
              <option value="voided">{t('productionOrders.filters.voided')}</option>
            </select>
            <input
              name="deliveryDateFrom"
              type="date"
              className="input-field"
              data-testid="filter-delivery-from"
              aria-label={t('productionOrders.filters.deliveryFrom')}
              value={deliveryDateFrom}
              onChange={(e) => setDeliveryDateFrom(e.target.value)}
            />
            <input
              name="deliveryDateTo"
              type="date"
              className="input-field"
              data-testid="filter-delivery-to"
              aria-label={t('productionOrders.filters.deliveryTo')}
              value={deliveryDateTo}
              onChange={(e) => setDeliveryDateTo(e.target.value)}
            />
          </div>
        )}
        {canGenerate && (
          <div className="flex items-center gap-2">
            {!salesOrderUuid && (
              <select
                name="salesOrderUuid"
                className="input-field"
                data-testid="generate-sales-order-select"
                aria-label={t('productionOrders.pickSalesOrder')}
                value={pickedSalesOrder}
                onChange={(e) => setPickedSalesOrder(e.target.value)}
              >
                <option value="">{t('productionOrders.pickSalesOrder')}</option>
                {salesOrders.map((order) => (
                  <option key={order.uuid} value={order.uuid}>
                    {order.number}
                  </option>
                ))}
              </select>
            )}
            <Button
              size="sm"
              disabled={!salesOrderUuid && !pickedSalesOrder}
              data-testid="generate-orders-btn"
              onClick={() => setGenerateFor(salesOrderUuid ?? pickedSalesOrder)}
            >
              {t('productionOrders.generateButton')}
            </Button>
          </div>
        )}
      </div>

      <Table
        columns={columns}
        data={orders}
        loading={loading}
        emptyMessage={t('productionOrders.empty')}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={setSort}
      />
      <Pagination {...paginationProps} />

      {generateFor && (
        <GenerateOrdersDialog
          salesOrderUuid={generateFor}
          open={!!generateFor}
          onClose={() => setGenerateFor(null)}
          onGenerated={() => {
            setGenerateFor(null);
            void refresh();
            onOrdersChanged?.();
          }}
        />
      )}

      {detail && (
        <Modal
          isOpen={!!detail}
          onClose={() => setDetail(null)}
          title={t('productionOrders.detailTitle', { number: detail.number })}
          size="lg"
        >
          <ProductionOrderLifecycleControl
            order={detail}
            onChanged={(updated) => {
              setDetail(updated);
              void refresh();
              onOrdersChanged?.();
            }}
          />
        </Modal>
      )}

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

export default ProductionOrdersGrid;
