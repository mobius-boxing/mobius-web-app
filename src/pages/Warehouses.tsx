import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Edit, Warehouse as WarehouseIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Warehouse } from '../types';
import { warehousesApi } from '../services/api';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Table from '../components/ui/Table';
import CreateWarehouseModal from '../components/modals/CreateWarehouseModal';
import EditWarehouseModal from '../components/modals/EditWarehouseModal';

const Warehouses: React.FC = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const response = await warehousesApi.getWarehouses();
      setWarehouses(response.data || []);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      setWarehouses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setShowEditModal(true);
  };

  const handleDelete = async (warehouseId: string) => {
    if (!window.confirm(t('warehouses.deleteConfirm'))) {
      return;
    }

    try {
      setActionLoading(warehouseId);
      await warehousesApi.deleteWarehouse(warehouseId);
      await fetchWarehouses();
    } catch (error: any) {
      console.error('Error deleting warehouse:', error);
      const errorMessage = error.response?.data?.message || t('warehouses.deleteFailed');
      alert(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchWarehouses();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedWarehouse(null);
    fetchWarehouses();
  };

  // Filter warehouses based on search term
  const filteredWarehouses = warehouses.filter((warehouse) => {
    if (!warehouse) return false;

    const matchesSearch = searchTerm === '' ||
      (warehouse.name && warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

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
            onClick={() => handleEdit(warehouse)}
            disabled={actionLoading === warehouse?.uuid || !warehouse}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(warehouse?.uuid)}
            disabled={actionLoading === warehouse?.uuid || !warehouse}
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                <Input
                  type="text"
                  placeholder={t('warehouses.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Warehouses Table */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('warehouses.allWarehouses')} ({filteredWarehouses.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredWarehouses.length === 0 ? (
              <div className="text-center py-12">
                <WarehouseIcon className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('warehouses.empty.title')}</h3>
                <p className="mt-1 text-sm text-secondary-500">
                  {searchTerm ? t('warehouses.empty.description') : t('warehouses.empty.noData')}
                </p>
                {!searchTerm && (
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
                data={filteredWarehouses}
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
    </Layout>
  );
};

export default Warehouses;
