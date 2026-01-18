import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Trash2, Edit, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SheetStock } from '../types';
import { sheetStockApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Table from '../components/ui/Table';
import CreateSheetStockModal from '../components/modals/CreateSheetStockModal';
import EditSheetStockModal from '../components/modals/EditSheetStockModal';

const SheetStockPage: React.FC = () => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [sheetStock, setSheetStock] = useState<SheetStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSheetStock, setSelectedSheetStock] = useState<SheetStock | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSheetStock = useCallback(async () => {
    try {
      setLoading(true);
      const params = effectiveCompanyId ? { companyId: effectiveCompanyId } : {};
      const response = await sheetStockApi.getSheetStock(params);
      setSheetStock(response.data || []);
    } catch (error) {
      console.error('Error fetching sheet stock:', error);
      setSheetStock([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveCompanyId]);

  useEffect(() => {
    fetchSheetStock();
  }, [fetchSheetStock]);

  const handleEdit = (stock: SheetStock) => {
    setSelectedSheetStock(stock);
    setShowEditModal(true);
  };

  const handleDelete = async (stockId: string) => {
    if (!window.confirm(t('sheetStock.deleteConfirm'))) {
      return;
    }

    try {
      setActionLoading(stockId);
      await sheetStockApi.deleteSheetStock(stockId);
      await fetchSheetStock();
    } catch (error: any) {
      console.error('Error deleting sheet stock:', error);
      const errorMessage = error.response?.data?.message || t('sheetStock.deleteFailed');
      alert(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchSheetStock();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedSheetStock(null);
    fetchSheetStock();
  };

  const filteredSheetStock = sheetStock.filter((stock) => {
    if (!stock) return false;

    const matchesSearch = searchTerm === '' ||
      (stock.comments && stock.comments.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (stock.warehouse?.name && stock.warehouse.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (stock.supplier?.code && stock.supplier.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (stock.manufacturer?.name && stock.manufacturer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (stock.paperSheet?.code && stock.paperSheet.code.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  const columns = [
    {
      key: 'paperSheet',
      header: t('sheetStock.columns.paperSheet'),
      render: (value: any, stock: SheetStock) => (
        <span className="text-sm font-medium text-secondary-900">
          {stock.paperSheet?.code || 'N/A'}
        </span>
      ),
    },
    {
      key: 'warehouse',
      header: t('sheetStock.columns.warehouse'),
      render: (value: any, stock: SheetStock) => (
        <span className="text-sm text-secondary-900">
          {stock.warehouse?.name || 'N/A'}
        </span>
      ),
    },
    {
      key: 'supplier',
      header: t('sheetStock.columns.supplier'),
      render: (value: any, stock: SheetStock) => (
        <span className="text-sm text-secondary-900">
          {stock.supplier?.code || 'N/A'}
        </span>
      ),
    },
    {
      key: 'manufacturer',
      header: t('sheetStock.columns.manufacturer'),
      render: (value: any, stock: SheetStock) => (
        <span className="text-sm text-secondary-900">
          {stock.manufacturer?.name || 'N/A'}
        </span>
      ),
    },
    {
      key: 'quantity',
      header: t('sheetStock.columns.quantity'),
      render: (value: any, stock: SheetStock) => (
        <span className="text-sm text-secondary-500">
          {stock.quantity != null ? stock.quantity : 'N/A'}
        </span>
      ),
    },
    {
      key: 'price',
      header: t('sheetStock.columns.price'),
      render: (value: any, stock: SheetStock) => (
        <span className="text-sm text-secondary-500">
          {stock.price != null ? `$${stock.price.toFixed(2)}` : 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('sheetStock.columns.actions'),
      render: (value: any, stock: SheetStock) => (
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
            <h1 className="text-2xl font-bold text-secondary-900">{t('sheetStock.title')}</h1>
            <p className="text-secondary-600">{t('sheetStock.subtitle')}</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('sheetStock.addSheetStock')}
          </Button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                <Input
                  type="text"
                  placeholder={t('sheetStock.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('sheetStock.allSheetStock')} ({filteredSheetStock.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredSheetStock.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('sheetStock.empty.title')}</h3>
                <p className="mt-1 text-sm text-secondary-500">
                  {searchTerm ? t('sheetStock.empty.description') : t('sheetStock.empty.noData')}
                </p>
                {!searchTerm && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('sheetStock.addSheetStock')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Table
                columns={columns}
                data={filteredSheetStock}
                loading={loading}
              />
            )}
          </div>
        </div>
      </div>

      <CreateSheetStockModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditSheetStockModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedSheetStock(null);
        }}
        onSuccess={handleEditSuccess}
        sheetStock={selectedSheetStock}
      />
    </Layout>
  );
};

export default SheetStockPage;
