import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Edit, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Manufacturer } from '../types';
import { manufacturersApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { SearchInput } from '../components/ui/SearchInput';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import CreateManufacturerModal from '../components/modals/CreateManufacturerModal';
import EditManufacturerModal from '../components/modals/EditManufacturerModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { logger } from '../utils/logger';

const Manufacturers: React.FC = () => {
  const { t } = useTranslation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState<Manufacturer | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { effectiveCompanyId } = useEffectiveCompany();
  const confirmModal = useConfirmModal();

  // Fetch function with company filter
  const fetchManufacturers = useCallback((params: Record<string, unknown>) => {
    const fetchParams = effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params;
    return manufacturersApi.getManufacturers(fetchParams);
  }, [effectiveCompanyId]);

  // Use the entity list hook for data management
  const {
    filteredData: manufacturers,
    loading,
    search,
    setSearch,
    refresh,
    paginationProps,
  } = useEntityList<Manufacturer>({
    fetchFn: fetchManufacturers,
    searchFields: ['code', 'name'],
  });

  // Refresh when company changes
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const handleEdit = (manufacturer: Manufacturer) => {
    setSelectedManufacturer(manufacturer);
    setShowEditModal(true);
  };

  const handleDelete = (manufacturerId: string) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('manufacturers.deleteConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(manufacturerId);
          await manufacturersApi.deleteManufacturer(manufacturerId);
          await refresh();
        } catch (error: any) {
          logger.error('Error deleting manufacturer:', error);
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
    setSelectedManufacturer(null);
    refresh();
  };

  const columns = [
    {
      key: 'code',
      header: t('manufacturers.columns.code'),
      render: (value: any, manufacturer: Manufacturer) => (
        <span className="text-sm font-medium text-secondary-900">
          {manufacturer.code || 'N/A'}
        </span>
      ),
    },
    {
      key: 'name',
      header: t('manufacturers.columns.name'),
      render: (value: any, manufacturer: Manufacturer) => (
        <span className="text-sm text-secondary-900">
          {manufacturer.name || 'N/A'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: t('manufacturers.columns.created'),
      render: (value: any, manufacturer: Manufacturer) => (
        <span className="text-sm text-secondary-500">
          {manufacturer.createdAt ? new Date(manufacturer.createdAt).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('manufacturers.columns.actions'),
      render: (value: any, manufacturer: Manufacturer) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(manufacturer)}
            disabled={actionLoading === manufacturer?.uuid || !manufacturer}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(manufacturer?.uuid)}
            disabled={actionLoading === manufacturer?.uuid || !manufacturer}
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
            <h1 className="text-2xl font-bold text-secondary-900">{t('manufacturers.title')}</h1>
            <p className="text-secondary-600">{t('manufacturers.subtitle')}</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('manufacturers.addManufacturer')}
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('manufacturers.searchPlaceholder')}
              />
            </div>
          </div>
        </div>

        {/* Manufacturers Table */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('manufacturers.allManufacturers')} ({manufacturers.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : manufacturers.length === 0 ? (
              <div className="text-center py-12">
                <Wrench className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('manufacturers.empty.title')}</h3>
                <p className="mt-1 text-sm text-secondary-500">
                  {search ? t('manufacturers.empty.description') : t('manufacturers.empty.noData')}
                </p>
                {!search && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('manufacturers.addManufacturer')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Table
                  columns={columns}
                  data={manufacturers}
                  loading={loading}
                />
                <Pagination {...paginationProps} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateManufacturerModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditManufacturerModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedManufacturer(null);
        }}
        onSuccess={handleEditSuccess}
        manufacturer={selectedManufacturer}
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

export default Manufacturers;
