import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Edit, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FluteType } from '../types';
import { fluteTypesApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { SearchInput } from '../components/ui/SearchInput';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import CreateFluteTypeModal from '../components/modals/CreateFluteTypeModal';
import EditFluteTypeModal from '../components/modals/EditFluteTypeModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { logger } from '../utils/logger';
import { historyColumn } from '../components/audit/historyColumn';

const FluteTypes: React.FC = () => {
  const { t } = useTranslation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFluteType, setSelectedFluteType] = useState<FluteType | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { effectiveCompanyId } = useEffectiveCompany();
  const confirmModal = useConfirmModal();

  const fetchFluteTypes = useCallback((params: Record<string, unknown>) => {
    const fetchParams = effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params;
    return fluteTypesApi.getFluteTypes(fetchParams);
  }, [effectiveCompanyId]);

  const {
    filteredData: fluteTypes,
    loading,
    search,
    setSearch,
    refresh,
    paginationProps,
  } = useEntityList<FluteType>({
    fetchFn: fetchFluteTypes,
    searchFields: ['code', 'description'],
  });

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const handleEdit = (fluteType: FluteType) => {
    setSelectedFluteType(fluteType);
    setShowEditModal(true);
  };

  const handleDelete = (fluteTypeId: string) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('fluteTypes.deleteConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(fluteTypeId);
          await fluteTypesApi.deleteFluteType(fluteTypeId);
          await refresh();
        } catch (error) {
          logger.error('Error deleting flute type:', error);
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
    setSelectedFluteType(null);
    refresh();
  };

  const columns = [
    {
      key: 'code',
      header: t('fluteTypes.columns.code'),
      render: (value: any, fluteType: FluteType) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <Layers className="h-5 w-5 text-primary-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="font-medium text-secondary-900">{fluteType.code || 'Unknown Code'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: t('fluteTypes.columns.description'),
      render: (value: any, fluteType: FluteType) => (
        <span className="text-sm text-secondary-900">
          {fluteType?.description || '-'}
        </span>
      ),
    },
    {
      key: 'fluteFactor',
      header: t('fluteTypes.columns.fluteFactor'),
      render: (value: any, fluteType: FluteType) => (
        <span className="text-sm text-secondary-900">
          {fluteType?.fluteFactor !== undefined ? fluteType.fluteFactor : '-'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: t('fluteTypes.columns.created'),
      render: (value: any, fluteType: FluteType) => (
        <span className="text-sm text-secondary-900">
          {fluteType?.createdAt ? new Date(fluteType.createdAt).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    historyColumn('flute_types', t),
    {
      key: 'actions',
      header: t('fluteTypes.columns.actions'),
      render: (value: any, fluteType: FluteType) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(fluteType)}
            disabled={actionLoading === fluteType?.uuid || !fluteType}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(fluteType?.uuid)}
            disabled={actionLoading === fluteType?.uuid || !fluteType}
            className="text-red-600 hover:text-red-700"
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
            <h1 className="gd-page-title">{t('fluteTypes.title')}</h1>
            <p className="text-secondary-600">{t('fluteTypes.subtitle')}</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('fluteTypes.addType')}
          </Button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('fluteTypes.searchPlaceholder')}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('fluteTypes.allTypes')} ({fluteTypes.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : fluteTypes.length === 0 ? (
              <div className="text-center py-12">
                <Layers className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('fluteTypes.empty.title')}</h3>
                <p className="gd-page-sub">
                  {search ? t('fluteTypes.empty.description') : t('fluteTypes.empty.noData')}
                </p>
                {!search && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('fluteTypes.addType')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Table
                  columns={columns}
                  data={fluteTypes}
                  loading={loading}
                />
                <Pagination {...paginationProps} />
              </>
            )}
          </div>
        </div>
      </div>

      <CreateFluteTypeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditFluteTypeModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedFluteType(null);
        }}
        onSuccess={handleEditSuccess}
        fluteType={selectedFluteType}
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

export default FluteTypes;
