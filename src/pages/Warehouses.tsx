import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Edit, Warehouse as WarehouseIcon, Grid, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Warehouse } from '../types';
import { warehousesApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import { SearchInput } from '../components/ui/SearchInput';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import CreateWarehouseModal from '../components/modals/CreateWarehouseModal';
import EditWarehouseModal from '../components/modals/EditWarehouseModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import WarehouseGridEditorModal from '../components/modals/WarehouseGridEditorModal';
import WarehouseStockViewModal from '../components/modals/WarehouseStockViewModal';

const Warehouses: React.FC = () => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGridEditorModal, setShowGridEditorModal] = useState(false);
  const [showStockViewModal, setShowStockViewModal] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const confirmModal = useConfirmModal();

  // Create fetch function with company filter
  const fetchWarehouses = useCallback((params: Record<string, unknown>) => {
    const fetchParams = effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params;
    return warehousesApi.getWarehouses(fetchParams);
  }, [effectiveCompanyId]);

  // Use the entity list hook for data management
  const {
    filteredData: warehouses,
    loading,
    search,
    setSearch,
    refresh,
  } = useEntityList<Warehouse>({
    fetchFn: fetchWarehouses,
    searchFields: ['name'],
  });

  // Refetch when effectiveCompanyId changes
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const handleEdit = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setShowEditModal(true);
  };

  const handleDelete = (warehouseId: string) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('warehouses.deleteConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(warehouseId);
          await warehousesApi.deleteWarehouse(warehouseId);
          await refresh();
        } catch (error: any) {
          console.error('Error deleting warehouse:', error);
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
    setSelectedWarehouse(null);
    refresh();
  };

  const handleOpenGridEditor = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setShowGridEditorModal(true);
  };

  const handleGridEditorSuccess = () => {
    setShowGridEditorModal(false);
    setSelectedWarehouse(null);
    refresh();
  };

  const handleOpenStockView = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setShowStockViewModal(true);
  };

  const columns = [
    {
      key: 'name',
      header: t('warehouses.columns.name'),
      render: (value: any, warehouse: Warehouse) => (
        <span className="text-sm font-medium text-secondary-900">
          {warehouse.name || 'N/A'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: t('warehouses.columns.created'),
      render: (value: any, warehouse: Warehouse) => (
        <span className="text-sm text-secondary-500">
          {warehouse.createdAt ? new Date(warehouse.createdAt).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('warehouses.columns.actions'),
      render: (value: any, warehouse: Warehouse) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenStockView(warehouse)}
            disabled={actionLoading === warehouse?.uuid || !warehouse}
            title={t('warehouses.viewStock')}
          >
            <Package className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenGridEditor(warehouse)}
            disabled={actionLoading === warehouse?.uuid || !warehouse}
            title={t('warehouses.editGrid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(warehouse)}
            disabled={actionLoading === warehouse?.uuid || !warehouse}
            title={t('warehouses.editWarehouse')}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(warehouse?.uuid)}
            disabled={actionLoading === warehouse?.uuid || !warehouse}
            className="text-red-600 hover:text-red-700"
            title={t('warehouses.deleteWarehouse')}
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
            <h1 className="text-2xl font-bold text-secondary-900">{t('warehouses.title')}</h1>
            <p className="text-secondary-600">{t('warehouses.subtitle')}</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('warehouses.addWarehouse')}
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('warehouses.searchPlaceholder')}
              />
            </div>
          </div>
        </div>

        {/* Warehouses Table */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('warehouses.allWarehouses')} ({warehouses.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : warehouses.length === 0 ? (
              <div className="text-center py-12">
                <WarehouseIcon className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('warehouses.empty.title')}</h3>
                <p className="mt-1 text-sm text-secondary-500">
                  {search ? t('warehouses.empty.description') : t('warehouses.empty.noData')}
                </p>
                {!search && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('warehouses.addWarehouse')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Table
                columns={columns}
                data={warehouses}
                loading={loading}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateWarehouseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditWarehouseModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedWarehouse(null);
        }}
        onSuccess={handleEditSuccess}
        warehouse={selectedWarehouse}
      />

      <WarehouseGridEditorModal
        isOpen={showGridEditorModal}
        onClose={() => {
          setShowGridEditorModal(false);
          setSelectedWarehouse(null);
        }}
        onSuccess={handleGridEditorSuccess}
        warehouse={selectedWarehouse}
      />

      <WarehouseStockViewModal
        isOpen={showStockViewModal}
        onClose={() => {
          setShowStockViewModal(false);
          setSelectedWarehouse(null);
        }}
        warehouse={selectedWarehouse}
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

export default Warehouses;
