import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Printer, Send, Trash2, Undo2, X } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import ActionButton from '../components/ui/ActionButton';
import ConfirmModal from '../components/ui/ConfirmModal';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Skeleton } from '../components/ui/Skeleton';
import { FilterBar, searchFilter } from '../components/ui/filters';
import { FilterDef } from '../components/ui/filters/types';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import { usePermissions } from '../hooks/usePermissions';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import { machinesApi, supplierPurchaseOrdersApi } from '../services/api';
import { SupplierMachineRef, SupplierPoolRow, SupplierPurchaseOrder } from '../types';
import { formatBusinessDate } from '../utils/dates';
import { logger } from '../utils/logger';

const POOL_STATUSES = ['unassigned', 'in-draft'] as const;

const TONE: Record<string, string> = {
  unassigned: 'bg-secondary-100 text-secondary-700',
  'in-draft': 'bg-amber-100 text-amber-700',
  draft: 'bg-secondary-100 text-secondary-700',
  sent: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
};

export const Chip: React.FC<{ tone: string; children: React.ReactNode; testId?: string }> = ({ tone, children, testId }) => (
  <span
    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TONE[tone] ?? TONE.draft}`}
    data-testid={testId}
  >
    {children}
  </span>
);

const machineLabel = (m: SupplierMachineRef): string =>
  m.code && m.code !== m.supplier.code ? `${m.code} · ${m.supplier.code}` : m.supplier.code;

const num = (value: number | null | undefined): string => (value === null || value === undefined ? '-' : String(value));

/** Suppliers that have a machine mapped to them — the options of the "Proveedor" filter on Programas and Seguimiento. */
export const useSupplierFilterOptions = (companyParams: { companyId?: string }): { value: string; label: string }[] => {
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const { companyId } = companyParams;
  useEffect(() => {
    let cancelled = false;
    machinesApi
      .getMachines({ limit: 100, ...(companyId ? { companyId } : {}) })
      .then((page) => {
        if (cancelled) return;
        const bySupplier = new Map<string, string>();
        for (const m of page.data) if (m.supplier) bySupplier.set(m.supplier.uuid, m.supplier.code);
        setOptions(Array.from(bySupplier.entries()).map(([value, label]) => ({ value, label })));
      })
      .catch((err) => logger.error('Error loading supplier machines:', err));
    return () => {
      cancelled = true;
    };
  }, [companyId]);
  return options;
};

/** Draft PO card: edit line quantities, drop lines, delete, send, print. */
const DraftPurchaseOrderCard: React.FC<{
  order: SupplierPurchaseOrder;
  canSend: boolean;
  onChanged: () => void;
  onDelete: (order: SupplierPurchaseOrder) => void;
}> = ({ order, canSend, onChanged, onDelete }) => {
  const { t } = useTranslation();
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lines = useMemo(() => order.lines ?? [], [order.lines]);
  const keptLines = lines.filter((l) => !removed.has(l.productionOrder.uuid));
  const dirty = removed.size > 0 || lines.some((l) => quantities[l.productionOrder.uuid] !== undefined && Number(quantities[l.productionOrder.uuid]) !== l.quantity);
  const invalidQuantity = keptLines.some((l) => {
    const raw = quantities[l.productionOrder.uuid];
    return raw !== undefined && !(Number(raw) > 0);
  });

  const save = async (): Promise<boolean> => {
    setBusy(true);
    setError(null);
    try {
      await supplierPurchaseOrdersApi.updatePurchaseOrder(order.uuid, {
        lines: keptLines.map((l) => ({
          productionOrderUuid: l.productionOrder.uuid,
          quantity: quantities[l.productionOrder.uuid] !== undefined ? Number(quantities[l.productionOrder.uuid]) : l.quantity,
          ...(l.deliveryDate ? { deliveryDate: l.deliveryDate } : {}),
        })),
      });
      setQuantities({});
      setRemoved(new Set());
      onChanged();
      return true;
    } catch (err: any) {
      logger.error('Error saving supplier purchase order:', err);
      setError(err?.response?.data?.message || t('supplierPrograms.saveFailed'));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    if (dirty && !(await save())) return;
    setBusy(true);
    setError(null);
    try {
      await supplierPurchaseOrdersApi.send(order.uuid);
      onChanged();
    } catch (err: any) {
      logger.error('Error sending supplier purchase order:', err);
      const data = err?.response?.data;
      const details: { productionOrderNumber: string; reason: string }[] = Array.isArray(data?.details) ? data.details : [];
      const listed = details
        .map((d) => `${d.productionOrderNumber} (${t(`supplierPrograms.notReady.${d.reason}`, { defaultValue: d.reason })})`)
        .join(', ');
      setError([data?.message || t('supplierPrograms.sendFailed'), listed].filter(Boolean).join(': '));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-secondary-200 bg-white shadow-sm" data-testid={`draft-po-${order.uuid}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-secondary-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-secondary-900">
            {t('supplierPrograms.poTitle', { number: order.number, supplier: order.supplier.code })}
          </span>
          <Chip tone="draft">{t('supplierPrograms.poStatus.draft')}</Chip>
          <span className="text-xs text-secondary-500">{order.machine.code}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/supplier-programs/${order.uuid}/print`, '_blank')}
            data-testid={`print-po-${order.uuid}`}
          >
            <Printer className="mr-1 h-4 w-4" />
            {t('supplierPrograms.print')}
          </Button>
          {dirty && (
            <Button size="sm" variant="secondary" onClick={save} disabled={busy || invalidQuantity || keptLines.length === 0} data-testid={`save-po-${order.uuid}`}>
              {t('common.save')}
            </Button>
          )}
          {canSend && (
            <Button size="sm" onClick={send} disabled={busy || invalidQuantity || keptLines.length === 0} data-testid={`send-po-${order.uuid}`}>
              <Send className="mr-1 h-4 w-4" />
              {t('supplierPrograms.send')}
            </Button>
          )}
          <Button size="sm" variant="danger" onClick={() => onDelete(order)} disabled={busy} data-testid={`delete-po-${order.uuid}`}>
            <Trash2 className="mr-1 h-4 w-4" />
            {t('common.delete')}
          </Button>
        </div>
      </div>
      <div className="p-4">
        <ErrorMessage message={error} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-secondary-200 text-left text-xs text-secondary-500">
                <th className="px-2 py-1">{t('supplierPrograms.lineColumns.date')}</th>
                <th className="px-2 py-1">{t('supplierPrograms.lineColumns.order')}</th>
                <th className="px-2 py-1">{t('supplierPrograms.lineColumns.board')}</th>
                <th className="px-2 py-1">{t('supplierPrograms.lineColumns.quantity')}</th>
                <th className="px-2 py-1">{t('supplierPrograms.lineColumns.length')}</th>
                <th className="px-2 py-1">{t('supplierPrograms.lineColumns.width')}</th>
                <th className="px-2 py-1">{t('supplierPrograms.lineColumns.scoreLines')}</th>
                <th className="px-2 py-1" />
              </tr>
            </thead>
            <tbody>
              {keptLines.map((l) => (
                <tr key={l.productionOrder.uuid} className="border-b border-secondary-100">
                  <td className="px-2 py-1">{formatBusinessDate(l.deliveryDate)}</td>
                  <td className="px-2 py-1">{l.orderNumber}</td>
                  <td className="px-2 py-1">{l.boardCode ?? '-'}</td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      className="input-field w-28"
                      value={quantities[l.productionOrder.uuid] ?? String(l.quantity)}
                      onChange={(e) => setQuantities((prev) => ({ ...prev, [l.productionOrder.uuid]: e.target.value }))}
                      aria-label={t('supplierPrograms.editQuantity', { number: l.orderNumber })}
                      data-testid={`po-line-quantity-${l.productionOrder.uuid}`}
                    />
                  </td>
                  <td className="px-2 py-1">{num(l.sheetLength)}</td>
                  <td className="px-2 py-1">{num(l.sheetWidth)}</td>
                  <td className="px-2 py-1">{l.scoreLines ?? '-'}</td>
                  <td className="px-2 py-1 text-right">
                    <ActionButton
                      label={t('supplierPrograms.removeLine', { number: l.orderNumber })}
                      tone="danger"
                      onClick={() => setRemoved((prev) => new Set(prev).add(l.productionOrder.uuid))}
                    >
                      <X className="h-4 w-4" />
                    </ActionButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {keptLines.length === 0 && <p className="mt-2 text-sm text-secondary-500">{t('supplierPrograms.noLinesLeft')}</p>}
      </div>
    </div>
  );
};

/**
 * Programas de corrugado para Terminadoras: the flat pool of production orders
 * (D-28), the draft purchase orders per supplier machine, and the sent ones.
 */
const SupplierPrograms: React.FC = () => {
  const { t } = useTranslation();
  const { has } = usePermissions();
  const { effectiveCompanyId } = useEffectiveCompany();
  const confirmModal = useConfirmModal();
  const canPlan = has('supplier-orders.plan');
  const canSend = has('supplier-orders.send');

  const [selected, setSelected] = useState<Map<string, SupplierPoolRow>>(new Map());
  const [targetMachine, setTargetMachine] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<SupplierPurchaseOrder[]>([]);
  const [sent, setSent] = useState<SupplierPurchaseOrder[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  const companyParams = useMemo(() => (effectiveCompanyId ? { companyId: effectiveCompanyId } : {}), [effectiveCompanyId]);
  const supplierOptions = useSupplierFilterOptions(companyParams);

  const fetchPool = useCallback(
    (params: Record<string, unknown>) => supplierPurchaseOrdersApi.getPool({ ...params, ...companyParams }),
    [companyParams],
  );

  const filterDefs = useMemo<FilterDef[]>(
    () => [
      searchFilter(t('supplierPrograms.searchPlaceholder')),
      {
        kind: 'select',
        key: 'supplierUuid',
        label: t('supplierPrograms.filters.supplier'),
        testId: 'filter-supplier',
        options: supplierOptions,
      },
      {
        kind: 'select',
        key: 'status',
        label: t('supplierPrograms.filters.status'),
        testId: 'filter-status',
        options: POOL_STATUSES.map((s) => ({ value: s, label: t(`supplierPrograms.poolStatus.${s}`) })),
      },
    ],
    [t, supplierOptions],
  );

  const pool = useEntityList<SupplierPoolRow>({ fetchFn: fetchPool, filterDefs });

  const loadOrders = useCallback(async () => {
    setPostsLoading(true);
    try {
      const [draftPage, sentPage] = await Promise.all([
        supplierPurchaseOrdersApi.getPurchaseOrders({ status: 'draft', limit: 100, ...companyParams }),
        supplierPurchaseOrdersApi.getPurchaseOrders({ status: 'sent', limit: 10, ...companyParams }),
      ]);
      const full = await Promise.all(draftPage.data.map((po) => supplierPurchaseOrdersApi.getPurchaseOrder(po.uuid, companyParams)));
      setDrafts(full);
      setSent(sentPage.data);
    } catch (err: any) {
      logger.error('Error loading supplier purchase orders:', err);
      setError(err?.response?.data?.message || t('supplierPrograms.loadFailed'));
    } finally {
      setPostsLoading(false);
    }
  }, [companyParams, t]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadOrders(), pool.refresh()]);
  }, [loadOrders, pool]);

  const selectedRows = useMemo(() => Array.from(selected.values()), [selected]);
  const commonMachines = useMemo<SupplierMachineRef[]>(() => {
    if (selectedRows.length === 0) return [];
    return selectedRows[0].candidateMachines.filter((m) => selectedRows.every((r) => r.candidateMachines.some((c) => c.uuid === m.uuid)));
  }, [selectedRows]);

  useEffect(() => {
    if (commonMachines.length === 0) {
      setTargetMachine('');
      return;
    }
    setTargetMachine((current) => {
      if (commonMachines.some((m) => m.uuid === current)) return current;
      const suggested = selectedRows[0]?.suggestedMachine?.uuid;
      return commonMachines.find((m) => m.uuid === suggested)?.uuid ?? commonMachines[0].uuid;
    });
  }, [commonMachines, selectedRows]);

  const eligible = (row: SupplierPoolRow) => row.status === 'unassigned' && !row.notReady && row.candidateMachines.length > 0;

  const toggle = (row: SupplierPoolRow) =>
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(row.productionOrder.uuid)) next.delete(row.productionOrder.uuid);
      else next.set(row.productionOrder.uuid, row);
      return next;
    });

  const selectPage = () =>
    setSelected((prev) => {
      const next = new Map(prev);
      for (const row of pool.data) if (eligible(row)) next.set(row.productionOrder.uuid, row);
      return next;
    });

  /** Orders for a supplier machine that already has a draft join it instead of opening a second draft. */
  const addToPurchaseOrder = async () => {
    if (!targetMachine || selectedRows.length === 0) return;
    setAdding(true);
    setError(null);
    setNotice(null);
    try {
      const uuids = selectedRows.map((r) => r.productionOrder.uuid);
      const existing = drafts.find((d) => d.machine.uuid === targetMachine);
      if (existing) {
        await supplierPurchaseOrdersApi.updatePurchaseOrder(existing.uuid, {
          lines: [
            ...(existing.lines ?? []).map((l) => ({
              productionOrderUuid: l.productionOrder.uuid,
              quantity: l.quantity,
              ...(l.deliveryDate ? { deliveryDate: l.deliveryDate } : {}),
            })),
            ...uuids.map((productionOrderUuid) => ({ productionOrderUuid })),
          ],
        });
      } else {
        await supplierPurchaseOrdersApi.createPurchaseOrder({
          machineUuid: targetMachine,
          productionOrderUuids: uuids,
          ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}),
        });
      }
      setSelected(new Map());
      setNotice(t('supplierPrograms.added', { count: uuids.length }));
      await refreshAll();
    } catch (err: any) {
      logger.error('Error adding orders to a supplier purchase order:', err);
      setError(err?.response?.data?.message || t('supplierPrograms.addFailed'));
    } finally {
      setAdding(false);
    }
  };

  const deleteDraft = (order: SupplierPurchaseOrder) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('supplierPrograms.deleteConfirm', { number: order.number }),
      variant: 'danger',
      onConfirm: async () => {
        try {
          setError(null);
          await supplierPurchaseOrdersApi.deletePurchaseOrder(order.uuid);
          await refreshAll();
        } catch (err: any) {
          logger.error('Error deleting supplier purchase order:', err);
          setError(err?.response?.data?.message || t('supplierPrograms.deleteFailed'));
        }
      },
    });
  };

  const unsend = async (order: SupplierPurchaseOrder) => {
    setError(null);
    try {
      await supplierPurchaseOrdersApi.unsend(order.uuid);
      await refreshAll();
    } catch (err: any) {
      logger.error('Error unsending supplier purchase order:', err);
      setError(err?.response?.data?.message || t('supplierPrograms.unsendFailed'));
    }
  };

  const columns = [
    {
      key: 'select',
      header: '',
      label: t('supplierPrograms.columns.select'),
      pinned: true,
      render: (_: unknown, row: SupplierPoolRow) => (
        <input
          type="checkbox"
          checked={selected.has(row.productionOrder.uuid)}
          disabled={!canPlan || !eligible(row)}
          onChange={() => toggle(row)}
          aria-label={t('supplierPrograms.selectOrder', { number: row.productionOrder.number })}
          data-testid={`pool-select-${row.productionOrder.uuid}`}
        />
      ),
    },
    {
      key: 'number',
      header: t('supplierPrograms.columns.order'),
      sortable: true,
      hideable: false,
      card: 'title' as const,
      render: (_: unknown, row: SupplierPoolRow) => <span className="text-sm font-medium text-secondary-900">{row.productionOrder.number}</span>,
    },
    {
      key: 'customerName',
      header: t('supplierPrograms.columns.customer'),
      sortable: true,
      render: (_: unknown, row: SupplierPoolRow) => <span className="text-sm text-secondary-700">{row.customer?.name ?? '-'}</span>,
    },
    {
      key: 'productCode',
      header: t('supplierPrograms.columns.product'),
      sortable: true,
      render: (_: unknown, row: SupplierPoolRow) => <span className="text-sm text-secondary-700">{row.product.code}</span>,
    },
    {
      key: 'quantity',
      header: t('supplierPrograms.columns.quantity'),
      render: (_: unknown, row: SupplierPoolRow) => (
        <span className="text-sm text-secondary-700">
          {row.orderQuantity} / {Math.ceil(row.requiredSheets)}
        </span>
      ),
    },
    {
      key: 'board',
      header: t('supplierPrograms.columns.board'),
      render: (_: unknown, row: SupplierPoolRow) => <span className="text-sm text-secondary-700">{row.boardCode ?? '-'}</span>,
    },
    {
      key: 'sheet',
      header: t('supplierPrograms.columns.sheet'),
      render: (_: unknown, row: SupplierPoolRow) => (
        <span className="text-sm text-secondary-700">
          {row.sheetLength !== null && row.sheetWidth !== null ? `${row.sheetLength} × ${row.sheetWidth}` : '-'}
        </span>
      ),
    },
    {
      key: 'deliveryDate',
      header: t('supplierPrograms.columns.deliveryDate'),
      sortable: true,
      render: (_: unknown, row: SupplierPoolRow) => <span className="text-sm text-secondary-500">{formatBusinessDate(row.deliveryDate)}</span>,
    },
    {
      key: 'supplier',
      header: t('supplierPrograms.columns.supplier'),
      render: (_: unknown, row: SupplierPoolRow) => (
        <span className="text-sm text-secondary-700">
          {row.purchaseOrder ? row.purchaseOrder.supplier.code : row.suggestedMachine ? machineLabel(row.suggestedMachine) : '-'}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('supplierPrograms.columns.status'),
      render: (_: unknown, row: SupplierPoolRow) => (
        <div className="flex flex-wrap items-center gap-1">
          <Chip tone={row.status} testId={`pool-status-${row.productionOrder.uuid}`}>
            {row.purchaseOrder
              ? t('supplierPrograms.inDraftPo', { number: row.purchaseOrder.number })
              : t(`supplierPrograms.poolStatus.${row.status}`)}
          </Chip>
          {row.notReady && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              {t(`supplierPrograms.notReady.${row.notReady}`)}
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="space-y-6" data-testid="supplier-programs">
        <div>
          <h1 className="gd-page-title">{t('supplierPrograms.title')}</h1>
          <p className="text-secondary-600">{t('supplierPrograms.subtitle')}</p>
        </div>

        <ErrorMessage message={error} />
        {notice && (
          <p className="text-sm text-green-700" data-testid="supplier-programs-notice">
            {notice}
          </p>
        )}

        <div className="rounded-lg border border-secondary-200 bg-white p-4 shadow-sm">
          <FilterBar {...pool.filterBarProps} />
        </div>

        {canPlan && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-secondary-200 bg-white p-3 shadow-sm" data-testid="pool-add-bar">
            <Button variant="outline" size="sm" onClick={selectPage} data-testid="pool-select-page-btn">
              {t('supplierPrograms.selectPage')}
            </Button>
            <span className="text-sm text-secondary-700" data-testid="pool-selected-count">
              {t('supplierPrograms.selectedCount', { count: selected.size })}
            </span>
            {selected.size > 0 && (
              <>
                <Button variant="ghost" size="sm" onClick={() => setSelected(new Map())}>
                  {t('supplierPrograms.clearSelection')}
                </Button>
                {commonMachines.length > 0 ? (
                  <>
                    <select
                      className="input-field w-56"
                      value={targetMachine}
                      onChange={(e) => setTargetMachine(e.target.value)}
                      aria-label={t('supplierPrograms.targetMachine')}
                      data-testid="pool-target-machine"
                    >
                      {commonMachines.map((m) => (
                        <option key={m.uuid} value={m.uuid}>
                          {machineLabel(m)}
                        </option>
                      ))}
                    </select>
                    <Button size="sm" onClick={addToPurchaseOrder} loading={adding} disabled={adding || !targetMachine} data-testid="pool-add-btn">
                      {t('supplierPrograms.addToPo')}
                    </Button>
                  </>
                ) : (
                  <span className="text-sm text-amber-700">{t('supplierPrograms.noCommonMachine')}</span>
                )}
              </>
            )}
          </div>
        )}

        <div className="rounded-lg border border-secondary-200 bg-white shadow-sm">
          <div className="p-6">
            <Table
              columns={columns}
              data={pool.data}
              loading={pool.loading}
              emptyMessage={t('supplierPrograms.emptyPool')}
              sortBy={pool.sortBy}
              sortOrder={pool.sortOrder}
              onSort={pool.setSort}
              listId="supplier-programs-pool"
            />
            <Pagination {...pool.paginationProps} />
          </div>
        </div>

        <section className="space-y-3" data-testid="draft-orders">
          <h2 className="text-lg font-semibold text-secondary-900">{t('supplierPrograms.draftsTitle')}</h2>
          {postsLoading ? (
            <Skeleton lines={4} data-testid="supplier-orders-loading" />
          ) : drafts.length === 0 ? (
            <p className="text-sm text-secondary-500">{t('supplierPrograms.noDrafts')}</p>
          ) : (
            drafts.map((order) => (
              <DraftPurchaseOrderCard key={`${order.uuid}-${order.updatedAt}`} order={order} canSend={canSend} onChanged={refreshAll} onDelete={deleteDraft} />
            ))
          )}
        </section>

        <section className="space-y-3" data-testid="sent-orders">
          <h2 className="text-lg font-semibold text-secondary-900">{t('supplierPrograms.sentTitle')}</h2>
          {!postsLoading && sent.length === 0 ? (
            <p className="text-sm text-secondary-500">{t('supplierPrograms.noSent')}</p>
          ) : (
            <div className="divide-y divide-secondary-100 rounded-lg border border-secondary-200 bg-white shadow-sm">
              {sent.map((order) => (
                <div key={order.uuid} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm" data-testid={`sent-po-${order.uuid}`}>
                  <span>
                    {t('supplierPrograms.poTitle', { number: order.number, supplier: order.supplier.code })} · {order.lineCount ?? 0} {t('supplierPrograms.linesSuffix')}
                  </span>
                  <div className="flex items-center gap-2">
                    <Chip tone="sent">{t('supplierPrograms.poStatus.sent')}</Chip>
                    <Button variant="outline" size="sm" onClick={() => window.open(`/supplier-programs/${order.uuid}/print`, '_blank')}>
                      <Printer className="mr-1 h-4 w-4" />
                      {t('supplierPrograms.print')}
                    </Button>
                    {canSend && (
                      <Button variant="ghost" size="sm" onClick={() => unsend(order)} data-testid={`unsend-po-${order.uuid}`}>
                        <Undo2 className="mr-1 h-4 w-4" />
                        {t('supplierPrograms.unsend')}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
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
    </Layout>
  );
};

export default SupplierPrograms;
