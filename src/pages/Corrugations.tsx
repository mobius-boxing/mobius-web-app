import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Edit, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Corrugation } from '../types';
import { corrugationsApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { SearchInput } from '../components/ui/SearchInput';
import { useEntityList } from '../hooks/useEntityList';
import ConfirmModal from '../components/ui/ConfirmModal';
import CreateCorrugationModal from '../components/modals/CreateCorrugationModal';
import EditCorrugationModal from '../components/modals/EditCorrugationModal';
import { logger } from '../utils/logger';
import { historyColumn } from '../components/audit/historyColumn';

const Corrugations: React.FC = () => {
  const { t } = useTranslation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCorrugation, setSelectedCorrugation] = useState<Corrugation | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { effectiveCompanyId } = useEffectiveCompany();

  const fetchCorrugations = useCallback((params: Record<string, unknown>) => {
    const fetchParams = effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params;
    return corrugationsApi.getCorrugations(fetchParams);
  }, [effectiveCompanyId]);

  const {
    filteredData: corrugations,
    loading,
    search,
    setSearch,
    refresh,
    paginationProps,
  } = useEntityList<Corrugation>({
    fetchFn: fetchCorrugations,
    searchFields: ['code', 'description'],
  });

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const handleEdit = (corrugation: Corrugation) => {
    setSelectedCorrugation(corrugation);
    setShowEditModal(true);
  };

  const handleDeleteClick = (corrugation: Corrugation) => {
    setSelectedCorrugation(corrugation);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCorrugation?.uuid) return;

    try {
      setActionLoading(true);
      await corrugationsApi.deleteCorrugation(selectedCorrugation.uuid);
      setShowDeleteModal(false);
      setSelectedCorrugation(null);
      await refresh();
    } catch (error) {
      logger.error('Error deleting corrugation:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    refresh();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedCorrugation(null);
    refresh();
  };

  const columns = [
    {
      key: 'code',
      header: t('corrugations.columns.code'),
      render: (value: any, corrugation: Corrugation) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <Layers className="h-5 w-5 text-primary-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="font-medium text-secondary-900">{corrugation.code || 'Unknown Code'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: t('corrugations.columns.description'),
      render: (value: any, corrugation: Corrugation) => (
        <span className="text-sm text-secondary-900">
          {corrugation?.description || '-'}
        </span>
      ),
    },
    {
      key: 'corrugationClass',
      header: t('corrugations.columns.corrugationClass'),
      render: (value: any, corrugation: Corrugation) => (
        <span className="text-sm text-secondary-900">
          {corrugation?.corrugationClass?.code || '-'}
        </span>
      ),
    },
    {
      key: 'theoreticalGrammage',
      header: t('corrugations.columns.theoreticalGrammage'),
      render: (value: any, corrugation: Corrugation) => (
        <span className="text-sm text-secondary-900">
          {corrugation?.theoreticalGrammage != null ? corrugation.theoreticalGrammage : '-'}
        </span>
      ),
    },
    {
      key: 'suggestedWidth',
      header: t('corrugations.columns.suggestedWidth'),
      render: (value: any, corrugation: Corrugation) => (
        <span className="text-sm text-secondary-900">
          {corrugation?.suggestedWidth != null ? corrugation.suggestedWidth : '-'}
        </span>
      ),
    },
    {
      key: 'caliper',
      header: t('corrugations.columns.caliper'),
      render: (value: any, corrugation: Corrugation) => (
        <span className="text-sm text-secondary-900">
          {corrugation?.caliper != null ? corrugation.caliper : '-'}
        </span>
      ),
    },
    historyColumn('corrugations', t),
    {
      key: 'actions',
      header: t('corrugations.columns.actions'),
      render: (value: any, corrugation: Corrugation) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(corrugation)}
            disabled={!corrugation}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteClick(corrugation)}
            disabled={!corrugation}
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
            <h1 className="gd-page-title">{t('corrugations.title')}</h1>
            <p className="text-secondary-600">{t('corrugations.subtitle')}</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('corrugations.addCorrugation')}
          </Button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('corrugations.searchPlaceholder')}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('corrugations.allCorrugations')} ({corrugations.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : corrugations.length === 0 ? (
              <div className="text-center py-12">
                <Layers className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('corrugations.empty.title')}</h3>
                <p className="gd-page-sub">
                  {search ? t('corrugations.empty.description') : t('corrugations.empty.noData')}
                </p>
                {!search && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('corrugations.addCorrugation')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Table
                  columns={columns}
                  data={corrugations}
                  loading={loading}
                />
                <Pagination {...paginationProps} />
              </>
            )}
          </div>
        </div>
      </div>

      <CreateCorrugationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditCorrugationModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCorrugation(null);
        }}
        onSuccess={handleEditSuccess}
        corrugation={selectedCorrugation}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedCorrugation(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={t('common.confirm')}
        message={t('corrugations.deleteConfirm')}
        confirmText={t('common.delete')}
        loading={actionLoading}
        variant="danger"
      />
    </Layout>
  );
};

export default Corrugations;
