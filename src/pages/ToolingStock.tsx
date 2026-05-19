import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Edit, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ToolingStock } from '../types';
import { toolingStockApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import { SearchInput } from '../components/ui/SearchInput';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import CreateToolingStockModal from '../components/modals/CreateToolingStockModal';
import EditToolingStockModal from '../components/modals/EditToolingStockModal';
import ConfirmModal from '../components/ui/ConfirmModal';

const ToolingStockPage: React.FC = () => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedToolingStock, setSelectedToolingStock] = useState<ToolingStock | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const confirmModal = useConfirmModal();

  // Create fetch function with company filter
  const fetchToolingStock = useCallback((params: Record<string, unknown>) => {
    const fetchParams = effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params;
    return toolingStockApi.getToolingStock(fetchParams);
  }, [effectiveCompanyId]);

  const {
    filteredData: toolingStock,
    loading,
    search,
    setSearch,
    refresh,
  } = useEntityList<ToolingStock>({
    fetchFn: fetchToolingStock,
    searchFields: ['comments'],
  });

  // Refetch when effectiveCompanyId changes
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const handleEdit = (stock: ToolingStock) => {
    setSelectedToolingStock(stock);
    setShowEditModal(true);
  };

  const handleDelete = (stockId: string) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('toolingStock.deleteConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(stockId);
          await toolingStockApi.deleteToolingStock(stockId);
          await refresh();
        } catch (error: any) {
          console.error('Error deleting tooling stock:', error);
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
    setSelectedToolingStock(null);
    refresh();
  };

  const columns = [
    {
      key: 'tooling',
      header: t('toolingStock.columns.tooling'),
      render: (value: any, stock: ToolingStock) => (
        <span className="text-sm font-medium text-secondary-900">
          {stock.tooling?.name || 'N/A'}
        </span>
      ),
    },
    {
      key: 'warehouse',
      header: t('toolingStock.columns.warehouse'),
      render: (value: any, stock: ToolingStock) => (
        <span className="text-sm text-secondary-900">
          {stock.warehouse?.name || 'N/A'}
        </span>
      ),
    },
    {
      key: 'supplier',
      header: t('toolingStock.columns.supplier'),
      render: (value: any, stock: ToolingStock) => (
        <span className="text-sm text-secondary-900">
          {stock.supplier?.code || 'N/A'}
        </span>
      ),
    },
    {
      key: 'manufacturer',
      header: t('toolingStock.columns.manufacturer'),
      render: (value: any, stock: ToolingStock) => (
        <span className="text-sm text-secondary-900">
          {stock.manufacturer?.name || 'N/A'}
        </span>
      ),
    },
    {
      key: 'quantity',
      header: t('toolingStock.columns.quantity'),
      render: (value: any, stock: ToolingStock) => (
        <span className="text-sm text-secondary-500">
          {stock.quantity != null ? stock.quantity : 'N/A'}
        </span>
      ),
    },
    {
      key: 'price',
      header: t('toolingStock.columns.price'),
      render: (value: any, stock: ToolingStock) => (
        <span className="text-sm text-secondary-500">
          {stock.price != null ? `$${stock.price.toFixed(2)}` : 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('toolingStock.columns.actions'),
      render: (value: any, stock: ToolingStock) => (
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
            <h1 className="text-2xl font-bold text-secondary-900">{t('toolingStock.title')}</h1>
            <p className="text-secondary-600">{t('toolingStock.subtitle')}</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('toolingStock.addToolingStock')}
          </Button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('toolingStock.searchPlaceholder')}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('toolingStock.allToolingStock')} ({toolingStock.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : toolingStock.length === 0 ? (
              <div className="text-center py-12">
                <Wrench className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('toolingStock.empty.title')}</h3>
                <p className="mt-1 text-sm text-secondary-500">
                  {search ? t('toolingStock.empty.description') : t('toolingStock.empty.noData')}
                </p>
                {!search && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('toolingStock.addToolingStock')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Table
                columns={columns}
                data={toolingStock}
                loading={loading}
              />
            )}
          </div>
        </div>
      </div>

      <CreateToolingStockModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditToolingStockModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedToolingStock(null);
        }}
        onSuccess={handleEditSuccess}
        toolingStock={selectedToolingStock}
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

export default ToolingStockPage;
