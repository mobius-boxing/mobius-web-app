import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Edit, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PalletType } from '../types';
import { palletTypesApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { SearchInput } from '../components/ui/SearchInput';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import CreatePalletTypeModal from '../components/modals/CreatePalletTypeModal';
import EditPalletTypeModal from '../components/modals/EditPalletTypeModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { logger } from '../utils/logger';

const PalletTypes: React.FC = () => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selected, setSelected] = useState<PalletType | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const confirmModal = useConfirmModal();

  const fetchPalletTypes = useCallback((params: Record<string, unknown>) => {
    const fetchParams = effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params;
    return palletTypesApi.getPalletTypes(fetchParams);
  }, [effectiveCompanyId]);

  const { filteredData: palletTypes, loading, search, setSearch, refresh, paginationProps } =
    useEntityList<PalletType>({ fetchFn: fetchPalletTypes, searchFields: ['code', 'description'] });

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const handleDelete = (uuid: string) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('palletTypes.deleteConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(uuid);
          await palletTypesApi.deletePalletType(uuid);
          await refresh();
        } catch (error: any) {
          logger.error('Error deleting pallet type:', error);
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const dims = (pt: PalletType) =>
    [pt.length, pt.width, pt.height].every((v) => v == null)
      ? '-'
      : `${pt.length ?? '-'} × ${pt.width ?? '-'} × ${pt.height ?? '-'}`;

  const columns = [
    {
      key: 'code',
      header: t('palletTypes.columns.code'),
      render: (_: any, pt: PalletType) => (
        <span className="text-sm font-medium text-secondary-900">{pt.code || 'N/A'}</span>
      ),
    },
    {
      key: 'description',
      header: t('palletTypes.columns.description'),
      render: (_: any, pt: PalletType) => (
        <span className="text-sm text-secondary-500">{pt.description || '-'}</span>
      ),
    },
    {
      key: 'dimensions',
      header: t('palletTypes.columns.dimensions'),
      render: (_: any, pt: PalletType) => (
        <span className="text-sm text-secondary-500">{dims(pt)}</span>
      ),
    },
    {
      key: 'weight',
      header: t('palletTypes.columns.weight'),
      render: (_: any, pt: PalletType) => (
        <span className="text-sm text-secondary-500">{pt.weight != null ? `${pt.weight} kg` : '-'}</span>
      ),
    },
    {
      key: 'actions',
      header: t('palletTypes.columns.actions'),
      render: (_: any, pt: PalletType) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSelected(pt); setShowEditModal(true); }}
            disabled={actionLoading === pt?.uuid || !pt}
            title={t('palletTypes.editPalletType')}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(pt?.uuid)}
            disabled={actionLoading === pt?.uuid || !pt}
            className="text-red-600 hover:text-red-700"
            title={t('palletTypes.deletePalletType')}
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
            <h1 className="gd-page-title">{t('palletTypes.title')}</h1>
            <p className="text-secondary-600">{t('palletTypes.subtitle')}</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="inline-flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            {t('palletTypes.addPalletType')}
          </Button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex-1 max-w-md">
            <SearchInput value={search} onChange={setSearch} placeholder={t('palletTypes.searchPlaceholder')} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : palletTypes.length === 0 ? (
              <div className="text-center py-12">
                <Layers className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('palletTypes.empty.title')}</h3>
                <p className="gd-page-sub">
                  {search ? t('palletTypes.empty.description') : t('palletTypes.empty.noData')}
                </p>
              </div>
            ) : (
              <>
                <Table columns={columns} data={palletTypes} loading={loading} />
                <Pagination {...paginationProps} />
              </>
            )}
          </div>
        </div>
      </div>

      <CreatePalletTypeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => { setShowCreateModal(false); refresh(); }}
      />
      <EditPalletTypeModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelected(null); }}
        onSuccess={() => { setShowEditModal(false); setSelected(null); refresh(); }}
        palletType={selected}
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

export default PalletTypes;
