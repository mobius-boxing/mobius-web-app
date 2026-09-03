import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Edit, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Product } from '../types';
import { productsApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { SearchInput } from '../components/ui/SearchInput';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import CreateProductModal from '../components/modals/CreateProductModal';
import EditProductModal from '../components/modals/EditProductModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { logger } from '../utils/logger';
import { historyColumn } from '../components/audit/historyColumn';

const Products: React.FC = () => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const confirmModal = useConfirmModal();

  const fetchProducts = useCallback((params: Record<string, unknown>) => {
    const fetchParams = effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params;
    return productsApi.getProducts(fetchParams);
  }, [effectiveCompanyId]);

  const {
    data: products,
    loading,
    search,
    setSearch,
    refresh,
    pagination,
    paginationProps,
    sortBy,
    sortOrder,
    setSort,
  } = useEntityList<Product>({
    fetchFn: fetchProducts,
    searchFields: ['code', 'clientCode', 'description', 'customerName'],
  });

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleDelete = (productId: string) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('products.deleteConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(productId);
          await productsApi.deleteProduct(productId);
          await refresh();
        } catch (error: any) {
          logger.error('Error deleting product:', error);
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
    setSelectedProduct(null);
    refresh();
  };

  const handleSort = (field: string, order: 'asc' | 'desc') => {
    setSort(field, order);
  };

  const columns = [
    {
      key: 'code',
      header: t('products.columns.code'),
      sortable: true,
      render: (value: any, product: Product) => (
        <span className="text-sm font-medium text-secondary-900">
          {product.code || 'N/A'}
        </span>
      ),
    },
    {
      key: 'clientCode',
      header: t('products.columns.clientCode'),
      sortable: true,
      render: (value: any, product: Product) => (
        <span className="text-sm text-secondary-900">
          {product.clientCode || 'N/A'}
        </span>
      ),
    },
    {
      key: 'customer',
      header: t('products.columns.customer'),
      render: (value: any, product: Product) => (
        <span className="text-sm text-secondary-900">
          {product.customer?.name || product.customerName || 'N/A'}
        </span>
      ),
    },
    {
      key: 'description',
      header: t('products.columns.description'),
      render: (value: any, product: Product) => (
        <span className="text-sm text-secondary-500">
          {product.description || 'N/A'}
        </span>
      ),
    },
    {
      key: 'revision',
      header: t('products.columns.revision'),
      render: (value: any, product: Product) => (
        <span className="text-sm text-secondary-500">
          {product.revision ?? 0}
        </span>
      ),
    },
    {
      key: 'vip',
      header: t('products.columns.vip'),
      render: (value: any, product: Product) => (
        <span className={`text-sm font-medium ${product.vip ? 'text-green-600' : 'text-secondary-400'}`}>
          {product.vip ? t('common.yes') : t('common.no')}
        </span>
      ),
    },
    {
      key: 'productType',
      header: t('products.columns.productType'),
      render: (value: any, product: Product) => (
        <span className="text-sm text-secondary-500">
          {product.productType?.code || '-'}
        </span>
      ),
    },
    {
      key: 'boxType',
      header: t('products.columns.boxType'),
      render: (value: any, product: Product) => (
        <span className="text-sm text-secondary-500">
          {product.boxType?.code || '-'}
        </span>
      ),
    },
    historyColumn('products', t),
    {
      key: 'actions',
      header: t('products.columns.actions'),
      render: (value: any, product: Product) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(product)}
            disabled={actionLoading === product?.uuid || !product}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(product?.uuid)}
            disabled={actionLoading === product?.uuid || !product}
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
            <h1 className="gd-page-title">{t('products.title')}</h1>
            <p className="text-secondary-600">{t('products.subtitle')}</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('products.addProduct')}
          </Button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('products.searchPlaceholder')}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('products.allProducts')} ({pagination.total})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('products.empty.title')}</h3>
                <p className="gd-page-sub">
                  {search ? t('products.empty.description') : t('products.empty.noData')}
                </p>
                {!search && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('products.addProduct')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Table
                  columns={columns}
                  data={products}
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

      <CreateProductModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditProductModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedProduct(null);
        }}
        onSuccess={handleEditSuccess}
        product={selectedProduct}
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

export default Products;
