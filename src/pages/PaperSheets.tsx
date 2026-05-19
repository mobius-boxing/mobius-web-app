import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Edit, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PaperSheet } from '../types';
import { paperSheetsApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { SearchInput } from '../components/ui/SearchInput';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import CreatePaperSheetModal from '../components/modals/CreatePaperSheetModal';
import EditPaperSheetModal from '../components/modals/EditPaperSheetModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { logger } from '../utils/logger';

const PaperSheets: React.FC = () => {
  const { t } = useTranslation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPaperSheet, setSelectedPaperSheet] = useState<PaperSheet | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { effectiveCompanyId } = useEffectiveCompany();
  const confirmModal = useConfirmModal();

  const fetchPaperSheets = useCallback((params: Record<string, unknown>) => {
    const fetchParams = effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params;
    return paperSheetsApi.getPaperSheets(fetchParams);
  }, [effectiveCompanyId]);

  const {
    filteredData: paperSheets,
    loading,
    search,
    setSearch,
    refresh,
    paginationProps,
  } = useEntityList<PaperSheet>({
    fetchFn: fetchPaperSheets,
    searchFields: ['code', 'name', 'description'],
  });

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const handleEdit = (paperSheet: PaperSheet) => {
    setSelectedPaperSheet(paperSheet);
    setShowEditModal(true);
  };

  const handleDelete = (paperSheetId: string) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('paperSheets.deleteConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(paperSheetId);
          await paperSheetsApi.deletePaperSheet(paperSheetId);
          await refresh();
        } catch (error: any) {
          logger.error('Error deleting paper sheet:', error);
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
    setSelectedPaperSheet(null);
    refresh();
  };

  const columns = [
    {
      key: 'code',
      header: t('paperSheets.columns.code'),
      render: (value: any, paperSheet: PaperSheet) => (
        <span className="text-sm font-medium text-secondary-900">
          {paperSheet.code || 'N/A'}
        </span>
      ),
    },
    {
      key: 'name',
      header: t('paperSheets.columns.name'),
      render: (value: any, paperSheet: PaperSheet) => (
        <span className="text-sm text-secondary-900">
          {paperSheet.name || 'N/A'}
        </span>
      ),
    },
    {
      key: 'supplier',
      header: t('paperSheets.columns.supplier'),
      render: (value: any, paperSheet: PaperSheet) => (
        <span className="text-sm text-secondary-900">
          {paperSheet.supplier?.code || 'N/A'}
        </span>
      ),
    },
    {
      key: 'manufacturer',
      header: t('paperSheets.columns.manufacturer'),
      render: (value: any, paperSheet: PaperSheet) => (
        <span className="text-sm text-secondary-900">
          {paperSheet.manufacturer?.name || 'N/A'}
        </span>
      ),
    },
    {
      key: 'corrugation',
      header: t('paperSheets.columns.corrugation'),
      render: (value: any, paperSheet: PaperSheet) => (
        <span className="text-sm text-secondary-900">
          {paperSheet.corrugation?.code || 'N/A'}
        </span>
      ),
    },
    {
      key: 'dimensions',
      header: t('paperSheets.columns.dimensions'),
      render: (value: any, paperSheet: PaperSheet) => (
        <span className="text-sm text-secondary-500">
          {paperSheet.length != null && paperSheet.width != null
            ? `${paperSheet.length} x ${paperSheet.width}`
            : 'N/A'}
        </span>
      ),
    },
    {
      key: 'minimumStock',
      header: t('paperSheets.columns.minimumStock'),
      render: (value: any, paperSheet: PaperSheet) => (
        <span className="text-sm text-secondary-500">
          {paperSheet.minimumStock != null ? paperSheet.minimumStock : 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('paperSheets.columns.actions'),
      render: (value: any, paperSheet: PaperSheet) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(paperSheet)}
            disabled={actionLoading === paperSheet?.uuid || !paperSheet}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(paperSheet?.uuid)}
            disabled={actionLoading === paperSheet?.uuid || !paperSheet}
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
            <h1 className="text-2xl font-bold text-secondary-900">{t('paperSheets.title')}</h1>
            <p className="text-secondary-600">{t('paperSheets.subtitle')}</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('paperSheets.addPaperSheet')}
          </Button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('paperSheets.searchPlaceholder')}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('paperSheets.allPaperSheets')} ({paperSheets.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : paperSheets.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('paperSheets.empty.title')}</h3>
                <p className="mt-1 text-sm text-secondary-500">
                  {search ? t('paperSheets.empty.description') : t('paperSheets.empty.noData')}
                </p>
                {!search && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('paperSheets.addPaperSheet')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Table
                  columns={columns}
                  data={paperSheets}
                  loading={loading}
                />
                <Pagination {...paginationProps} />
              </>
            )}
          </div>
        </div>
      </div>

      <CreatePaperSheetModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditPaperSheetModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedPaperSheet(null);
        }}
        onSuccess={handleEditSuccess}
        paperSheet={selectedPaperSheet}
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

export default PaperSheets;
