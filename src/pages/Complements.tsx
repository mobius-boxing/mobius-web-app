import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Edit, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Complement } from '../types';
import { complementsApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { SearchInput } from '../components/ui/SearchInput';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import CreateComplementModal from '../components/modals/CreateComplementModal';
import EditComplementModal from '../components/modals/EditComplementModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { logger } from '../utils/logger';

const Complements: React.FC = () => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedComplement, setSelectedComplement] = useState<Complement | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const confirmModal = useConfirmModal();

  // Create fetch function with company filter
  const fetchComplements = useCallback((params: Record<string, unknown>) => {
    const fetchParams = effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params;
    return complementsApi.getComplements(fetchParams);
  }, [effectiveCompanyId]);

  // Use the entity list hook for data management
  const {
    filteredData: complements,
    loading,
    search,
    setSearch,
    refresh,
    paginationProps,
  } = useEntityList<Complement>({
    fetchFn: fetchComplements,
    searchFields: ['code', 'description'],
  });

  // Refetch when effectiveCompanyId changes
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const handleEdit = (complement: Complement) => {
    setSelectedComplement(complement);
    setShowEditModal(true);
  };

  const handleDelete = (complementId: string) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('complements.deleteConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(complementId);
          await complementsApi.deleteComplement(complementId);
          await refresh();
        } catch (error: any) {
          logger.error('Error deleting complement:', error);
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
    setSelectedComplement(null);
    refresh();
  };

  const columns = [
    {
      key: 'code',
      header: t('complements.columns.code'),
      render: (value: any, complement: Complement) => (
        <span className="text-sm font-medium text-secondary-900">
          {complement.code || 'N/A'}
        </span>
      ),
    },
    {
      key: 'description',
      header: t('complements.columns.description'),
      render: (value: any, complement: Complement) => (
        <span className="text-sm text-secondary-500">
          {complement.description || '-'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: t('complements.columns.created'),
      render: (value: any, complement: Complement) => (
        <span className="text-sm text-secondary-500">
          {complement.createdAt ? new Date(complement.createdAt).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('complements.columns.actions'),
      render: (value: any, complement: Complement) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(complement)}
            disabled={actionLoading === complement?.uuid || !complement}
            title={t('complements.editComplement')}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(complement?.uuid)}
            disabled={actionLoading === complement?.uuid || !complement}
            className="text-red-600 hover:text-red-700"
            title={t('complements.deleteComplement')}
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
            <h1 className="text-2xl font-bold text-secondary-900">{t('complements.title')}</h1>
            <p className="text-secondary-600">{t('complements.subtitle')}</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('complements.addComplement')}
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('complements.searchPlaceholder')}
              />
            </div>
          </div>
        </div>

        {/* Complements Table */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('complements.allComplements')} ({complements.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : complements.length === 0 ? (
              <div className="text-center py-12">
                <Layers className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('complements.empty.title')}</h3>
                <p className="mt-1 text-sm text-secondary-500">
                  {search ? t('complements.empty.description') : t('complements.empty.noData')}
                </p>
                {!search && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('complements.addComplement')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Table
                  columns={columns}
                  data={complements}
                  loading={loading}
                />
                <Pagination {...paginationProps} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateComplementModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditComplementModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedComplement(null);
        }}
        onSuccess={handleEditSuccess}
        complement={selectedComplement}
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

export default Complements;
