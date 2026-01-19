import React, { useState } from 'react';
import { Plus, Trash2, Edit, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Supplier } from '../types';
import { suppliersApi } from '../services/api';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import { SearchInput } from '../components/ui/SearchInput';
import { useEntityList } from '../hooks/useEntityList';
import CreateSupplierModal from '../components/modals/CreateSupplierModal';
import EditSupplierModal from '../components/modals/EditSupplierModal';

const Suppliers: React.FC = () => {
  const { t } = useTranslation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Use the entity list hook for data management
  const {
    filteredData: suppliers,
    loading,
    search,
    setSearch,
    refresh,
  } = useEntityList<Supplier>({
    fetchFn: suppliersApi.getSuppliers,
    searchFields: ['code'],
  });

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowEditModal(true);
  };

  const handleDelete = async (supplierId: string) => {
    if (!window.confirm(t('suppliers.deleteConfirm'))) {
      return;
    }

    try {
      setActionLoading(supplierId);
      await suppliersApi.deleteSupplier(supplierId);
      await refresh();
    } catch (error: any) {
      console.error('Error deleting supplier:', error);
      const errorMessage = error.response?.data?.message || t('suppliers.deleteFailed');
      alert(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    refresh();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedSupplier(null);
    refresh();
  };

  const getBadgeColor = (value: boolean) => {
    return value
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';
  };

  const columns = [
    {
      key: 'code',
      header: t('suppliers.columns.code'),
      render: (value: any, supplier: Supplier) => (
        <span className="text-sm font-medium text-secondary-900">
          {supplier.code || 'N/A'}
        </span>
      ),
    },
    {
      key: 'suppliesSheets',
      header: t('suppliers.columns.sheets'),
      render: (value: any, supplier: Supplier) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getBadgeColor(supplier?.suppliesSheets ?? false)}`}>
          {supplier?.suppliesSheets ? t('common.yes') : t('common.no')}
        </span>
      ),
    },
    {
      key: 'suppliesElaborated',
      header: t('suppliers.columns.elaborated'),
      render: (value: any, supplier: Supplier) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getBadgeColor(supplier?.suppliesElaborated ?? false)}`}>
          {supplier?.suppliesElaborated ? t('common.yes') : t('common.no')}
        </span>
      ),
    },
    {
      key: 'suppliesConsumables',
      header: t('suppliers.columns.consumables'),
      render: (value: any, supplier: Supplier) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getBadgeColor(supplier?.suppliesConsumables ?? false)}`}>
          {supplier?.suppliesConsumables ? t('common.yes') : t('common.no')}
        </span>
      ),
    },
    {
      key: 'suppliesPaper',
      header: t('suppliers.columns.paper'),
      render: (value: any, supplier: Supplier) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getBadgeColor(supplier?.suppliesPaper ?? false)}`}>
          {supplier?.suppliesPaper ? t('common.yes') : t('common.no')}
        </span>
      ),
    },
    {
      key: 'suppliesTooling',
      header: t('suppliers.columns.tooling'),
      render: (value: any, supplier: Supplier) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getBadgeColor(supplier?.suppliesTooling ?? false)}`}>
          {supplier?.suppliesTooling ? t('common.yes') : t('common.no')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('suppliers.columns.actions'),
      render: (value: any, supplier: Supplier) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(supplier)}
            disabled={actionLoading === supplier?.uuid || !supplier}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(supplier?.uuid)}
            disabled={actionLoading === supplier?.uuid || !supplier}
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
            <h1 className="text-2xl font-bold text-secondary-900">{t('suppliers.title')}</h1>
            <p className="text-secondary-600">{t('suppliers.subtitle')}</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('suppliers.addSupplier')}
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('suppliers.searchPlaceholder')}
              />
            </div>
          </div>
        </div>

        {/* Suppliers Table */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('suppliers.allSuppliers')} ({suppliers.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : suppliers.length === 0 ? (
              <div className="text-center py-12">
                <Truck className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('suppliers.empty.title')}</h3>
                <p className="mt-1 text-sm text-secondary-500">
                  {search ? t('suppliers.empty.description') : t('suppliers.empty.noData')}
                </p>
                {!search && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('suppliers.addSupplier')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Table
                columns={columns}
                data={suppliers}
                loading={loading}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateSupplierModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditSupplierModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedSupplier(null);
        }}
        onSuccess={handleEditSuccess}
        supplier={selectedSupplier}
      />
    </Layout>
  );
};

export default Suppliers;
