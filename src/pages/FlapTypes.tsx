import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Edit, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FlapType } from '../types';
import { flapTypesApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { SearchInput } from '../components/ui/SearchInput';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import CreateFlapTypeModal from '../components/modals/CreateFlapTypeModal';
import EditFlapTypeModal from '../components/modals/EditFlapTypeModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { logger } from '../utils/logger';

const FlapTypes: React.FC = () => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFlapType, setSelectedFlapType] = useState<FlapType | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const confirmModal = useConfirmModal();

  const fetchFlapTypes = useCallback((params: Record<string, unknown>) => {
    const fetchParams = effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params;
    return flapTypesApi.getFlapTypes(fetchParams);
  }, [effectiveCompanyId]);

  const {
    filteredData: flapTypes,
    loading,
    search,
    setSearch,
    refresh,
    paginationProps,
  } = useEntityList<FlapType>({
    fetchFn: fetchFlapTypes,
    searchFields: ['code', 'description'],
  });

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const handleEdit = (flapType: FlapType) => {
    setSelectedFlapType(flapType);
    setShowEditModal(true);
  };

  const handleDelete = (flapTypeId: string) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('flapTypes.deleteConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(flapTypeId);
          await flapTypesApi.deleteFlapType(flapTypeId);
          await refresh();
        } catch (error: any) {
          logger.error('Error deleting flap type:', error);
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
    setSelectedFlapType(null);
    refresh();
  };

  const columns = [
    {
      key: 'code',
      header: t('flapTypes.columns.code'),
      render: (value: any, flapType: FlapType) => (
        <span className="text-sm font-medium text-secondary-900">
          {flapType.code || 'N/A'}
        </span>
      ),
    },
    {
      key: 'description',
      header: t('flapTypes.columns.description'),
      render: (value: any, flapType: FlapType) => (
        <span className="text-sm text-secondary-500">
          {flapType.description || '-'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: t('flapTypes.columns.created'),
      render: (value: any, flapType: FlapType) => (
        <span className="text-sm text-secondary-500">
          {flapType.createdAt ? new Date(flapType.createdAt).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('flapTypes.columns.actions'),
      render: (value: any, flapType: FlapType) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(flapType)}
            disabled={actionLoading === flapType?.uuid || !flapType}
            title={t('flapTypes.editFlapType')}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(flapType?.uuid)}
            disabled={actionLoading === flapType?.uuid || !flapType}
            className="text-red-600 hover:text-red-700"
            title={t('flapTypes.deleteFlapType')}
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
            <h1 className="text-2xl font-bold text-secondary-900">{t('flapTypes.title')}</h1>
            <p className="text-secondary-600">{t('flapTypes.subtitle')}</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('flapTypes.addFlapType')}
          </Button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('flapTypes.searchPlaceholder')}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('flapTypes.allFlapTypes')} ({flapTypes.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : flapTypes.length === 0 ? (
              <div className="text-center py-12">
                <Layers className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('flapTypes.empty.title')}</h3>
                <p className="mt-1 text-sm text-secondary-500">
                  {search ? t('flapTypes.empty.description') : t('flapTypes.empty.noData')}
                </p>
                {!search && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('flapTypes.addFlapType')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Table
                  columns={columns}
                  data={flapTypes}
                  loading={loading}
                />
                <Pagination {...paginationProps} />
              </>
            )}
          </div>
        </div>
      </div>

      <CreateFlapTypeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditFlapTypeModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedFlapType(null);
        }}
        onSuccess={handleEditSuccess}
        flapType={selectedFlapType}
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

export default FlapTypes;
