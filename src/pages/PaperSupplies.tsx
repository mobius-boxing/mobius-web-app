import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Trash2, Edit, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PaperSupply } from '../types';
import { paperSuppliesApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Table from '../components/ui/Table';
import CreatePaperSupplyModal from '../components/modals/CreatePaperSupplyModal';
import EditPaperSupplyModal from '../components/modals/EditPaperSupplyModal';

const PaperSupplies: React.FC = () => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [paperSupplies, setPaperSupplies] = useState<PaperSupply[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPaperSupply, setSelectedPaperSupply] = useState<PaperSupply | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPaperSupplies = useCallback(async () => {
    try {
      setLoading(true);
      const params = effectiveCompanyId ? { companyId: effectiveCompanyId } : {};
      const response = await paperSuppliesApi.getPaperSupplies(params);
      setPaperSupplies(response.data || []);
    } catch (error) {
      console.error('Error fetching paper supplies:', error);
      setPaperSupplies([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveCompanyId]);

  useEffect(() => {
    fetchPaperSupplies();
  }, [fetchPaperSupplies]);

  const handleEdit = (paperSupply: PaperSupply) => {
    setSelectedPaperSupply(paperSupply);
    setShowEditModal(true);
  };

  const handleDelete = async (paperSupplyId: string) => {
    if (!window.confirm(t('paperSupplies.deleteConfirm'))) {
      return;
    }

    try {
      setActionLoading(paperSupplyId);
      await paperSuppliesApi.deletePaperSupply(paperSupplyId);
      await fetchPaperSupplies();
    } catch (error: any) {
      console.error('Error deleting paper supply:', error);
      const errorMessage = error.response?.data?.message || t('paperSupplies.deleteFailed');
      alert(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchPaperSupplies();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedPaperSupply(null);
    fetchPaperSupplies();
  };

  // Filter paper supplies based on search term
  const filteredPaperSupplies = paperSupplies.filter((paperSupply) => {
    if (!paperSupply) return false;

    const manufacturerName = paperSupply.manufacturer?.name || paperSupply.manufacturerName;
    const supplierCode = paperSupply.supplier?.code || paperSupply.supplierCode;

    const matchesSearch = searchTerm === '' ||
      (paperSupply.code && paperSupply.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (paperSupply.name && paperSupply.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (paperSupply.description && paperSupply.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (manufacturerName && manufacturerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (supplierCode && supplierCode.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  const columns = [
    {
      key: 'code',
      header: t('paperSupplies.columns.code'),
      render: (value: any, paperSupply: PaperSupply) => (
        <span className="text-sm font-medium text-secondary-900">
          {paperSupply.code || 'N/A'}
        </span>
      ),
    },
    {
      key: 'name',
      header: t('paperSupplies.columns.name'),
      render: (value: any, paperSupply: PaperSupply) => (
        <span className="text-sm text-secondary-900">
          {paperSupply.name || 'N/A'}
        </span>
      ),
    },
    {
      key: 'manufacturer',
      header: t('paperSupplies.columns.manufacturer'),
      render: (value: any, paperSupply: PaperSupply) => (
        <span className="text-sm text-secondary-900">
          {paperSupply.manufacturer?.name || paperSupply.manufacturerName || 'N/A'}
        </span>
      ),
    },
    {
      key: 'supplier',
      header: t('paperSupplies.columns.supplier'),
      render: (value: any, paperSupply: PaperSupply) => (
        <span className="text-sm text-secondary-900">
          {paperSupply.supplier?.code || paperSupply.supplierCode || 'N/A'}
        </span>
      ),
    },
    {
      key: 'paperType',
      header: t('paperSupplies.columns.paperType'),
      render: (value: any, paperSupply: PaperSupply) => (
        <span className="text-sm text-secondary-900">
          {paperSupply.paperType?.code || 'N/A'}
        </span>
      ),
    },
    {
      key: 'grammage',
      header: t('paperSupplies.columns.grammage'),
      render: (value: any, paperSupply: PaperSupply) => (
        <span className="text-sm text-secondary-900">
          {paperSupply.grammage != null ? `${paperSupply.grammage} g/m²` : 'N/A'}
        </span>
      ),
    },
    {
      key: 'price',
      header: t('paperSupplies.columns.price'),
      render: (value: any, paperSupply: PaperSupply) => (
        <span className="text-sm text-secondary-900">
          {paperSupply.price != null ? `$${paperSupply.price.toFixed(2)}` : 'N/A'}
        </span>
      ),
    },
    {
      key: 'minimumStock',
      header: t('paperSupplies.columns.minimumStock'),
      render: (value: any, paperSupply: PaperSupply) => (
        <span className="text-sm text-secondary-500">
          {paperSupply.minimumStock
            ? `${paperSupply.minimumStock.pallets || 0} ${t('paperSupplies.pallets')} / ${paperSupply.minimumStock.boxes || 0} ${t('paperSupplies.boxes')}`
            : 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('paperSupplies.columns.actions'),
      render: (value: any, paperSupply: PaperSupply) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(paperSupply)}
            disabled={actionLoading === paperSupply?.uuid || !paperSupply}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(paperSupply?.uuid)}
            disabled={actionLoading === paperSupply?.uuid || !paperSupply}
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
            <h1 className="text-2xl font-bold text-secondary-900">{t('paperSupplies.title')}</h1>
            <p className="text-secondary-600">{t('paperSupplies.subtitle')}</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('paperSupplies.addPaperSupply')}
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
                  placeholder={t('paperSupplies.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Paper Supplies Table */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('paperSupplies.allPaperSupplies')} ({filteredPaperSupplies.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredPaperSupplies.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('paperSupplies.empty.title')}</h3>
                <p className="mt-1 text-sm text-secondary-500">
                  {searchTerm ? t('paperSupplies.empty.description') : t('paperSupplies.empty.noData')}
                </p>
                {!searchTerm && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('paperSupplies.addPaperSupply')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Table
                columns={columns}
                data={filteredPaperSupplies}
                loading={loading}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreatePaperSupplyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditPaperSupplyModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedPaperSupply(null);
        }}
        onSuccess={handleEditSuccess}
        paperSupply={selectedPaperSupply}
      />
    </Layout>
  );
};

export default PaperSupplies;
