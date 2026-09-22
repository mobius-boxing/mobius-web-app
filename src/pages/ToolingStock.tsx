import React, { useState, useCallback, useEffect , useMemo } from 'react';
import { Plus, Trash2, Edit, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ToolingStock } from '../types';
import { toolingStockApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import ActionButton from '../components/ui/ActionButton';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { FilterBar, searchFilter } from '../components/ui/filters';
import { columnFilterDefs } from '../filters/columnFilters';
import { useEntityList } from '../hooks/useEntityList';
import { usePermissions } from '../hooks/usePermissions';
import { useConfirmModal } from '../hooks/useConfirmModal';
import CreateToolingStockModal from '../components/modals/CreateToolingStockModal';
import EditToolingStockModal from '../components/modals/EditToolingStockModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { logger } from '../utils/logger';
import { historyColumn } from '../components/audit/historyColumn';

const ToolingStockPage: React.FC = () => {
  const { t } = useTranslation();
  const { has } = usePermissions();
  const canEdit = has('tooling-stock.edit');
  const { effectiveCompanyId } = useEffectiveCompany();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedToolingStock, setSelectedToolingStock] = useState<ToolingStock | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const confirmModal = useConfirmModal();

  const fetchToolingStock = useCallback((params: Record<string, unknown>) => {
    const fetchParams = effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params;
    return toolingStockApi.getToolingStock(fetchParams);
  }, [effectiveCompanyId]);


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
          logger.error('Error deleting tooling stock:', error);
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
      hideable: false,
      card: 'title' as const,
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
    historyColumn('tooling_stock', t),
    {
      key: 'actions',
      header: t('toolingStock.columns.actions'),
      pinned: true,
      card: 'actions' as const,
      render: (value: any, stock: ToolingStock) => (
        <div className="flex items-center space-x-2">
          {canEdit && (
            <ActionButton
              label={t('common.edit')}
              onClick={() => handleEdit(stock)}
              disabled={actionLoading === stock?.uuid || !stock}
            >
              <Edit className="h-4 w-4" />
            </ActionButton>
          )}
          {canEdit && (
            <ActionButton
              label={t('common.delete')}
              tone="danger"
              onClick={() => handleDelete(stock?.uuid)}
              disabled={actionLoading === stock?.uuid || !stock}
            >
              <Trash2 className="h-4 w-4" />
            </ActionButton>
          )}
        </div>
      ),
    },
  ];

  const filterDefs = useMemo(
    () => [
      searchFilter(t('toolingStock.searchPlaceholder')),
      ...columnFilterDefs('tooling-stock', columns, t, { companyId: effectiveCompanyId }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, effectiveCompanyId]
  );

  const {
    filteredData: toolingStock,
    loading,
    search,
    filterBarProps,
    refresh,
    paginationProps,
  } = useEntityList<ToolingStock>({
    fetchFn: fetchToolingStock,
    searchFields: ['comments'],
    filterDefs,
  });


  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="gd-page-title">{t('toolingStock.title')}</h1>
            <p className="text-secondary-600">{t('toolingStock.subtitle')}</p>
          </div>
          {canEdit && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('toolingStock.addToolingStock')}
            </Button>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <FilterBar {...filterBarProps} />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('toolingStock.allToolingStock')} ({toolingStock.length})
              </h2>
            </div>

            {!loading && toolingStock.length === 0 ? (
              <div className="text-center py-12">
                <Wrench className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('toolingStock.empty.title')}</h3>
                <p className="gd-page-sub">
                  {search ? t('toolingStock.empty.description') : t('toolingStock.empty.noData')}
                </p>
                {!search && canEdit && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('toolingStock.addToolingStock')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Table
                  columns={columns}
                  data={toolingStock}
                  loading={loading}
                  listId="tooling-stock"
                />
                <Pagination {...paginationProps} />
              </>
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
