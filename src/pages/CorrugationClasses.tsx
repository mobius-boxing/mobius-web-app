import React, { useState, useCallback, useEffect , useMemo } from 'react';
import { Plus, Trash2, Edit, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CorrugationClass } from '../types';
import { corrugationClassesApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { FilterBar, searchFilter } from '../components/ui/filters';
import { columnFilterDefs } from '../filters/columnFilters';
import { useEntityList } from '../hooks/useEntityList';
import { usePermissions } from '../hooks/usePermissions';
import ConfirmModal from '../components/ui/ConfirmModal';
import CreateCorrugationClassModal from '../components/modals/CreateCorrugationClassModal';
import EditCorrugationClassModal from '../components/modals/EditCorrugationClassModal';
import { logger } from '../utils/logger';
import { historyColumn } from '../components/audit/historyColumn';

const CorrugationClasses: React.FC = () => {
  const { t } = useTranslation();
  const { has } = usePermissions();
  const canEdit = has('corrugated.classes');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCorrugationClass, setSelectedCorrugationClass] = useState<CorrugationClass | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { effectiveCompanyId } = useEffectiveCompany();

  const fetchCorrugationClasses = useCallback((params: Record<string, unknown>) => {
    const fetchParams = effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params;
    return corrugationClassesApi.getCorrugationClasses(fetchParams);
  }, [effectiveCompanyId]);


  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const handleEdit = (corrugationClass: CorrugationClass) => {
    setSelectedCorrugationClass(corrugationClass);
    setShowEditModal(true);
  };

  const handleDeleteClick = (corrugationClass: CorrugationClass) => {
    setSelectedCorrugationClass(corrugationClass);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCorrugationClass?.uuid) return;

    try {
      setActionLoading(true);
      await corrugationClassesApi.deleteCorrugationClass(selectedCorrugationClass.uuid);
      setShowDeleteModal(false);
      setSelectedCorrugationClass(null);
      await refresh();
    } catch (error) {
      logger.error('Error deleting corrugation class:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    refresh();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedCorrugationClass(null);
    refresh();
  };

  const columns = [
    {
      key: 'code',
      header: t('corrugationClasses.columns.code'),
      hideable: false,
      card: 'title' as const,
      render: (value: any, corrugationClass: CorrugationClass) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <Layers className="h-5 w-5 text-primary-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="font-medium text-secondary-900">{corrugationClass.code || 'Unknown Code'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: t('corrugationClasses.columns.description'),
      render: (value: any, corrugationClass: CorrugationClass) => (
        <span className="text-sm text-secondary-900">
          {corrugationClass?.description || '-'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: t('corrugationClasses.columns.created'),
      render: (value: any, corrugationClass: CorrugationClass) => (
        <span className="text-sm text-secondary-900">
          {corrugationClass?.createdAt ? new Date(corrugationClass.createdAt).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    historyColumn('corrugation_classes', t),
    {
      key: 'actions',
      header: t('corrugationClasses.columns.actions'),
      pinned: true,
      card: 'actions' as const,
      render: (value: any, corrugationClass: CorrugationClass) => (
        <div className="flex items-center space-x-2">
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(corrugationClass)}
              disabled={!corrugationClass}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteClick(corrugationClass)}
              disabled={!corrugationClass}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const filterDefs = useMemo(
    () => [
      searchFilter(t('corrugationClasses.searchPlaceholder')),
      ...columnFilterDefs('corrugation-classes', columns, t, { companyId: effectiveCompanyId }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, effectiveCompanyId]
  );

  const {
    filteredData: corrugationClasses,
    loading,
    search,
    filterBarProps,
    refresh,
    paginationProps,
  } = useEntityList<CorrugationClass>({
    fetchFn: fetchCorrugationClasses,
    searchFields: ['code', 'description'],
    filterDefs,
  });


  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="gd-page-title">{t('corrugationClasses.title')}</h1>
            <p className="text-secondary-600">{t('corrugationClasses.subtitle')}</p>
          </div>
          {canEdit && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('corrugationClasses.addClass')}
            </Button>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-full sm:flex-1 sm:max-w-md">
              <FilterBar {...filterBarProps} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('corrugationClasses.allClasses')} ({corrugationClasses.length})
              </h2>
            </div>

            {!loading && corrugationClasses.length === 0 ? (
              <div className="text-center py-12">
                <Layers className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('corrugationClasses.empty.title')}</h3>
                <p className="gd-page-sub">
                  {search ? t('corrugationClasses.empty.description') : t('corrugationClasses.empty.noData')}
                </p>
                {!search && canEdit && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('corrugationClasses.addClass')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Table
                  columns={columns}
                  data={corrugationClasses}
                  loading={loading}
                  listId="corrugation-classes"
                />
                <Pagination {...paginationProps} />
              </>
            )}
          </div>
        </div>
      </div>

      <CreateCorrugationClassModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditCorrugationClassModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCorrugationClass(null);
        }}
        onSuccess={handleEditSuccess}
        corrugationClass={selectedCorrugationClass}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedCorrugationClass(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={t('common.confirm')}
        message={t('corrugationClasses.deleteConfirm')}
        confirmText={t('common.delete')}
        loading={actionLoading}
        variant="danger"
      />
    </Layout>
  );
};

export default CorrugationClasses;
