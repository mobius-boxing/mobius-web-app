import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Edit, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ProductType } from '../types';
import { productTypesApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { SearchInput } from '../components/ui/SearchInput';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import CreateProductTypeModal from '../components/modals/CreateProductTypeModal';
import EditProductTypeModal from '../components/modals/EditProductTypeModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { logger } from '../utils/logger';

const ProductTypes: React.FC = () => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ProductType | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const confirmModal = useConfirmModal();

  const fetchItems = useCallback((params: Record<string, unknown>) => {
    const fetchParams = effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params;
    return productTypesApi.getProductTypes(fetchParams);
  }, [effectiveCompanyId]);

  const {
    data: items,
    loading,
    search,
    setSearch,
    refresh,
    pagination,
    paginationProps,
    sortBy,
    sortOrder,
    setSort,
  } = useEntityList<ProductType>({
    fetchFn: fetchItems,
    searchFields: ['code', 'name'],
  });

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const handleEdit = (item: ProductType) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleDelete = (uuid: string) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('productTypes.deleteConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(uuid);
          await productTypesApi.deleteProductType(uuid);
          await refresh();
        } catch (error: any) {
          logger.error('Error deleting product type:', error);
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
    setSelectedItem(null);
    refresh();
  };

  const handleSort = (field: string, order: 'asc' | 'desc') => {
    setSort(field, order);
  };

  const columns = [
    {
      key: 'code',
      header: t('productTypes.columns.code'),
      sortable: true,
      render: (value: any, item: ProductType) => (
        <span className="text-sm font-medium text-secondary-900">
          {item.code || 'N/A'}
        </span>
      ),
    },
    {
      key: 'name',
      header: t('productTypes.columns.name'),
      sortable: true,
      render: (value: any, item: ProductType) => (
        <span className="text-sm text-secondary-500">
          {item.name || '-'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: t('productTypes.columns.created'),
      sortable: true,
      render: (value: any, item: ProductType) => (
        <span className="text-sm text-secondary-500">
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('productTypes.columns.actions'),
      render: (value: any, item: ProductType) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(item)}
            disabled={actionLoading === item?.uuid || !item}
            title={t('productTypes.editProductType')}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(item?.uuid)}
            disabled={actionLoading === item?.uuid || !item}
            className="text-red-600 hover:text-red-700"
            title={t('productTypes.deleteProductType')}
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
            <h1 className="text-2xl font-bold text-secondary-900">{t('productTypes.title')}</h1>
            <p className="text-secondary-600">{t('productTypes.subtitle')}</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('productTypes.addProductType')}
          </Button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('productTypes.searchPlaceholder')}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('productTypes.allProductTypes')} ({pagination.total})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12">
                <Layers className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('productTypes.empty.title')}</h3>
                <p className="mt-1 text-sm text-secondary-500">
                  {search ? t('productTypes.empty.description') : t('productTypes.empty.noData')}
                </p>
                {!search && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('productTypes.addProductType')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Table
                  columns={columns}
                  data={items}
                  loading={loading}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <Pagination {...paginationProps} />
              </>
            )}
          </div>
        </div>
      </div>

      <CreateProductTypeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditProductTypeModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedItem(null);
        }}
        onSuccess={handleEditSuccess}
        productType={selectedItem}
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

export default ProductTypes;
