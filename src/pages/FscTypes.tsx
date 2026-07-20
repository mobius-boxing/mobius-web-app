import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Edit, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FscType } from '../types';
import { fscTypesApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { SearchInput } from '../components/ui/SearchInput';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import CreateFscTypeModal from '../components/modals/CreateFscTypeModal';
import EditFscTypeModal from '../components/modals/EditFscTypeModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { logger } from '../utils/logger';

const FscTypes: React.FC = () => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFscType, setSelectedFscType] = useState<FscType | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const confirmModal = useConfirmModal();

  const fetchFscTypes = useCallback((params: Record<string, unknown>) => {
    const fetchParams = effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params;
    return fscTypesApi.getFscTypes(fetchParams);
  }, [effectiveCompanyId]);

  const {
    filteredData: fscTypes,
    loading,
    search,
    setSearch,
    refresh,
    paginationProps,
  } = useEntityList<FscType>({
    fetchFn: fetchFscTypes,
    searchFields: ['code', 'description'],
  });

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const handleEdit = (fscType: FscType) => {
    setSelectedFscType(fscType);
    setShowEditModal(true);
  };

  const handleDelete = (fscTypeId: string) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('fscTypes.deleteConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(fscTypeId);
          await fscTypesApi.deleteFscType(fscTypeId);
          await refresh();
        } catch (error: any) {
          logger.error('Error deleting FSC type:', error);
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
    setSelectedFscType(null);
    refresh();
  };

  const columns = [
    {
      key: 'code',
      header: t('fscTypes.columns.code'),
      render: (value: any, fscType: FscType) => (
        <span className="text-sm font-medium text-secondary-900">
          {fscType.code || 'N/A'}
        </span>
      ),
    },
    {
      key: 'description',
      header: t('fscTypes.columns.description'),
      render: (value: any, fscType: FscType) => (
        <span className="text-sm text-secondary-500">
          {fscType.description || '-'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: t('fscTypes.columns.created'),
      render: (value: any, fscType: FscType) => (
        <span className="text-sm text-secondary-500">
          {fscType.createdAt ? new Date(fscType.createdAt).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('fscTypes.columns.actions'),
      render: (value: any, fscType: FscType) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(fscType)}
            disabled={actionLoading === fscType?.uuid || !fscType}
            title={t('fscTypes.editFscType')}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(fscType?.uuid)}
            disabled={actionLoading === fscType?.uuid || !fscType}
            className="text-red-600 hover:text-red-700"
            title={t('fscTypes.deleteFscType')}
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
            <h1 className="text-2xl font-bold text-secondary-900">{t('fscTypes.title')}</h1>
            <p className="text-secondary-600">{t('fscTypes.subtitle')}</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('fscTypes.addFscType')}
          </Button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('fscTypes.searchPlaceholder')}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('fscTypes.allFscTypes')} ({fscTypes.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : fscTypes.length === 0 ? (
              <div className="text-center py-12">
                <Layers className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('fscTypes.empty.title')}</h3>
                <p className="mt-1 text-sm text-secondary-500">
                  {search ? t('fscTypes.empty.description') : t('fscTypes.empty.noData')}
                </p>
                {!search && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('fscTypes.addFscType')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Table
                  columns={columns}
                  data={fscTypes}
                  loading={loading}
                />
                <Pagination {...paginationProps} />
              </>
            )}
          </div>
        </div>
      </div>

      <CreateFscTypeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditFscTypeModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedFscType(null);
        }}
        onSuccess={handleEditSuccess}
        fscType={selectedFscType}
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

export default FscTypes;
