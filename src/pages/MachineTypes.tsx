import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Edit, Cog } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MachineType } from '../types';
import { machineTypesApi } from '../services/api';
import { useEffectiveCompany } from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { SearchInput } from '../components/ui/SearchInput';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import CreateMachineTypeModal from '../components/modals/CreateMachineTypeModal';
import EditMachineTypeModal from '../components/modals/EditMachineTypeModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { logger } from '../utils/logger';

const MachineTypes: React.FC = () => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selected, setSelected] = useState<MachineType | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const confirmModal = useConfirmModal();

  const fetchMachineTypes = useCallback(
    (params: Record<string, unknown>) =>
      machineTypesApi.getMachineTypes(
        effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params,
      ),
    [effectiveCompanyId],
  );

  const { filteredData: machineTypes, loading, search, setSearch, refresh, paginationProps } =
    useEntityList<MachineType>({ fetchFn: fetchMachineTypes, searchFields: ['name', 'attribute'] });

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const handleDelete = (uuid: string) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('machineTypes.deleteConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(uuid);
          await machineTypesApi.deleteMachineType(uuid);
          await refresh();
        } catch (error: any) {
          logger.error('Error deleting machine type:', error);
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const columns = [
    {
      key: 'name',
      header: t('machineTypes.columns.name'),
      render: (_: any, mt: MachineType) => (
        <span className="text-sm font-medium text-secondary-900">{mt.name}</span>
      ),
    },
    {
      key: 'flags',
      header: t('machineTypes.columns.flags'),
      render: (_: any, mt: MachineType) => (
        <span className="text-sm text-secondary-500">
          {[
            mt.corrugated ? t('machineTypes.corrugated') : null,
            mt.requiresDie ? t('machineTypes.requiresDie') : null,
            mt.requiresPlate ? t('machineTypes.requiresPlate') : null,
            mt.generatesSheets ? t('machineTypes.generatesSheets') : null,
          ]
            .filter(Boolean)
            .join(' · ') || '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('machineTypes.columns.actions'),
      render: (_: any, mt: MachineType) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelected(mt);
              setShowEditModal(true);
            }}
            disabled={actionLoading === mt.uuid}
            title={t('machineTypes.editTitle')}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(mt.uuid)}
            disabled={actionLoading === mt.uuid}
            className="text-red-600 hover:text-red-700"
            title={t('machineTypes.deleteTitle')}
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
            <h1 className="text-2xl font-bold text-secondary-900">{t('machineTypes.title')}</h1>
            <p className="text-secondary-600">{t('machineTypes.subtitle')}</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="inline-flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            {t('machineTypes.add')}
          </Button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex-1 max-w-md">
            <SearchInput value={search} onChange={setSearch} placeholder={t('machineTypes.searchPlaceholder')} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : machineTypes.length === 0 ? (
              <div className="text-center py-12">
                <Cog className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('machineTypes.empty.title')}</h3>
                <p className="mt-1 text-sm text-secondary-500">{t('machineTypes.empty.description')}</p>
              </div>
            ) : (
              <>
                <Table columns={columns} data={machineTypes} loading={loading} />
                <Pagination {...paginationProps} />
              </>
            )}
          </div>
        </div>
      </div>

      <CreateMachineTypeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          refresh();
        }}
      />
      <EditMachineTypeModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelected(null);
        }}
        onSuccess={() => {
          setShowEditModal(false);
          setSelected(null);
          refresh();
        }}
        machineType={selected}
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

export default MachineTypes;
