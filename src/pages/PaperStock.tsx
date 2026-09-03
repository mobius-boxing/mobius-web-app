import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Edit, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PaperStock } from '../types';
import { paperStockApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { SearchInput } from '../components/ui/SearchInput';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import CreatePaperStockModal from '../components/modals/CreatePaperStockModal';
import EditPaperStockModal from '../components/modals/EditPaperStockModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { logger } from '../utils/logger';
import { historyColumn } from '../components/audit/historyColumn';

const PaperStockPage: React.FC = () => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPaperStock, setSelectedPaperStock] = useState<PaperStock | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const confirmModal = useConfirmModal();

  const fetchPaperStock = useCallback((params: Record<string, unknown>) => {
    const fetchParams = effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params;
    return paperStockApi.getPaperStock(fetchParams);
  }, [effectiveCompanyId]);

  const {
    filteredData: paperStock,
    loading,
    search,
    setSearch,
    refresh,
    paginationProps,
  } = useEntityList<PaperStock>({
    fetchFn: fetchPaperStock,
    searchFields: ['comments'],
  });

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const handleEdit = (stock: PaperStock) => {
    setSelectedPaperStock(stock);
    setShowEditModal(true);
  };

  const handleDelete = (stockId: string) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('paperStock.deleteConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(stockId);
          await paperStockApi.deletePaperStock(stockId);
          await refresh();
        } catch (error: any) {
          logger.error('Error deleting paper stock:', error);
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
    setSelectedPaperStock(null);
    refresh();
  };

  const columns = [
    {
      key: 'paperSupply',
      header: t('paperStock.columns.paperSupply'),
      render: (value: any, stock: PaperStock) => (
        <span className="text-sm font-medium text-secondary-900">
          {stock.paperSupply?.code || 'N/A'}
        </span>
      ),
    },
    {
      key: 'warehouse',
      header: t('paperStock.columns.warehouse'),
      render: (value: any, stock: PaperStock) => (
        <span className="text-sm text-secondary-900">
          {stock.warehouse?.name || 'N/A'}
        </span>
      ),
    },
    {
      key: 'supplier',
      header: t('paperStock.columns.supplier'),
      render: (value: any, stock: PaperStock) => (
        <span className="text-sm text-secondary-900">
          {stock.supplier?.code || 'N/A'}
        </span>
      ),
    },
    {
      key: 'manufacturer',
      header: t('paperStock.columns.manufacturer'),
      render: (value: any, stock: PaperStock) => (
        <span className="text-sm text-secondary-900">
          {stock.manufacturer?.name || 'N/A'}
        </span>
      ),
    },
    {
      key: 'dimensions',
      header: t('paperStock.columns.dimensions'),
      render: (value: any, stock: PaperStock) => (
        <span className="text-sm text-secondary-500">
          {stock.weight != null ? `${stock.weight} kg` : ''}
          {stock.diameter != null ? ` / ${stock.diameter} cm` : ''}
          {stock.width != null ? ` / ${stock.width} cm` : ''}
          {!stock.weight && !stock.diameter && !stock.width ? 'N/A' : ''}
        </span>
      ),
    },
    {
      key: 'price',
      header: t('paperStock.columns.price'),
      render: (value: any, stock: PaperStock) => (
        <span className="text-sm text-secondary-500">
          {stock.price != null ? `$${stock.price.toFixed(2)}` : 'N/A'}
        </span>
      ),
    },
    historyColumn('paper_stock', t),
    {
      key: 'actions',
      header: t('paperStock.columns.actions'),
      render: (value: any, stock: PaperStock) => (
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
            <h1 className="gd-page-title">{t('paperStock.title')}</h1>
            <p className="text-secondary-600">{t('paperStock.subtitle')}</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('paperStock.addPaperStock')}
          </Button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('paperStock.searchPlaceholder')}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('paperStock.allPaperStock')} ({paperStock.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : paperStock.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('paperStock.empty.title')}</h3>
                <p className="gd-page-sub">
                  {search ? t('paperStock.empty.description') : t('paperStock.empty.noData')}
                </p>
                {!search && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('paperStock.addPaperStock')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Table
                  columns={columns}
                  data={paperStock}
                  loading={loading}
                />
                <Pagination {...paginationProps} />
              </>
            )}
          </div>
        </div>
      </div>

      <CreatePaperStockModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditPaperStockModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedPaperStock(null);
        }}
        onSuccess={handleEditSuccess}
        paperStock={selectedPaperStock}
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

export default PaperStockPage;
