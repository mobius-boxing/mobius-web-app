import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, Layers } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import { TableSkeleton } from '../components/ui/Skeleton';
import { SearchInput } from '../components/ui/SearchInput';
import CreatePlanModal from '../components/corrugator/CreatePlanModal';
import { corrugatorPlansApi } from '../services/api';
import { useEffectiveCompany } from '../hooks/useEffectiveCompany';
import { usePermissions } from '../hooks/usePermissions';
import { formatBusinessDate } from '../utils/dates';
import { logger } from '../utils/logger';
import { CorrugatorBoard, CorrugatorPool as CorrugatorPoolData } from '../types';

const NOT_PLANNABLE_REASON_KEY: Record<string, string> = {
  'no-sheet-dimensions': 'corrugatorPool.reasons.noSheetDimensions',
  'no-corrugation': 'corrugatorPool.reasons.noCorrugation',
  'within-tolerance': 'corrugatorPool.reasons.withinTolerance',
  'fully-allocated': 'corrugatorPool.reasons.fullyAllocated',
};

/** Card 1 "Agrupación de pedidos habilitados" — pool grouped by board key (D-10). */
const CorrugatorPool: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { has } = usePermissions();
  const { effectiveCompanyId } = useEffectiveCompany();
  const canCreate = has('corrugator.plan');

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pool, setPool] = useState<CorrugatorPoolData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});
  const [notPlannableOpen, setNotPlannableOpen] = useState(false);
  const [createFor, setCreateFor] = useState<{ board: CorrugatorBoard; uuids: string[] } | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handle);
  }, [search]);

  const fetchPool = () => {
    setLoading(true);
    setError(null);
    corrugatorPlansApi
      .getPool({
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}),
      })
      .then((data) => {
        setPool(data);
        setSelected({});
      })
      .catch((err) => {
        logger.error('Error loading corrugator pool:', err);
        setError(err?.response?.data?.message || t('corrugatorPool.loadFailed'));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPool();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, effectiveCompanyId]);

  const toggleOrder = (boardKey: string, orderUuid: string) => {
    setSelected((prev) => {
      const current = new Set(prev[boardKey] ?? []);
      if (current.has(orderUuid)) current.delete(orderUuid);
      else current.add(orderUuid);
      return { ...prev, [boardKey]: current };
    });
  };

  const notPlannable = pool?.notPlannable ?? [];

  return (
    <Layout>
      <div className="space-y-6" data-testid="corrugator-pool">
        <div>
          <h1 className="gd-page-title">{t('corrugatorPool.title')}</h1>
          <p className="text-secondary-600">{t('corrugatorPool.subtitle')}</p>
        </div>

        <SearchInput value={search} onChange={setSearch} placeholder={t('corrugatorPool.searchPlaceholder')} data-testid="corrugator-pool-search" />

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" data-testid="corrugator-pool-error">
            {error}
          </div>
        )}

        {loading ? (
          <TableSkeleton />
        ) : !pool || pool.groups.length === 0 ? (
          <div className="rounded-lg border border-secondary-200 bg-white p-12 text-center" data-testid="corrugator-pool-empty">
            <Layers className="mx-auto h-10 w-10 text-secondary-300" />
            <p className="mt-2 text-sm text-secondary-500">{t('corrugatorPool.empty')}</p>
          </div>
        ) : (
          pool.groups.map((group) => {
            const boardSelection = selected[group.board.key] ?? new Set<string>();
            return (
              <div key={group.board.key} className="rounded-lg border border-secondary-200 bg-white shadow-sm" data-testid="corrugator-pool-group">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-secondary-200 p-4">
                  <div>
                    <h2 className="text-base font-semibold text-secondary-900">
                      {group.board.fluteTypes.join(' / ') || t('corrugatorPool.noFluteType')}
                      {group.board.paperClasses.length > 0 && ` — ${group.board.paperClasses.map((p) => p.code).join(', ')}`}
                    </h2>
                    <p className="text-sm text-secondary-500">
                      {t('corrugatorPool.corrugations')}: {group.board.corrugations.map((c) => c.code).join(', ') || '-'}
                      {' · '}
                      {t('corrugatorPool.grammage')}: {group.board.theoreticalGrammage ?? '-'}
                    </p>
                  </div>
                  {canCreate && (
                    <Button
                      size="sm"
                      disabled={boardSelection.size === 0}
                      onClick={() => setCreateFor({ board: group.board, uuids: Array.from(boardSelection) })}
                      data-testid="create-plan-btn"
                    >
                      {t('corrugatorPool.createPlan')} ({boardSelection.size})
                    </Button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="gd-table min-w-full">
                    <thead>
                      <tr className="border-b border-secondary-200 text-left text-xs text-secondary-500">
                        <th className="px-3 py-2" />
                        <th className="px-3 py-2">{t('corrugatorPool.columns.number')}</th>
                        <th className="px-3 py-2">{t('corrugatorPool.columns.customer')}</th>
                        <th className="px-3 py-2">{t('corrugatorPool.columns.product')}</th>
                        <th className="px-3 py-2">{t('corrugatorPool.columns.sheetSize')}</th>
                        <th className="px-3 py-2">{t('corrugatorPool.columns.rotation')}</th>
                        <th className="px-3 py-2">{t('corrugatorPool.columns.boxes')}</th>
                        <th className="px-3 py-2">{t('corrugatorPool.columns.sheetsPerBox')}</th>
                        <th className="px-3 py-2">{t('corrugatorPool.columns.required')}</th>
                        <th className="px-3 py-2">{t('corrugatorPool.columns.allocated')}</th>
                        <th className="px-3 py-2">{t('corrugatorPool.columns.pending')}</th>
                        <th className="px-3 py-2">{t('corrugatorPool.columns.deliveryDate')}</th>
                        <th className="px-3 py-2">{t('corrugatorPool.columns.inPlans')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-100">
                      {group.orders.map((order) => (
                        <tr key={order.productionOrder.uuid} data-testid={`pool-order-${order.productionOrder.uuid}`}>
                          <td className="whitespace-nowrap px-3 py-2">
                            <input
                              type="checkbox"
                              checked={boardSelection.has(order.productionOrder.uuid)}
                              onChange={() => toggleOrder(group.board.key, order.productionOrder.uuid)}
                              data-testid={`pool-order-checkbox-${order.productionOrder.uuid}`}
                            />
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-sm font-medium text-secondary-900">{order.productionOrder.number}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-sm text-secondary-600">{order.customer?.name ?? '-'}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-sm text-secondary-600">{order.product.code}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-sm text-secondary-600">{order.sheetLength} × {order.sheetWidth} mm</td>
                          <td className="whitespace-nowrap px-3 py-2 text-sm text-secondary-600">{order.allowsRotation ? t('common.yes') : t('common.no')}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-sm text-secondary-600">{order.orderQuantity}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-sm text-secondary-600">
                            {order.sheetsPerUnit}
                            {order.sheetsSource === 'quantity' && (
                              <span
                                className="ml-1 inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700"
                                title={t('corrugatorPool.sheetsWarning')}
                                data-testid="sheets-warning-chip"
                              >
                                !
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-sm text-secondary-600">{order.requiredSheets}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-sm text-secondary-600">{order.allocatedSheets}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-sm text-secondary-600">{order.pendingSheets}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-sm text-secondary-600">{formatBusinessDate(order.deliveryDate)}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-sm">
                            {order.inPlans.length === 0 ? (
                              '-'
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {order.inPlans.map((p) => (
                                  <button
                                    key={p.uuid}
                                    type="button"
                                    className="rounded-full bg-secondary-100 px-2 py-0.5 text-xs text-secondary-700 hover:bg-secondary-200"
                                    onClick={() => navigate(`/corrugator-plans/${p.uuid}`)}
                                  >
                                    #{p.number}
                                  </button>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}

        {notPlannable.length > 0 && (
          <div className="rounded-lg border border-secondary-200 bg-white shadow-sm">
            <button
              type="button"
              className="flex w-full items-center gap-2 p-4 text-left text-sm font-medium text-secondary-900"
              onClick={() => setNotPlannableOpen((open) => !open)}
              data-testid="not-plannable-toggle"
            >
              {notPlannableOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              {t('corrugatorPool.notPlannable')} ({notPlannable.length})
            </button>
            {notPlannableOpen && (
              <ul className="divide-y divide-secondary-100 border-t border-secondary-200">
                {notPlannable.map((row) => (
                  <li key={row.productionOrder.uuid} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
                    <span className="font-medium text-secondary-900">{row.productionOrder.number}</span>
                    <span className="text-secondary-500">{t(NOT_PLANNABLE_REASON_KEY[row.reason] ?? row.reason)}</span>
                    <span className="text-secondary-400">{row.detail}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {createFor && (
        <CreatePlanModal
          isOpen={!!createFor}
          onClose={() => setCreateFor(null)}
          board={createFor.board}
          productionOrderUuids={createFor.uuids}
          onCreated={(plan) => {
            setCreateFor(null);
            navigate(`/corrugator-plans/${plan.uuid}`);
          }}
        />
      )}
    </Layout>
  );
};

export default CorrugatorPool;
