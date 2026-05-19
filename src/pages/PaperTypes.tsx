import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Edit, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PaperType } from '../types';
import { paperTypesApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { SearchInput } from '../components/ui/SearchInput';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import CreatePaperTypeModal from '../components/modals/CreatePaperTypeModal';
import EditPaperTypeModal from '../components/modals/EditPaperTypeModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { logger } from '../utils/logger';

const PaperTypes: React.FC = () => {
  const { t } = useTranslation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPaperType, setSelectedPaperType] = useState<PaperType | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { effectiveCompanyId } = useEffectiveCompany();
  const confirmModal = useConfirmModal();

  // Fetch function with company filter
  const fetchPaperTypes = useCallback((params: Record<string, unknown>) => {
    const fetchParams = effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params;
    return paperTypesApi.getPaperTypes(fetchParams);
  }, [effectiveCompanyId]);

  // Use the entity list hook for data management
  const {
    filteredData: paperTypes,
    loading,
    search,
    setSearch,
    refresh,
    paginationProps,
  } = useEntityList<PaperType>({
    fetchFn: fetchPaperTypes,
    searchFields: ['code', 'description'],
  });

  // Refresh when company changes
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const handleEdit = (paperType: PaperType) => {
    setSelectedPaperType(paperType);
    setShowEditModal(true);
  };

  const handleDelete = (paperTypeId: string) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('paperTypes.deleteConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(paperTypeId);
          await paperTypesApi.deletePaperType(paperTypeId);
          await refresh();
        } catch (error) {
          logger.error('Error deleting paper type:', error);
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
    setSelectedPaperType(null);
    refresh();
  };

  const columns = [
    {
      key: 'code',
      header: t('paperTypes.columns.code'),
      render: (value: any, paperType: PaperType) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="font-medium text-secondary-900">{paperType.code || 'Unknown Code'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: t('paperTypes.columns.description'),
      render: (value: any, paperType: PaperType) => (
        <span className="text-sm text-secondary-900">
          {paperType?.description || '-'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: t('paperTypes.columns.created'),
      render: (value: any, paperType: PaperType) => (
        <span className="text-sm text-secondary-900">
          {paperType?.createdAt ? new Date(paperType.createdAt).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('paperTypes.columns.actions'),
      render: (value: any, paperType: PaperType) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(paperType)}
            disabled={actionLoading === paperType?.uuid || !paperType}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(paperType?.uuid)}
            disabled={actionLoading === paperType?.uuid || !paperType}
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
            <h1 className="text-2xl font-bold text-secondary-900">{t('paperTypes.title')}</h1>
            <p className="text-secondary-600">{t('paperTypes.subtitle')}</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('paperTypes.addType')}
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('paperTypes.searchPlaceholder')}
              />
            </div>
          </div>
        </div>

        {/* Paper Types Table */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('paperTypes.allTypes')} ({paperTypes.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : paperTypes.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('paperTypes.empty.title')}</h3>
                <p className="mt-1 text-sm text-secondary-500">
                  {search ? t('paperTypes.empty.description') : t('paperTypes.empty.noData')}
                </p>
                {!search && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('paperTypes.addType')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Table
                  columns={columns}
                  data={paperTypes}
                  loading={loading}
                />
                <Pagination {...paginationProps} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreatePaperTypeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditPaperTypeModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedPaperType(null);
        }}
        onSuccess={handleEditSuccess}
        paperType={selectedPaperType}
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

export default PaperTypes;
