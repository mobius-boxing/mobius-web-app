import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Edit, Boxes } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Palletization } from '../types';
import { palletizationsApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { SearchInput } from '../components/ui/SearchInput';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import CreatePalletizationModal from '../components/modals/CreatePalletizationModal';
import EditPalletizationModal from '../components/modals/EditPalletizationModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { logger } from '../utils/logger';
import { historyColumn } from '../components/audit/historyColumn';

const Palletizations: React.FC = () => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selected, setSelected] = useState<Palletization | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const confirmModal = useConfirmModal();

  const fetchPalletizations = useCallback((params: Record<string, unknown>) => {
    const fetchParams = effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params;
    return palletizationsApi.getPalletizations(fetchParams);
  }, [effectiveCompanyId]);

  const { filteredData: palletizations, loading, search, setSearch, refresh, paginationProps } =
    useEntityList<Palletization>({ fetchFn: fetchPalletizations, searchFields: ['code', 'name', 'description'] });

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const handleDelete = (uuid: string) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('palletizations.deleteConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(uuid);
          await palletizationsApi.deletePalletization(uuid);
          await refresh();
        } catch (error: any) {
          logger.error('Error deleting palletization:', error);
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const columns = [
    {
      key: 'code',
      header: t('palletizations.columns.code'),
      render: (_: any, p: Palletization) => (
        <span className="text-sm font-medium text-secondary-900">{p.code || 'N/A'}</span>
      ),
    },
    {
      key: 'name',
      header: t('palletizations.columns.name'),
      render: (_: any, p: Palletization) => (
        <span className="text-sm text-secondary-900">{p.name}</span>
      ),
    },
    {
      key: 'boxesPerPallet',
      header: t('palletizations.columns.boxesPerPallet'),
      render: (_: any, p: Palletization) => (
        <span className="text-sm text-secondary-500">{p.boxesPerPallet ?? 0}</span>
      ),
    },
    {
      key: 'stackingType',
      header: t('palletizations.columns.stackingType'),
      render: (_: any, p: Palletization) => (
        <span className="text-sm text-secondary-500">{p.stackingType || '-'}</span>
      ),
    },
    {
      key: 'palletType',
      header: t('palletizations.columns.palletType'),
      render: (_: any, p: Palletization) => (
        <span className="text-sm text-secondary-500">{p.palletType?.code || '-'}</span>
      ),
    },
    historyColumn('palletizations', t),
    {
      key: 'actions',
      header: t('palletizations.columns.actions'),
      render: (_: any, p: Palletization) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSelected(p); setShowEditModal(true); }}
            disabled={actionLoading === p?.uuid || !p}
            title={t('palletizations.editPalletization')}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(p?.uuid)}
            disabled={actionLoading === p?.uuid || !p}
            className="text-red-600 hover:text-red-700"
            title={t('palletizations.deletePalletization')}
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
            <h1 className="gd-page-title">{t('palletizations.title')}</h1>
            <p className="text-secondary-600">{t('palletizations.subtitle')}</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="inline-flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            {t('palletizations.addPalletization')}
          </Button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex-1 max-w-md">
            <SearchInput value={search} onChange={setSearch} placeholder={t('palletizations.searchPlaceholder')} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : palletizations.length === 0 ? (
              <div className="text-center py-12">
                <Boxes className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('palletizations.empty.title')}</h3>
                <p className="gd-page-sub">
                  {search ? t('palletizations.empty.description') : t('palletizations.empty.noData')}
                </p>
              </div>
            ) : (
              <>
                <Table columns={columns} data={palletizations} loading={loading} />
                <Pagination {...paginationProps} />
              </>
            )}
          </div>
        </div>
      </div>

      <CreatePalletizationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => { setShowCreateModal(false); refresh(); }}
      />
      <EditPalletizationModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelected(null); }}
        onSuccess={() => { setShowEditModal(false); setSelected(null); refresh(); }}
        palletization={selected}
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

export default Palletizations;
