import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Edit, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ConsumableSupply } from '../types';
import { consumableSuppliesApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { SearchInput } from '../components/ui/SearchInput';
import { useEntityList } from '../hooks/useEntityList';
import ConfirmModal from '../components/ui/ConfirmModal';
import CreateConsumableSupplyModal from '../components/modals/CreateConsumableSupplyModal';
import EditConsumableSupplyModal from '../components/modals/EditConsumableSupplyModal';
import { logger } from '../utils/logger';

const ConsumableSupplies: React.FC = () => {
  const { t } = useTranslation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedConsumableSupply, setSelectedConsumableSupply] = useState<ConsumableSupply | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { effectiveCompanyId } = useEffectiveCompany();

  const fetchConsumableSupplies = useCallback((params: Record<string, unknown>) => {
    const fetchParams = effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params;
    return consumableSuppliesApi.getConsumableSupplies(fetchParams);
  }, [effectiveCompanyId]);

  const {
    filteredData: consumableSupplies,
    loading,
    search,
    setSearch,
    refresh,
    paginationProps,
  } = useEntityList<ConsumableSupply>({
    fetchFn: fetchConsumableSupplies,
    searchFields: ['code', 'name', 'description'],
  });

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const handleEdit = (consumableSupply: ConsumableSupply) => {
    setSelectedConsumableSupply(consumableSupply);
    setShowEditModal(true);
  };

  const handleDeleteClick = (consumableSupply: ConsumableSupply) => {
    setSelectedConsumableSupply(consumableSupply);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedConsumableSupply?.uuid) return;

    try {
      setActionLoading(true);
      await consumableSuppliesApi.deleteConsumableSupply(selectedConsumableSupply.uuid);
      setShowDeleteModal(false);
      setSelectedConsumableSupply(null);
      await refresh();
    } catch (error) {
      logger.error('Error deleting consumable supply:', error);
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
    setSelectedConsumableSupply(null);
    refresh();
  };

  const columns = [
    {
      key: 'code',
      header: t('consumableSupplies.columns.code'),
      render: (value: any, supply: ConsumableSupply) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <Package className="h-5 w-5 text-primary-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="font-medium text-secondary-900">{supply.code || 'Unknown'}</div>
            {supply.description && (
              <div className="text-sm text-secondary-500 truncate max-w-xs">{supply.description}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'name',
      header: t('consumableSupplies.columns.name'),
      render: (value: any, supply: ConsumableSupply) => (
        <span className="text-sm text-secondary-900">
          {supply?.name || '-'}
        </span>
      ),
    },
    {
      key: 'consumableType',
      header: t('consumableSupplies.columns.consumableType'),
      render: (value: any, supply: ConsumableSupply) => (
        <span className="text-sm text-secondary-900">
          {supply?.consumableType?.name || '-'}
        </span>
      ),
    },
    {
      key: 'manufacturer',
      header: t('consumableSupplies.columns.manufacturer'),
      render: (value: any, supply: ConsumableSupply) => (
        <span className="text-sm text-secondary-900">
          {supply?.manufacturer?.name || '-'}
        </span>
      ),
    },
    {
      key: 'supplier',
      header: t('consumableSupplies.columns.supplier'),
      render: (value: any, supply: ConsumableSupply) => (
        <span className="text-sm text-secondary-900">
          {supply?.supplier?.code || '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('consumableSupplies.columns.actions'),
      render: (value: any, supply: ConsumableSupply) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(supply)}
            disabled={!supply}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteClick(supply)}
            disabled={!supply}
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
            <h1 className="gd-page-title">{t('consumableSupplies.title')}</h1>
            <p className="text-secondary-600">{t('consumableSupplies.subtitle')}</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('consumableSupplies.addSupply')}
          </Button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('consumableSupplies.searchPlaceholder')}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('consumableSupplies.allSupplies')} ({consumableSupplies.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : consumableSupplies.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('consumableSupplies.empty.title')}</h3>
                <p className="gd-page-sub">
                  {search ? t('consumableSupplies.empty.description') : t('consumableSupplies.empty.noData')}
                </p>
                {!search && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('consumableSupplies.addSupply')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Table
                  columns={columns}
                  data={consumableSupplies}
                  loading={loading}
                />
                <Pagination {...paginationProps} />
              </>
            )}
          </div>
        </div>
      </div>

      <CreateConsumableSupplyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditConsumableSupplyModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedConsumableSupply(null);
        }}
        onSuccess={handleEditSuccess}
        consumableSupply={selectedConsumableSupply}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedConsumableSupply(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={t('common.confirm')}
        message={t('consumableSupplies.deleteConfirm')}
        confirmText={t('common.delete')}
        loading={actionLoading}
        variant="danger"
      />
    </Layout>
  );
};

export default ConsumableSupplies;
