import React, { useState, useCallback, useEffect , useMemo } from 'react';
import { Plus, Trash2, Edit, Warehouse as WarehouseIcon, Grid, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Warehouse } from '../types';
import { warehousesApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { FilterBar, searchFilter } from '../components/ui/filters';
import { columnFilterDefs } from '../filters/columnFilters';
import { useEntityList } from '../hooks/useEntityList';
import { usePermissions } from '../hooks/usePermissions';
import { useConfirmModal } from '../hooks/useConfirmModal';
import CreateWarehouseModal from '../components/modals/CreateWarehouseModal';
import EditWarehouseModal from '../components/modals/EditWarehouseModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import WarehouseGridEditorModal from '../components/modals/WarehouseGridEditorModal';
import WarehouseStockViewModal from '../components/modals/WarehouseStockViewModal';
import { logger } from '../utils/logger';
import { historyColumn } from '../components/audit/historyColumn';

const Warehouses: React.FC = () => {
  const { t } = useTranslation();
  const { has } = usePermissions();
  const canEdit = has('warehouses.edit');
  const { effectiveCompanyId } = useEffectiveCompany();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGridEditorModal, setShowGridEditorModal] = useState(false);
  const [showStockViewModal, setShowStockViewModal] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const confirmModal = useConfirmModal();

  const fetchWarehouses = useCallback((params: Record<string, unknown>) => {
    const fetchParams = effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params;
    return warehousesApi.getWarehouses(fetchParams);
  }, [effectiveCompanyId]);


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
          logger.error('Error deleting warehouse:', error);
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
      hideable: false,
      card: 'title' as const,
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
    historyColumn('warehouses', t),
    {
      key: 'actions',
      header: t('warehouses.columns.actions'),
      pinned: true,
      card: 'actions' as const,
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
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenGridEditor(warehouse)}
              disabled={actionLoading === warehouse?.uuid || !warehouse}
              title={t('warehouses.editGrid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
          )}
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(warehouse)}
              disabled={actionLoading === warehouse?.uuid || !warehouse}
              title={t('warehouses.editWarehouse')}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {canEdit && (
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
          )}
        </div>
      ),
    },
  ];

  const filterDefs = useMemo(
    () => [
      searchFilter(t('warehouses.searchPlaceholder')),
      ...columnFilterDefs('warehouses', columns, t, { companyId: effectiveCompanyId }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, effectiveCompanyId]
  );

  const {
    filteredData: warehouses,
    loading,
    search,
    filterBarProps,
    refresh,
    paginationProps,
  } = useEntityList<Warehouse>({
    fetchFn: fetchWarehouses,
    searchFields: ['name'],
    filterDefs,
  });


  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="gd-page-title">{t('warehouses.title')}</h1>
            <p className="text-secondary-600">{t('warehouses.subtitle')}</p>
          </div>
          {canEdit && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('warehouses.addWarehouse')}
            </Button>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <FilterBar {...filterBarProps} />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('warehouses.allWarehouses')} ({warehouses.length})
              </h2>
            </div>

            {!loading && warehouses.length === 0 ? (
              <div className="text-center py-12">
                <WarehouseIcon className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('warehouses.empty.title')}</h3>
                <p className="gd-page-sub">
                  {search ? t('warehouses.empty.description') : t('warehouses.empty.noData')}
                </p>
                {!search && canEdit && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('warehouses.addWarehouse')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Table
                  columns={columns}
                  data={warehouses}
                  loading={loading}
                  listId="warehouses"
                />
                <Pagination {...paginationProps} />
              </>
            )}
          </div>
        </div>
      </div>

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
