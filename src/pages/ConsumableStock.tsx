import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Edit, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ConsumableStock } from '../types';
import { consumableStockApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import { SearchInput } from '../components/ui/SearchInput';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import CreateConsumableStockModal from '../components/modals/CreateConsumableStockModal';
import EditConsumableStockModal from '../components/modals/EditConsumableStockModal';
import ConfirmModal from '../components/ui/ConfirmModal';

const ConsumableStockPage: React.FC = () => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedConsumableStock, setSelectedConsumableStock] = useState<ConsumableStock | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const confirmModal = useConfirmModal();

  // Create fetch function with company filter
  const fetchConsumableStock = useCallback((params: Record<string, unknown>) => {
    const fetchParams = effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params;
    return consumableStockApi.getConsumableStock(fetchParams);
  }, [effectiveCompanyId]);

  const {
    filteredData: consumableStock,
    loading,
    search,
    setSearch,
    refresh,
  } = useEntityList<ConsumableStock>({
    fetchFn: fetchConsumableStock,
    searchFields: ['comments'],
  });

  // Refetch when effectiveCompanyId changes
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const handleEdit = (stock: ConsumableStock) => {
    setSelectedConsumableStock(stock);
    setShowEditModal(true);
  };

  const handleDelete = (stockId: string) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('consumableStock.deleteConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(stockId);
          await consumableStockApi.deleteConsumableStock(stockId);
          await refresh();
        } catch (error: any) {
          console.error('Error deleting consumable stock:', error);
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
    setSelectedConsumableStock(null);
    refresh();
  };

  const columns = [
    {
      key: 'consumableSupply',
      header: t('consumableStock.columns.consumableSupply'),
      render: (value: any, stock: ConsumableStock) => (
        <span className="text-sm font-medium text-secondary-900">
          {stock.consumableSupply?.name || 'N/A'}
        </span>
      ),
    },
    {
      key: 'warehouse',
      header: t('consumableStock.columns.warehouse'),
      render: (value: any, stock: ConsumableStock) => (
        <span className="text-sm text-secondary-900">
          {stock.warehouse?.name || 'N/A'}
        </span>
      ),
    },
    {
      key: 'supplier',
      header: t('consumableStock.columns.supplier'),
      render: (value: any, stock: ConsumableStock) => (
        <span className="text-sm text-secondary-900">
          {stock.supplier?.code || 'N/A'}
        </span>
      ),
    },
    {
      key: 'manufacturer',
      header: t('consumableStock.columns.manufacturer'),
      render: (value: any, stock: ConsumableStock) => (
        <span className="text-sm text-secondary-900">
          {stock.manufacturer?.name || 'N/A'}
        </span>
      ),
    },
    {
      key: 'quantity',
      header: t('consumableStock.columns.quantity'),
      render: (value: any, stock: ConsumableStock) => (
        <span className="text-sm text-secondary-500">
          {stock.quantity != null ? stock.quantity : 'N/A'}
        </span>
      ),
    },
    {
      key: 'price',
      header: t('consumableStock.columns.price'),
      render: (value: any, stock: ConsumableStock) => (
        <span className="text-sm text-secondary-500">
          {stock.price != null ? `$${stock.price.toFixed(2)}` : 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('consumableStock.columns.actions'),
      render: (value: any, stock: ConsumableStock) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(stock)}
            disabled={actionLoading === stock?.uuid || !stock}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(stock?.uuid)}
            disabled={actionLoading === stock?.uuid || !stock}
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
            <h1 className="text-2xl font-bold text-secondary-900">{t('consumableStock.title')}</h1>
            <p className="text-secondary-600">{t('consumableStock.subtitle')}</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('consumableStock.addConsumableStock')}
          </Button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('consumableStock.searchPlaceholder')}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('consumableStock.allConsumableStock')} ({consumableStock.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : consumableStock.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('consumableStock.empty.title')}</h3>
                <p className="mt-1 text-sm text-secondary-500">
                  {search ? t('consumableStock.empty.description') : t('consumableStock.empty.noData')}
                </p>
                {!search && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('consumableStock.addConsumableStock')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Table
                columns={columns}
                data={consumableStock}
                loading={loading}
              />
            )}
          </div>
        </div>
      </div>

      <CreateConsumableStockModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditConsumableStockModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedConsumableStock(null);
        }}
        onSuccess={handleEditSuccess}
        consumableStock={selectedConsumableStock}
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

export default ConsumableStockPage;
