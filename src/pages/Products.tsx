import React, { useState } from 'react';
import { Plus, Trash2, Edit, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Product } from '../types';
import { productsApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import { SearchInput } from '../components/ui/SearchInput';
import { useEntityList } from '../hooks/useEntityList';
import CreateProductModal from '../components/modals/CreateProductModal';
import EditProductModal from '../components/modals/EditProductModal';

const Products: React.FC = () => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Use the entity list hook for data management
  const {
    filteredData: products,
    loading,
    search,
    setSearch,
    refresh,
  } = useEntityList<Product>({
    fetchFn: productsApi.getProducts,
    searchFields: ['code', 'clientCode', 'description', 'customerName'],
    defaultFilters: effectiveCompanyId ? { companyId: effectiveCompanyId } : {},
  });

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm(t('products.deleteConfirm'))) {
      return;
    }

    try {
      setActionLoading(productId);
      await productsApi.deleteProduct(productId);
      await refresh();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      const errorMessage = error.response?.data?.message || t('products.deleteFailed');
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
    setSelectedProduct(null);
    refresh();
  };

  const columns = [
    {
      key: 'code',
      header: t('products.columns.code'),
      render: (value: any, product: Product) => (
        <span className="text-sm font-medium text-secondary-900">
          {product.code || 'N/A'}
        </span>
      ),
    },
    {
      key: 'clientCode',
      header: t('products.columns.clientCode'),
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
          {product.customerName || 'N/A'}
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">{t('products.title')}</h1>
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

        {/* Filters */}
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

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('products.allProducts')} ({products.length})
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
                <p className="mt-1 text-sm text-secondary-500">
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
              <Table
                columns={columns}
                data={products}
                loading={loading}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
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
    </Layout>
  );
};

export default Products;
