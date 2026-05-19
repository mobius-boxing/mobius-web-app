import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Edit, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { StrappingType } from '../types';
import { strappingTypesApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import { SearchInput } from '../components/ui/SearchInput';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import CreateStrappingTypeModal from '../components/modals/CreateStrappingTypeModal';
import EditStrappingTypeModal from '../components/modals/EditStrappingTypeModal';
import ConfirmModal from '../components/ui/ConfirmModal';

const StrappingTypes: React.FC = () => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStrappingType, setSelectedStrappingType] = useState<StrappingType | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const confirmModal = useConfirmModal();

  // Create fetch function with company filter
  const fetchStrappingTypes = useCallback((params: Record<string, unknown>) => {
    const fetchParams = effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params;
    return strappingTypesApi.getStrappingTypes(fetchParams);
  }, [effectiveCompanyId]);

  // Use the entity list hook for data management
  const {
    filteredData: strappingTypes,
    loading,
    search,
    setSearch,
    refresh,
  } = useEntityList<StrappingType>({
    fetchFn: fetchStrappingTypes,
    searchFields: ['code', 'description'],
  });

  // Refetch when effectiveCompanyId changes
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const handleEdit = (strappingType: StrappingType) => {
    setSelectedStrappingType(strappingType);
    setShowEditModal(true);
  };

  const handleDelete = (strappingTypeId: string) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('strappingTypes.deleteConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(strappingTypeId);
          await strappingTypesApi.deleteStrappingType(strappingTypeId);
          await refresh();
        } catch (error: any) {
          console.error('Error deleting strapping type:', error);
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
    setSelectedStrappingType(null);
    refresh();
  };

  const columns = [
    {
      key: 'code',
      header: t('strappingTypes.columns.code'),
      render: (value: any, strappingType: StrappingType) => (
        <span className="text-sm font-medium text-secondary-900">
          {strappingType.code || 'N/A'}
        </span>
      ),
    },
    {
      key: 'description',
      header: t('strappingTypes.columns.description'),
      render: (value: any, strappingType: StrappingType) => (
        <span className="text-sm text-secondary-500">
          {strappingType.description || '-'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: t('strappingTypes.columns.created'),
      render: (value: any, strappingType: StrappingType) => (
        <span className="text-sm text-secondary-500">
          {strappingType.createdAt ? new Date(strappingType.createdAt).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('strappingTypes.columns.actions'),
      render: (value: any, strappingType: StrappingType) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(strappingType)}
            disabled={actionLoading === strappingType?.uuid || !strappingType}
            title={t('strappingTypes.editStrappingType')}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(strappingType?.uuid)}
            disabled={actionLoading === strappingType?.uuid || !strappingType}
            className="text-red-600 hover:text-red-700"
            title={t('strappingTypes.deleteStrappingType')}
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">{t('strappingTypes.title')}</h1>
            <p className="text-secondary-600">{t('strappingTypes.subtitle')}</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('strappingTypes.addStrappingType')}
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('strappingTypes.searchPlaceholder')}
              />
            </div>
          </div>
        </div>

        {/* StrappingTypes Table */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('strappingTypes.allStrappingTypes')} ({strappingTypes.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : strappingTypes.length === 0 ? (
              <div className="text-center py-12">
                <Layers className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('strappingTypes.empty.title')}</h3>
                <p className="mt-1 text-sm text-secondary-500">
                  {search ? t('strappingTypes.empty.description') : t('strappingTypes.empty.noData')}
                </p>
                {!search && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('strappingTypes.addStrappingType')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Table
                columns={columns}
                data={strappingTypes}
                loading={loading}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateStrappingTypeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditStrappingTypeModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedStrappingType(null);
        }}
        onSuccess={handleEditSuccess}
        strappingType={selectedStrappingType}
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

export default StrappingTypes;
