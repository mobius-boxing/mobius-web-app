import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Edit, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PaperStock } from '../types';
import { paperStockApi } from '../services/api';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Table from '../components/ui/Table';
import CreatePaperStockModal from '../components/modals/CreatePaperStockModal';
import EditPaperStockModal from '../components/modals/EditPaperStockModal';

const PaperStockPage: React.FC = () => {
  const { t } = useTranslation();
  const [paperStock, setPaperStock] = useState<PaperStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPaperStock, setSelectedPaperStock] = useState<PaperStock | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPaperStock();
  }, []);

  const fetchPaperStock = async () => {
    try {
      setLoading(true);
      const response = await paperStockApi.getPaperStock();
      setPaperStock(response.data || []);
    } catch (error) {
      console.error('Error fetching paper stock:', error);
      setPaperStock([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (stock: PaperStock) => {
    setSelectedPaperStock(stock);
    setShowEditModal(true);
  };

  const handleDelete = async (stockId: string) => {
    if (!window.confirm(t('paperStock.deleteConfirm'))) {
      return;
    }

    try {
      setActionLoading(stockId);
      await paperStockApi.deletePaperStock(stockId);
      await fetchPaperStock();
    } catch (error: any) {
      console.error('Error deleting paper stock:', error);
      const errorMessage = error.response?.data?.message || t('paperStock.deleteFailed');
      alert(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchPaperStock();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedPaperStock(null);
    fetchPaperStock();
  };

  const filteredPaperStock = paperStock.filter((stock) => {
    if (!stock) return false;

    const matchesSearch = searchTerm === '' ||
      (stock.comments && stock.comments.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (stock.warehouse?.name && stock.warehouse.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (stock.supplier?.code && stock.supplier.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (stock.manufacturer?.name && stock.manufacturer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (stock.paperSupply?.code && stock.paperSupply.code.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

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
            <h1 className="text-2xl font-bold text-secondary-900">{t('paperStock.title')}</h1>
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                <Input
                  type="text"
                  placeholder={t('paperStock.searchPlaceholder')}
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
                {t('paperStock.allPaperStock')} ({filteredPaperStock.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredPaperStock.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('paperStock.empty.title')}</h3>
                <p className="mt-1 text-sm text-secondary-500">
                  {searchTerm ? t('paperStock.empty.description') : t('paperStock.empty.noData')}
                </p>
                {!searchTerm && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('paperStock.addPaperStock')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Table
                columns={columns}
                data={filteredPaperStock}
                loading={loading}
              />
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
    </Layout>
  );
};

export default PaperStockPage;
