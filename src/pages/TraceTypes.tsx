import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Edit, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TraceType } from '../types';
import { traceTypesApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { SearchInput } from '../components/ui/SearchInput';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import CreateTraceTypeModal from '../components/modals/CreateTraceTypeModal';
import EditTraceTypeModal from '../components/modals/EditTraceTypeModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { logger } from '../utils/logger';

const TraceTypes: React.FC = () => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTraceType, setSelectedTraceType] = useState<TraceType | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const confirmModal = useConfirmModal();

  const fetchTraceTypes = useCallback((params: Record<string, unknown>) => {
    const fetchParams = effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params;
    return traceTypesApi.getTraceTypes(fetchParams);
  }, [effectiveCompanyId]);

  const {
    filteredData: traceTypes,
    loading,
    search,
    setSearch,
    refresh,
    paginationProps,
  } = useEntityList<TraceType>({
    fetchFn: fetchTraceTypes,
    searchFields: ['code', 'description'],
  });

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const handleEdit = (traceType: TraceType) => {
    setSelectedTraceType(traceType);
    setShowEditModal(true);
  };

  const handleDelete = (traceTypeId: string) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('traceTypes.deleteConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(traceTypeId);
          await traceTypesApi.deleteTraceType(traceTypeId);
          await refresh();
        } catch (error: any) {
          logger.error('Error deleting trace type:', error);
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
    setSelectedTraceType(null);
    refresh();
  };

  const columns = [
    {
      key: 'code',
      header: t('traceTypes.columns.code'),
      render: (value: any, traceType: TraceType) => (
        <span className="text-sm font-medium text-secondary-900">
          {traceType.code || 'N/A'}
        </span>
      ),
    },
    {
      key: 'description',
      header: t('traceTypes.columns.description'),
      render: (value: any, traceType: TraceType) => (
        <span className="text-sm text-secondary-500">
          {traceType.description || '-'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: t('traceTypes.columns.created'),
      render: (value: any, traceType: TraceType) => (
        <span className="text-sm text-secondary-500">
          {traceType.createdAt ? new Date(traceType.createdAt).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('traceTypes.columns.actions'),
      render: (value: any, traceType: TraceType) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(traceType)}
            disabled={actionLoading === traceType?.uuid || !traceType}
            title={t('traceTypes.editTraceType')}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(traceType?.uuid)}
            disabled={actionLoading === traceType?.uuid || !traceType}
            className="text-red-600 hover:text-red-700"
            title={t('traceTypes.deleteTraceType')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">{t('traceTypes.title')}</h1>
            <p className="text-secondary-600">{t('traceTypes.subtitle')}</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('traceTypes.addTraceType')}
          </Button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('traceTypes.searchPlaceholder')}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('traceTypes.allTraceTypes')} ({traceTypes.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : traceTypes.length === 0 ? (
              <div className="text-center py-12">
                <Layers className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('traceTypes.empty.title')}</h3>
                <p className="mt-1 text-sm text-secondary-500">
                  {search ? t('traceTypes.empty.description') : t('traceTypes.empty.noData')}
                </p>
                {!search && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('traceTypes.addTraceType')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Table
                  columns={columns}
                  data={traceTypes}
                  loading={loading}
                />
                <Pagination {...paginationProps} />
              </>
            )}
          </div>
        </div>
      </div>

      <CreateTraceTypeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditTraceTypeModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTraceType(null);
        }}
        onSuccess={handleEditSuccess}
        traceType={selectedTraceType}
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

export default TraceTypes;
