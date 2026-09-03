import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Edit, CheckCircle2, XCircle, Clock } from 'lucide-react';
import Button from '../ui/Button';
import Table from '../ui/Table';
import Pagination from '../ui/Pagination';
import { SearchInput } from '../ui/SearchInput';
import ConfirmModal from '../ui/ConfirmModal';
import PartFormModal from '../modals/PartFormModal';
import { Part } from '../../types';
import { partsApi } from '../../services/api';
import { useEntityList } from '../../hooks/useEntityList';
import { useConfirmModal } from '../../hooks/useConfirmModal';
import { usePermissions } from '../../hooks/usePermissions';
import useEffectiveCompany from '../../hooks/useEffectiveCompany';
import { logger } from '../../utils/logger';
import { historyColumn } from '../audit/historyColumn';

interface Props {
  /** When set: the embedded product-detail grid (create enabled). */
  productUuid?: string;
  /** Compact mode hides filters/search (embedded usage). */
  compact?: boolean;
  /** Fired after any mutation that changes the part set (create/delete/bulk). */
  onPartsChanged?: () => void;
}

const machineChip = (approvedAt?: string | null, cancelledAt?: string | null) =>
  approvedAt ? (
    <CheckCircle2 className="inline h-4 w-4 text-green-600" />
  ) : cancelledAt ? (
    <XCircle className="inline h-4 w-4 text-red-600" />
  ) : (
    <Clock className="inline h-4 w-4 text-secondary-400" />
  );

/**
 * Parts list (15-list-page.md) — used standalone (/parts) and embedded in the
 * product edit flow. Status chips for the 3 UI machines; bulk toolbar gated by
 * parts.approve.bulk.
 */
const PartsGrid: React.FC<Props> = ({ productUuid, compact = false, onPartsChanged }) => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const { has } = usePermissions();
  const confirmModal = useConfirmModal();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [approvalFilter, setApprovalFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Part | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchParts = useCallback(
    (params: Record<string, unknown>) => {
      const p: Record<string, unknown> = { ...params };
      if (effectiveCompanyId) p.companyId = effectiveCompanyId;
      if (approvalFilter) p.approvalState = approvalFilter;
      if (productUuid) return partsApi.getPartsForProduct(productUuid, p);
      return partsApi.getParts(p);
    },
    [effectiveCompanyId, productUuid, approvalFilter],
  );

  const { filteredData: parts, loading, search, setSearch, refresh, paginationProps } =
    useEntityList<Part>({ fetchFn: fetchParts, searchFields: ['code', 'description'] });

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId, productUuid, approvalFilter]);

  // Bulk selection must not silently span pages/filters: approving invisible
  // rows is a governance hazard. Reset whenever the visible query changes.
  useEffect(() => {
    setSelected(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationProps.page, approvalFilter, effectiveCompanyId, productUuid, search]);

  const toggle = (uuid: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(uuid)) next.delete(uuid);
      else next.add(uuid);
      return next;
    });

  const bulk = async (action: 'approve' | 'unapprove') => {
    try {
      setBusy(true);
      if (action === 'approve') await partsApi.bulkApprove(Array.from(selected));
      else await partsApi.bulkUnapprove(Array.from(selected));
      setSelected(new Set());
      await refresh();
      onPartsChanged?.();
    } catch (err) {
      logger.error('Bulk approval failed:', err);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = (uuid: string) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('parts.deleteConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          await partsApi.deletePart(uuid);
          await refresh();
          onPartsChanged?.();
        } catch (err) {
          logger.error('Error deleting part:', err);
        }
      },
    });
  };

  const columns = [
    {
      key: 'select',
      header: '',
      render: (_: any, p: Part) => (
        <input type="checkbox" checked={selected.has(p.uuid)} onChange={() => toggle(p.uuid)} />
      ),
    },
    {
      key: 'code',
      header: t('parts.columns.code'),
      render: (_: any, p: Part) => (
        <span className="text-sm font-medium text-secondary-900">
          {p.code}
          {(p.revision ?? 0) > 0 && <span className="ml-1 text-xs text-secondary-500">Rev. {p.revision}</span>}
        </span>
      ),
    },
    {
      key: 'description',
      header: t('parts.columns.description'),
      render: (_: any, p: Part) => <span className="text-sm text-secondary-600">{p.description ?? '-'}</span>,
    },
    ...(!productUuid
      ? [{
          key: 'product',
          header: t('parts.columns.product'),
          render: (_: any, p: Part) => <span className="text-sm text-secondary-600">{p.product?.code ?? '-'}</span>,
        }]
      : []),
    {
      key: 'corrugation',
      header: t('parts.columns.corrugation'),
      render: (_: any, p: Part) => <span className="text-sm text-secondary-600">{p.corrugation?.code ?? '-'}</span>,
    },
    {
      key: 'approvals',
      header: t('parts.columns.approvals'),
      render: (_: any, p: Part) => (
        <span className="flex gap-1.5" title={t('parts.columns.approvalsTitle') ?? ''}>
          {machineChip(p.dimensionsApprovalAt, p.dimensionsCancelledAt)}
          {machineChip(p.technicalApprovalAt, p.technicalCancelledAt)}
          {machineChip(p.partApprovalAt, p.partCancelledAt)}
        </span>
      ),
    },
    historyColumn('parts', t),
    {
      key: 'actions',
      header: t('parts.columns.actions'),
      render: (_: any, p: Part) => (
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" title={t('parts.editPart') ?? ''} onClick={() => { setEditing(p); setShowForm(true); }}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-red-600" title={t('parts.deletePart') ?? ''} onClick={() => handleDelete(p.uuid)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {!compact && (
          <div className="flex items-center gap-2">
            <div className="w-64">
              <SearchInput value={search} onChange={setSearch} placeholder={t('parts.searchPlaceholder')} />
            </div>
            <select className="input-field" value={approvalFilter} onChange={(e) => setApprovalFilter(e.target.value)}>
              <option value="">{t('parts.filters.allStates')}</option>
              <option value="pending">{t('parts.approvals.pending')}</option>
              <option value="approved">{t('parts.filters.approved')}</option>
              <option value="cancelled">{t('parts.approvals.cancelled')}</option>
            </select>
          </div>
        )}
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
              {t('parts.selectedCount', { count: selected.size })}
              <button
                type="button"
                className="ml-1 text-primary-500 hover:text-primary-700"
                aria-label={t('parts.clearSelection')}
                onClick={() => setSelected(new Set())}
              >
                ×
              </button>
            </span>
          )}
          {has('parts.approve.bulk') && selected.size > 0 && (
            <>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => bulk('approve')}>
                {t('parts.bulkApprove', { count: selected.size })}
              </Button>
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => bulk('unapprove')}>
                {t('parts.bulkUnapprove')}
              </Button>
            </>
          )}
          {productUuid && (
            <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }}>
              <Plus className="mr-1 h-4 w-4" />
              {t('parts.addPart')}
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex h-24 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary-600" />
        </div>
      ) : (
        <>
          <Table columns={columns} data={parts} loading={loading} />
          <Pagination {...paginationProps} />
        </>
      )}

      {showForm && (
        <PartFormModal
          isOpen={showForm}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSuccess={() => { setShowForm(false); setEditing(null); refresh(); onPartsChanged?.(); }}
          productUuid={productUuid ?? editing?.product?.uuid ?? ''}
          part={editing}
        />
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

export default PartsGrid;
