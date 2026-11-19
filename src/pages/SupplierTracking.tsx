import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PackageCheck, Lock } from 'lucide-react';
import Layout from '../components/layout/Layout';
import ActionButton from '../components/ui/ActionButton';
import ConfirmModal from '../components/ui/ConfirmModal';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { FilterBar, searchFilter } from '../components/ui/filters';
import { FilterDef } from '../components/ui/filters/types';
import ReceiptModal, { formatUnits } from '../components/supplier-orders/ReceiptModal';
import { Chip, useSupplierFilterOptions } from './SupplierPrograms';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import { usePermissions } from '../hooks/usePermissions';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import { supplierPurchaseOrdersApi } from '../services/api';
import { SUPPLIER_PO_LINE_STATUSES, SupplierTrackingLine } from '../types';
import { formatBusinessDate } from '../utils/dates';
import { logger } from '../utils/logger';

const LINE_TONE: Record<string, string> = {
  pending: 'draft',
  partial: 'in-draft',
  completed: 'completed',
};

/** Seguimiento: the lines of sent purchase orders, with receipts, mismatch confirmation and closing short lines. */
const SupplierTracking: React.FC = () => {
  const { t } = useTranslation();
  const { has } = usePermissions();
  const { effectiveCompanyId } = useEffectiveCompany();
  const confirmModal = useConfirmModal();
  const canReceive = has('supplier-orders.receive');

  const [receiptLine, setReceiptLine] = useState<SupplierTrackingLine | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [poOptions, setPoOptions] = useState<{ value: string; label: string }[]>([]);

  const companyParams = useMemo(() => (effectiveCompanyId ? { companyId: effectiveCompanyId } : {}), [effectiveCompanyId]);
  const supplierOptions = useSupplierFilterOptions(companyParams);

  const loadPoOptions = useCallback(async () => {
    try {
      const [sentPage, donePage] = await Promise.all([
        supplierPurchaseOrdersApi.getPurchaseOrders({ status: 'sent', limit: 100, ...companyParams }),
        supplierPurchaseOrdersApi.getPurchaseOrders({ status: 'completed', limit: 100, ...companyParams }),
      ]);
      setPoOptions(
        [...sentPage.data, ...donePage.data].map((po) => ({
          value: po.uuid,
          label: t('supplierPrograms.poTitle', { number: po.number, supplier: po.supplier.code }),
        })),
      );
    } catch (err) {
      logger.error('Error loading purchase order filter options:', err);
    }
  }, [companyParams, t]);

  useEffect(() => {
    loadPoOptions();
  }, [loadPoOptions]);

  const fetchLines = useCallback(
    (params: Record<string, unknown>) => supplierPurchaseOrdersApi.getLines({ ...params, ...companyParams }),
    [companyParams],
  );

  const filterDefs = useMemo<FilterDef[]>(
    () => [
      searchFilter(t('supplierTracking.searchPlaceholder')),
      { kind: 'select', key: 'supplierUuid', label: t('supplierTracking.filters.supplier'), testId: 'filter-supplier', options: supplierOptions },
      { kind: 'select', key: 'purchaseOrderUuid', label: t('supplierTracking.filters.purchaseOrder'), testId: 'filter-po', options: poOptions },
      {
        kind: 'select',
        key: 'status',
        label: t('supplierTracking.filters.status'),
        testId: 'filter-status',
        options: SUPPLIER_PO_LINE_STATUSES.map((s) => ({ value: s, label: t(`supplierTracking.lineStatus.${s}`) })),
      },
    ],
    [t, supplierOptions, poOptions],
  );

  const list = useEntityList<SupplierTrackingLine>({ fetchFn: fetchLines, filterDefs });

  const closeShort = (line: SupplierTrackingLine) => {
    confirmModal.showConfirm({
      title: t('supplierTracking.closeTitle'),
      message: t('supplierTracking.closeConfirm', { number: line.orderNumber, received: line.receivedQuantity, ordered: line.quantity }),
      variant: 'warning',
      onConfirm: async () => {
        try {
          setError(null);
          await supplierPurchaseOrdersApi.closeLine(line.uuid);
          await list.refresh();
        } catch (err: any) {
          logger.error('Error closing supplier line:', err);
          setError(err?.response?.data?.message || t('supplierTracking.closeFailed'));
        }
      },
    });
  };

  const onReceiptSaved = async () => {
    setReceiptLine(null);
    setNotice(t('supplierTracking.receipt.saved'));
    await list.refresh();
  };

  const columns = [
    {
      key: 'purchaseOrderNumber',
      header: t('supplierTracking.columns.purchaseOrder'),
      sortable: true,
      hideable: false,
      card: 'title' as const,
      render: (_: unknown, l: SupplierTrackingLine) => (
        <span className="text-sm font-medium text-secondary-900">
          #{l.purchaseOrder.number}
        </span>
      ),
    },
    {
      key: 'supplierCode',
      header: t('supplierTracking.columns.supplier'),
      sortable: true,
      render: (_: unknown, l: SupplierTrackingLine) => <span className="text-sm text-secondary-700">{l.supplier.code}</span>,
    },
    {
      key: 'orderNumber',
      header: t('supplierTracking.columns.order'),
      sortable: true,
      render: (_: unknown, l: SupplierTrackingLine) => <span className="text-sm text-secondary-900">{l.orderNumber}</span>,
    },
    {
      key: 'customer',
      header: t('supplierTracking.columns.customer'),
      render: (_: unknown, l: SupplierTrackingLine) => <span className="text-sm text-secondary-700">{l.customer?.name ?? '-'}</span>,
    },
    {
      key: 'product',
      header: t('supplierTracking.columns.product'),
      render: (_: unknown, l: SupplierTrackingLine) => <span className="text-sm text-secondary-700">{l.product.code}</span>,
    },
    {
      key: 'board',
      header: t('supplierTracking.columns.board'),
      render: (_: unknown, l: SupplierTrackingLine) => <span className="text-sm text-secondary-700">{l.boardCode ?? '-'}</span>,
    },
    {
      key: 'quantity',
      header: t('supplierTracking.columns.ordered'),
      render: (_: unknown, l: SupplierTrackingLine) => (
        <span className="text-sm text-secondary-700">
          {l.quantity}
          {l.sheetsPerUnit ? (
            <span className="block text-xs text-secondary-500" data-testid={`line-ordered-units-${l.uuid}`}>
              {t('supplierTracking.units', { count: formatUnits(l.quantity / l.sheetsPerUnit) })}
            </span>
          ) : null}
        </span>
      ),
    },
    {
      key: 'receivedQuantity',
      header: t('supplierTracking.columns.received'),
      render: (_: unknown, l: SupplierTrackingLine) => (
        <span className="text-sm text-secondary-700" data-testid={`line-received-${l.uuid}`}>
          {l.receivedQuantity}
          {l.receivedUnits !== undefined && (
            <span className="block text-xs text-secondary-500" data-testid={`line-received-units-${l.uuid}`}>
              {t('supplierTracking.units', { count: formatUnits(l.receivedUnits) })}
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'deliveryDate',
      header: t('supplierTracking.columns.deliveryDate'),
      sortable: true,
      render: (_: unknown, l: SupplierTrackingLine) => <span className="text-sm text-secondary-500">{formatBusinessDate(l.deliveryDate)}</span>,
    },
    {
      key: 'status',
      header: t('supplierTracking.columns.status'),
      sortable: true,
      render: (_: unknown, l: SupplierTrackingLine) => (
        <Chip tone={LINE_TONE[l.status] ?? 'draft'} testId={`line-status-${l.uuid}`}>
          {t(`supplierTracking.lineStatus.${l.status}`)}
        </Chip>
      ),
    },
    {
      key: 'actions',
      header: t('supplierTracking.columns.actions'),
      pinned: true,
      card: 'actions' as const,
      render: (_: unknown, l: SupplierTrackingLine) =>
        canReceive && l.status !== 'completed' ? (
          <div className="flex items-center space-x-2">
            <ActionButton label={t('supplierTracking.registerReceipt')} onClick={() => setReceiptLine(l)} data-testid={`register-receipt-${l.uuid}`}>
              <PackageCheck className="h-4 w-4" />
            </ActionButton>
            {l.status === 'partial' && (
              <ActionButton label={t('supplierTracking.closeShort')} onClick={() => closeShort(l)} data-testid={`close-line-${l.uuid}`}>
                <Lock className="h-4 w-4" />
              </ActionButton>
            )}
          </div>
        ) : null,
    },
  ];

  return (
    <Layout>
      <div className="space-y-6" data-testid="supplier-tracking">
        <div>
          <h1 className="gd-page-title">{t('supplierTracking.title')}</h1>
          <p className="text-secondary-600">{t('supplierTracking.subtitle')}</p>
        </div>

        <ErrorMessage message={error} />
        {notice && (
          <p className="text-sm text-green-700" data-testid="supplier-tracking-notice">
            {notice}
          </p>
        )}

        <div className="rounded-lg border border-secondary-200 bg-white p-4 shadow-sm">
          <FilterBar {...list.filterBarProps} />
        </div>

        <div className="rounded-lg border border-secondary-200 bg-white shadow-sm">
          <div className="p-6">
            <Table
              columns={columns}
              data={list.data}
              loading={list.loading}
              emptyMessage={t('supplierTracking.empty')}
              sortBy={list.sortBy}
              sortOrder={list.sortOrder}
              onSort={list.setSort}
              listId="supplier-tracking"
            />
            <Pagination {...list.paginationProps} />
          </div>
        </div>
      </div>

      <ReceiptModal isOpen={Boolean(receiptLine)} line={receiptLine} onClose={() => setReceiptLine(null)} onSuccess={onReceiptSaved} />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={confirmModal.handleClose}
        onConfirm={confirmModal.handleConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        loading={confirmModal.loading}
      />
    </Layout>
  );
};

export default SupplierTracking;
