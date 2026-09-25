import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { FilterBar, searchFilter } from '../components/ui/filters';
import { FilterDef } from '../components/ui/filters/types';
import { useEntityList } from '../hooks/useEntityList';
import { usePermissions } from '../hooks/usePermissions';
import { useEffectiveCompany } from '../hooks/useEffectiveCompany';
import { corrugatorPlansApi } from '../services/api';
import { CORRUGATOR_PLAN_STATUSES, CorrugatorPlan } from '../types';
import { formatBusinessDate } from '../utils/dates';

const STATUS_TONE: Record<string, string> = {
  draft: 'bg-secondary-100 text-secondary-700',
  solving: 'bg-amber-100 text-amber-700',
  solved: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  registered: 'bg-primary-100 text-primary-700',
};

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const { t } = useTranslation();
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONE[status] ?? 'bg-secondary-100 text-secondary-700'}`}>
      {t(`corrugatorPlans.status.${status}`, { defaultValue: status })}
    </span>
  );
};

/** Card 2/3 "Plans list" — `GET /corrugator-plans`, row → editor. */
const CorrugatorPlans: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { has } = usePermissions();
  const { effectiveCompanyId } = useEffectiveCompany();
  const canCreate = has('corrugator.plan');

  const fetchPlans = useCallback(
    (params: Record<string, unknown>) =>
      corrugatorPlansApi.getPlans({
        ...params,
        ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}),
      }),
    [effectiveCompanyId],
  );

  const filterDefs = useMemo<FilterDef[]>(
    () => [
      searchFilter(t('corrugatorPlans.searchPlaceholder')),
      {
        kind: 'select',
        key: 'status',
        label: t('corrugatorPlans.columns.status'),
        testId: 'filter-status',
        options: CORRUGATOR_PLAN_STATUSES.map((s) => ({ value: s, label: t(`corrugatorPlans.status.${s}`) })),
      },
      {
        kind: 'text',
        key: 'number',
        label: t('corrugatorPlans.columns.number'),
        testId: 'filter-number',
      },
    ],
    [t],
  );

  const { data: plans, loading, filterBarProps, paginationProps, sortBy, sortOrder, setSort } = useEntityList<CorrugatorPlan>({
    fetchFn: fetchPlans,
    filterDefs,
  });

  const columns = [
    {
      key: 'status',
      header: t('corrugatorPlans.columns.status'),
      card: 'title' as const,
      render: (_: unknown, plan: CorrugatorPlan) => <StatusPill status={plan.status} />,
    },
    {
      key: 'number',
      header: t('corrugatorPlans.columns.number'),
      sortable: true,
      render: (_: unknown, plan: CorrugatorPlan) => (
        <button
          type="button"
          className="text-sm font-medium text-primary-600 hover:underline"
          onClick={() => navigate(`/corrugator-plans/${plan.uuid}`)}
          data-testid={`plan-number-${plan.uuid}`}
        >
          #{plan.number}
        </button>
      ),
    },
    {
      key: 'name',
      header: t('corrugatorPlans.columns.name'),
      render: (_: unknown, plan: CorrugatorPlan) => <span className="text-sm text-secondary-700">{plan.name ?? '-'}</span>,
    },
    {
      key: 'board',
      header: t('corrugatorPlans.columns.board'),
      render: (_: unknown, plan: CorrugatorPlan) => (
        <span className="text-sm text-secondary-600">{plan.board.fluteTypes.join(' / ') || '-'}</span>
      ),
    },
    {
      key: 'orderCount',
      header: t('corrugatorPlans.columns.orders'),
      render: (_: unknown, plan: CorrugatorPlan) => <span className="text-sm text-secondary-600">{plan.orderCount ?? 0}</span>,
    },
    {
      key: 'combinationCount',
      header: t('corrugatorPlans.columns.combinations'),
      render: (_: unknown, plan: CorrugatorPlan) => <span className="text-sm text-secondary-600">{plan.combinationCount ?? 0}</span>,
    },
    {
      key: 'createdAt',
      header: t('corrugatorPlans.columns.createdAt'),
      sortable: true,
      render: (_: unknown, plan: CorrugatorPlan) => (
        <span className="text-sm text-secondary-500">
          {plan.createdByUser ?? '-'} · {formatBusinessDate(plan.createdAt)}
        </span>
      ),
    },
    {
      key: 'registeredAt',
      header: t('corrugatorPlans.columns.registeredAt'),
      render: (_: unknown, plan: CorrugatorPlan) => (
        <span className="text-sm text-secondary-500">{plan.registeredAt ? formatBusinessDate(plan.registeredAt) : '-'}</span>
      ),
    },
  ];

  return (
    <Layout>
      <div className="space-y-6" data-testid="corrugator-plans-list">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="gd-page-title">{t('corrugatorPlans.title')}</h1>
            <p className="text-secondary-600">{t('corrugatorPlans.subtitle')}</p>
          </div>
          {canCreate && (
            <Button onClick={() => navigate('/corrugator-pool')} className="inline-flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              {t('corrugatorPlans.goToPool')}
            </Button>
          )}
        </div>

        <div className="rounded-lg border border-secondary-200 bg-white p-4 shadow-sm">
          <FilterBar {...filterBarProps} />
        </div>

        <div className="rounded-lg border border-secondary-200 bg-white shadow-sm">
          <div className="p-6">
            <Table
              columns={columns}
              data={plans}
              loading={loading}
              emptyMessage={t('corrugatorPlans.empty')}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={setSort}
              listId="corrugator-plans"
            />
            <Pagination {...paginationProps} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CorrugatorPlans;
