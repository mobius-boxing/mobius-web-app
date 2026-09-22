import React, { useState, useCallback, useEffect , useMemo } from 'react';
import { Plus, Trash2, Edit, Box } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Model } from '../types';
import { modelsApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import ActionButton from '../components/ui/ActionButton';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { FilterBar, searchFilter } from '../components/ui/filters';
import { columnFilterDefs } from '../filters/columnFilters';
import { useEntityList } from '../hooks/useEntityList';
import { usePermissions } from '../hooks/usePermissions';
import { useConfirmModal } from '../hooks/useConfirmModal';
import ModelFormModal from '../components/modals/ModelFormModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import ErrorMessage from '../components/ui/ErrorMessage';
import { logger } from '../utils/logger';
import { historyColumn } from '../components/audit/historyColumn';

const Models: React.FC = () => {
  const { t } = useTranslation();
  const { has } = usePermissions();
  const canEdit = has('models.edit');
  const { effectiveCompanyId } = useEffectiveCompany();
  const [showFormModal, setShowFormModal] = useState(false);
  const [selected, setSelected] = useState<Model | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const confirmModal = useConfirmModal();

  const fetchModels = useCallback((params: Record<string, unknown>) => {
    const fetchParams = effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params;
    return modelsApi.getModels(fetchParams);
  }, [effectiveCompanyId]);


  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const handleDelete = (uuid: string) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('models.deleteConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(uuid);
          setActionError(null);
          await modelsApi.deleteModel(uuid);
          await refresh();
        } catch (error: any) {
          // A model referenced by products answers 409 with the count and the
          // product codes. That message is the whole point of the pre-check —
          // the row simply staying put tells the user nothing.
          logger.error('Error deleting model:', error);
          setActionError(
            error?.response?.data?.message ?? t('models.deleteError'),
          );
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const columns = [
    {
      key: 'code',
      header: t('models.columns.code'),
      hideable: false,
      card: 'title' as const,
      render: (_: any, m: Model) => (
        <span className="text-sm font-medium text-secondary-900">{m.code || 'N/A'}</span>
      ),
    },
    {
      key: 'description',
      header: t('models.columns.description'),
      render: (_: any, m: Model) => (
        <span className="text-sm text-secondary-900">{m.description}</span>
      ),
    },
    {
      key: 'flapType',
      header: t('models.columns.flapType'),
      render: (_: any, m: Model) => (
        <span className="text-sm text-secondary-500">{m.flapType?.code || '-'}</span>
      ),
    },
    {
      key: 'complement',
      header: t('models.columns.complement'),
      render: (_: any, m: Model) => (
        <span className="text-sm text-secondary-500">{m.complement?.code || '-'}</span>
      ),
    },
    historyColumn('models', t),
    {
      key: 'actions',
      header: t('models.columns.actions'),
      pinned: true,
      card: 'actions' as const,
      render: (_: any, m: Model) => (
        <div className="flex items-center space-x-2">
          {canEdit && (
            <ActionButton
              label={t('models.editModel')}
              onClick={() => { setSelected(m); setShowFormModal(true); }}
              disabled={actionLoading === m?.uuid || !m}
            >
              <Edit className="h-4 w-4" />
            </ActionButton>
          )}
          {canEdit && (
            <ActionButton
              label={t('models.deleteModel')}
              tone="danger"
              onClick={() => handleDelete(m?.uuid)}
              disabled={actionLoading === m?.uuid || !m}
            >
              <Trash2 className="h-4 w-4" />
            </ActionButton>
          )}
        </div>
      ),
    },
  ];

  const filterDefs = useMemo(
    () => [
      searchFilter(t('models.searchPlaceholder')),
      ...columnFilterDefs('models', columns, t, { companyId: effectiveCompanyId }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, effectiveCompanyId]
  );

  const { filteredData: models, loading,
    search,
    filterBarProps, refresh, paginationProps } =
    useEntityList<Model>({ fetchFn: fetchModels, searchFields: ['code', 'description'],
    filterDefs, });


  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="gd-page-title">{t('models.title')}</h1>
            <p className="text-secondary-600">{t('models.subtitle')}</p>
          </div>
          {canEdit && (
            <Button
              onClick={() => { setSelected(null); setShowFormModal(true); }}
              className="inline-flex items-center"
              data-testid="model-add"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('models.addModel')}
            </Button>
          )}
        </div>

        <ErrorMessage message={actionError} />

        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <FilterBar {...filterBarProps} />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            {!loading && models.length === 0 ? (
              <div className="text-center py-12">
                <Box className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('models.empty.title')}</h3>
                <p className="gd-page-sub">
                  {search ? t('models.empty.description') : t('models.empty.noData')}
                </p>
              </div>
            ) : (
              <>
                <Table columns={columns} data={models} loading={loading} listId="models" />
                <Pagination {...paginationProps} />
              </>
            )}
          </div>
        </div>
      </div>

      <ModelFormModal
        isOpen={showFormModal}
        onClose={() => { setShowFormModal(false); setSelected(null); }}
        onSuccess={() => { setShowFormModal(false); setSelected(null); refresh(); }}
        model={selected}
      />
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

export default Models;
