import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Edit, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ConsumableType } from '../types';
import { consumableTypesApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import { SearchInput } from '../components/ui/SearchInput';
import { useEntityList } from '../hooks/useEntityList';
import ConfirmModal from '../components/ui/ConfirmModal';
import CreateConsumableTypeModal from '../components/modals/CreateConsumableTypeModal';
import EditConsumableTypeModal from '../components/modals/EditConsumableTypeModal';

const ConsumableTypes: React.FC = () => {
  const { t } = useTranslation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedConsumableType, setSelectedConsumableType] = useState<ConsumableType | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { effectiveCompanyId } = useEffectiveCompany();

  // Fetch function with company filter
  const fetchConsumableTypes = useCallback((params: Record<string, unknown>) => {
    const fetchParams = effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params;
    return consumableTypesApi.getConsumableTypes(fetchParams);
  }, [effectiveCompanyId]);

  const {
    filteredData: consumableTypes,
    loading,
    search,
    setSearch,
    refresh,
  } = useEntityList<ConsumableType>({
    fetchFn: fetchConsumableTypes,
    searchFields: ['code', 'name'],
  });

  // Refresh when company changes
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const handleEdit = (consumableType: ConsumableType) => {
    setSelectedConsumableType(consumableType);
    setShowEditModal(true);
  };

  const handleDeleteClick = (consumableType: ConsumableType) => {
    setSelectedConsumableType(consumableType);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedConsumableType?.uuid) return;

    try {
      setActionLoading(true);
      await consumableTypesApi.deleteConsumableType(selectedConsumableType.uuid);
      setShowDeleteModal(false);
      setSelectedConsumableType(null);
      await refresh();
    } catch (error) {
      console.error('Error deleting consumable type:', error);
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
    setSelectedConsumableType(null);
    refresh();
  };

  const columns = [
    {
      key: 'code',
      header: t('consumableTypes.columns.code'),
      render: (value: any, consumableType: ConsumableType) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <Package className="h-5 w-5 text-primary-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="font-medium text-secondary-900">{consumableType.code || 'Unknown Code'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'name',
      header: t('consumableTypes.columns.name'),
      render: (value: any, consumableType: ConsumableType) => (
        <span className="text-sm text-secondary-900">
          {consumableType?.name || '-'}
        </span>
      ),
    },
    {
      key: 'autoConsumption',
      header: t('consumableTypes.columns.autoConsumption'),
      render: (value: any, consumableType: ConsumableType) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          consumableType?.autoConsumption
            ? 'bg-green-100 text-green-800'
            : 'bg-secondary-100 text-secondary-800'
        }`}>
          {consumableType?.autoConsumption ? t('common.yes') : t('common.no')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('consumableTypes.columns.actions'),
      render: (value: any, consumableType: ConsumableType) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(consumableType)}
            disabled={!consumableType}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteClick(consumableType)}
            disabled={!consumableType}
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
            <h1 className="text-2xl font-bold text-secondary-900">{t('consumableTypes.title')}</h1>
            <p className="text-secondary-600">{t('consumableTypes.subtitle')}</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('consumableTypes.addType')}
          </Button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('consumableTypes.searchPlaceholder')}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('consumableTypes.allTypes')} ({consumableTypes.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : consumableTypes.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('consumableTypes.empty.title')}</h3>
                <p className="mt-1 text-sm text-secondary-500">
                  {search ? t('consumableTypes.empty.description') : t('consumableTypes.empty.noData')}
                </p>
                {!search && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('consumableTypes.addType')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Table
                columns={columns}
                data={consumableTypes}
                loading={loading}
              />
            )}
          </div>
        </div>
      </div>

      <CreateConsumableTypeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditConsumableTypeModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedConsumableType(null);
        }}
        onSuccess={handleEditSuccess}
        consumableType={selectedConsumableType}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedConsumableType(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={t('common.confirm')}
        message={t('consumableTypes.deleteConfirm')}
        confirmText={t('common.delete')}
        loading={actionLoading}
        variant="danger"
      />
    </Layout>
  );
};

export default ConsumableTypes;
