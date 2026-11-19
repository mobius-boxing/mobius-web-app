import React, { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, Edit, Plus, Trash2, Undo2 } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import ActionButton from '../components/ui/ActionButton';
import ConfirmModal from '../components/ui/ConfirmModal';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { FilterBar, searchFilter } from '../components/ui/filters';
import { columnFilterDefs } from '../filters/columnFilters';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import { usePermissions } from '../hooks/usePermissions';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import { quotationsApi } from '../services/api';
import { Quotation } from '../types';
import { formatBusinessDate } from '../utils/dates';
import { formatMoney } from '../utils/money';
import { logger } from '../utils/logger';

const STATUS_TONE: Record<string, string> = {
  draft: 'bg-secondary-100 text-secondary-700',
  informed: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export const QuotationStatusChip: React.FC<{ status: string }> = ({ status }) => {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONE[status] ?? STATUS_TONE.draft}`}
      data-testid={`quotation-status-${status}`}
    >
      {t(`quotations.status.${status}`, { defaultValue: status })}
    </span>
  );
};

/** Status and approval are the two filters the card asks for on the primary row; the registry keeps the rest advanced. */
const PRIMARY_FILTERS = ['status', 'approved'];

const Quotations: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { has } = usePermissions();
  const { effectiveCompanyId } = useEffectiveCompany();
  const confirmModal = useConfirmModal();
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyUuid, setBusyUuid] = useState<string | null>(null);

  const canApprove = has('quotations.approve');
  const canDelete = has('quotations.delete');

  const fetchQuotations = useCallback(
    (params: Record<string, unknown>) =>
      quotationsApi.getQuotations({ ...params, ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}) }),
    [effectiveCompanyId],
  );

  const toggleApproval = async (quotation: Quotation) => {
    setBusyUuid(quotation.uuid);
    setActionError(null);
    try {
      await quotationsApi.setApproval(quotation.uuid, !quotation.approved);
      await list.refresh();
    } catch (err: any) {
      logger.error('Error changing quotation approval:', err);
      setActionError(err?.response?.data?.message || t('quotations.approvalFailed'));
    } finally {
      setBusyUuid(null);
    }
  };

  const handleDelete = (quotation: Quotation) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('quotations.deleteConfirm', { number: quotation.number }),
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionError(null);
          await quotationsApi.deleteQuotation(quotation.uuid);
          await list.refresh();
        } catch (err: any) {
          logger.error('Error deleting quotation:', err);
          setActionError(err?.response?.data?.message || t('quotations.deleteFailed'));
        }
      },
    });
  };

  const columns = [
    {
      key: 'number',
      header: t('quotations.columns.number'),
      sortable: true,
      hideable: false,
      card: 'title' as const,
      render: (_: unknown, q: Quotation) => (
        <Link
          to={`/quotations/${q.uuid}`}
          className="text-sm font-medium text-primary-600 hover:underline"
          data-testid={`quotation-number-${q.uuid}`}
        >
          #{q.number}
        </Link>
      ),
    },
    {
      key: 'status',
      header: t('quotations.columns.status'),
      sortable: true,
      render: (_: unknown, q: Quotation) => <QuotationStatusChip status={q.status} />,
    },
    {
      key: 'customer',
      header: t('quotations.columns.customer'),
      render: (_: unknown, q: Quotation) => <span className="text-sm text-secondary-900">{q.customer.name}</span>,
    },
    {
      key: 'product',
      header: t('quotations.columns.product'),
      render: (_: unknown, q: Quotation) => (
        <span className="text-sm text-secondary-700">
          {q.product.code}
          {q.product.description ? ` — ${q.product.description}` : ''}
        </span>
      ),
    },
    {
      key: 'quantity',
      header: t('quotations.columns.quantity'),
      sortable: true,
      render: (_: unknown, q: Quotation) => <span className="text-sm text-secondary-700">{q.quantity}</span>,
    },
    {
      key: 'price',
      header: t('quotations.columns.price'),
      sortable: true,
      render: (_: unknown, q: Quotation) => <span className="text-sm text-secondary-700">{formatMoney(q.price)}</span>,
    },
    {
      key: 'priceTotal',
      header: t('quotations.columns.priceTotal'),
      render: (_: unknown, q: Quotation) => <span className="text-sm text-secondary-700">{formatMoney(q.priceTotal)}</span>,
    },
    {
      key: 'deliveryDate',
      header: t('quotations.columns.deliveryDate'),
      sortable: true,
      render: (_: unknown, q: Quotation) => <span className="text-sm text-secondary-500">{formatBusinessDate(q.deliveryDate)}</span>,
    },
    {
      key: 'approved',
      header: t('quotations.columns.approved'),
      render: (_: unknown, q: Quotation) =>
        q.approved ? (
          <Check className="h-4 w-4 text-green-600" data-testid={`quotation-approved-${q.uuid}`} aria-label={t('quotations.approved')} />
        ) : (
          <span className="text-secondary-300">-</span>
        ),
    },
    {
      key: 'ordered',
      header: t('quotations.columns.salesOrder'),
      render: (_: unknown, q: Quotation) =>
        q.salesOrder ? (
          <Link to={`/sales-orders/${q.salesOrder.uuid}`} className="text-sm text-primary-600 hover:underline">
            {q.salesOrder.number}
          </Link>
        ) : (
          <span className="text-secondary-300">-</span>
        ),
    },
    {
      key: 'actions',
      header: t('quotations.columns.actions'),
      pinned: true,
      card: 'actions' as const,
      render: (_: unknown, q: Quotation) => (
        <div className="flex items-center space-x-2">
          <ActionButton label={t('quotations.edit')} onClick={() => navigate(`/quotations/${q.uuid}`)}>
            <Edit className="h-4 w-4" />
          </ActionButton>
          {canApprove && !q.ordered && (
            <ActionButton
              label={q.approved ? t('quotations.unapprove') : t('quotations.approve')}
              onClick={() => toggleApproval(q)}
              disabled={busyUuid === q.uuid}
              data-testid={`quotation-approval-${q.uuid}`}
            >
              {q.approved ? <Undo2 className="h-4 w-4" /> : <Check className="h-4 w-4" />}
            </ActionButton>
          )}
          {canDelete && !q.ordered && (
            <ActionButton label={t('quotations.delete')} tone="danger" onClick={() => handleDelete(q)}>
              <Trash2 className="h-4 w-4" />
            </ActionButton>
          )}
        </div>
      ),
    },
  ];

  const filterDefs = useMemo(
    () => [
      searchFilter(t('quotations.searchPlaceholder')),
      ...columnFilterDefs('quotations', columns, t, { companyId: effectiveCompanyId }).map((def) =>
        PRIMARY_FILTERS.includes(def.key) ? { ...def, advanced: false, testId: `filter-${def.key}` } : def,
      ),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, effectiveCompanyId],
  );

  const list = useEntityList<Quotation>({ fetchFn: fetchQuotations, filterDefs });

  return (
    <Layout>
      <div className="space-y-6" data-testid="quotations-list">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="gd-page-title">{t('quotations.title')}</h1>
            <p className="text-secondary-600">{t('quotations.subtitle')}</p>
          </div>
          <Button onClick={() => navigate('/quotations/new')} className="inline-flex items-center" data-testid="add-quotation-btn">
            <Plus className="mr-2 h-4 w-4" />
            {t('quotations.add')}
          </Button>
        </div>

        <ErrorMessage message={actionError} />

        <div className="rounded-lg border border-secondary-200 bg-white p-4 shadow-sm">
          <FilterBar {...list.filterBarProps} />
        </div>

        <div className="rounded-lg border border-secondary-200 bg-white shadow-sm">
          <div className="p-6">
            <Table
              columns={columns}
              data={list.data}
              loading={list.loading}
              emptyMessage={t('quotations.empty')}
              sortBy={list.sortBy}
              sortOrder={list.sortOrder}
              onSort={list.setSort}
              listId="quotations"
            />
            <Pagination {...list.paginationProps} />
          </div>
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
    </Layout>
  );
};

export default Quotations;
