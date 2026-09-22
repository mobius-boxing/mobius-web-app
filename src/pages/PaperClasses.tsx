import React, { useState, useCallback, useEffect , useMemo } from 'react';
import { Plus, Trash2, Edit, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PaperClass } from '../types';
import { paperClassesApi } from '../services/api';
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
import CreatePaperClassModal from '../components/modals/CreatePaperClassModal';
import EditPaperClassModal from '../components/modals/EditPaperClassModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { logger } from '../utils/logger';
import { historyColumn } from '../components/audit/historyColumn';

const PaperClasses: React.FC = () => {
  const { t } = useTranslation();
  const { has } = usePermissions();
  const canEdit = has('paper.classes');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPaperClass, setSelectedPaperClass] = useState<PaperClass | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { effectiveCompanyId } = useEffectiveCompany();
  const confirmModal = useConfirmModal();

  const fetchPaperClasses = useCallback((params: Record<string, unknown>) => {
    const fetchParams = effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params;
    return paperClassesApi.getPaperClasses(fetchParams);
  }, [effectiveCompanyId]);


  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const handleEdit = (paperClass: PaperClass) => {
    setSelectedPaperClass(paperClass);
    setShowEditModal(true);
  };

  const handleDelete = (paperClassId: string) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('paperClasses.deleteConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(paperClassId);
          await paperClassesApi.deletePaperClass(paperClassId);
          await refresh();
        } catch (error) {
          logger.error('Error deleting paper class:', error);
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    refresh();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedPaperClass(null);
    refresh();
  };

  const columns = [
    {
      key: 'code',
      header: t('paperClasses.columns.code'),
      hideable: false,
      card: 'title' as const,
      render: (value: any, paperClass: PaperClass) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="font-medium text-secondary-900">{paperClass.code || 'Unknown Code'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'name',
      header: t('paperClasses.columns.name'),
      render: (value: any, paperClass: PaperClass) => (
        <span className="text-sm text-secondary-900">
          {paperClass?.name || '-'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: t('paperClasses.columns.created'),
      render: (value: any, paperClass: PaperClass) => (
        <span className="text-sm text-secondary-900">
          {paperClass?.createdAt ? new Date(paperClass.createdAt).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    historyColumn('paper_classes', t),
    {
      key: 'actions',
      header: t('paperClasses.columns.actions'),
      pinned: true,
      card: 'actions' as const,
      render: (value: any, paperClass: PaperClass) => (
        <div className="flex items-center space-x-2">
          {canEdit && (
            <ActionButton
              label={t('common.edit')}
              onClick={() => handleEdit(paperClass)}
              disabled={actionLoading === paperClass?.uuid || !paperClass}
            >
              <Edit className="h-4 w-4" />
            </ActionButton>
          )}
          {canEdit && (
            <ActionButton
              label={t('common.delete')}
              tone="danger"
              onClick={() => handleDelete(paperClass?.uuid)}
              disabled={actionLoading === paperClass?.uuid || !paperClass}
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
      searchFilter(t('paperClasses.searchPlaceholder')),
      ...columnFilterDefs('paper-classes', columns, t, { companyId: effectiveCompanyId }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, effectiveCompanyId]
  );

  const {
    filteredData: paperClasses,
    loading,
    search,
    filterBarProps,
    refresh,
    paginationProps,
  } = useEntityList<PaperClass>({
    fetchFn: fetchPaperClasses,
    searchFields: ['code', 'name'],
    filterDefs,
  });


  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="gd-page-title">{t('paperClasses.title')}</h1>
            <p className="text-secondary-600">{t('paperClasses.subtitle')}</p>
          </div>
          {canEdit && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('paperClasses.addClass')}
            </Button>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <FilterBar {...filterBarProps} />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('paperClasses.allClasses')} ({paperClasses.length})
              </h2>
            </div>

            {!loading && paperClasses.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('paperClasses.empty.title')}</h3>
                <p className="gd-page-sub">
                  {search ? t('paperClasses.empty.description') : t('paperClasses.empty.noData')}
                </p>
                {!search && canEdit && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('paperClasses.addClass')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Table
                  columns={columns}
                  data={paperClasses}
                  loading={loading}
                  listId="paper-classes"
                />
                <Pagination {...paginationProps} />
              </>
            )}
          </div>
        </div>
      </div>

      <CreatePaperClassModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditPaperClassModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedPaperClass(null);
        }}
        onSuccess={handleEditSuccess}
        paperClass={selectedPaperClass}
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

export default PaperClasses;
