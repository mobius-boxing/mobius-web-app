import React, { useState, useCallback, useEffect , useMemo } from 'react';
import { Plus, Trash2, Edit, Factory } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Machine } from '../types';
import { machinesApi } from '../services/api';
import { useEffectiveCompany } from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import ActionButton from '../components/ui/ActionButton';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { FilterBar, searchFilter } from '../components/ui/filters';
import { columnFilterDefs } from '../filters/columnFilters';
import { useEntityList } from '../hooks/useEntityList';
import { usePermissions } from '../hooks/usePermissions';
import { useConfirmModal } from '../hooks/useConfirmModal';
import { CreateMachineModal, EditMachineModal } from '../components/modals/MachineModals';
import ConfirmModal from '../components/ui/ConfirmModal';
import { logger } from '../utils/logger';
import { historyColumn } from '../components/audit/historyColumn';

const Machines: React.FC = () => {
  const { t } = useTranslation();
  const { has } = usePermissions();
  const canEdit = has('machines.edit');
  const { effectiveCompanyId } = useEffectiveCompany();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selected, setSelected] = useState<Machine | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const confirmModal = useConfirmModal();

  const fetchMachines = useCallback(
    (params: Record<string, unknown>) =>
      machinesApi.getMachines(
        effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params,
      ),
    [effectiveCompanyId],
  );


  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const handleDelete = (uuid: string) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('machines.deleteConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(uuid);
          await machinesApi.deleteMachine(uuid);
          await refresh();
        } catch (error: any) {
          logger.error('Error deleting machine:', error);
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const columns = [
    {
      key: 'code',
      header: t('machines.columns.code'),
      hideable: false,
      card: 'title' as const,
      render: (_: any, m: Machine) => (
        <span className="text-sm font-medium text-secondary-900">{m.code || '-'}</span>
      ),
    },
    {
      key: 'description',
      header: t('machines.columns.description'),
      render: (_: any, m: Machine) => (
        <span className="text-sm text-secondary-500">{m.description || '-'}</span>
      ),
    },
    {
      key: 'machineType',
      header: t('machines.columns.machineType'),
      render: (_: any, m: Machine) => (
        <span className="text-sm text-secondary-500">
          {m.machineType?.name || '-'}
          {m.machineType?.corrugated ? ` · ${t('machineTypes.corrugated')}` : ''}
        </span>
      ),
    },
    {
      key: 'setupTime',
      header: t('machines.columns.setupTime'),
      render: (_: any, m: Machine) => (
        <span className="text-sm text-secondary-500">{m.setupTime ?? 0}</span>
      ),
    },
    historyColumn('machines', t),
    {
      key: 'actions',
      header: t('machines.columns.actions'),
      pinned: true,
      card: 'actions' as const,
      render: (_: any, m: Machine) => (
        <div className="flex items-center space-x-2">
          {canEdit && (
            <ActionButton
              label={t('machines.editTitle')}
              onClick={() => {
                setSelected(m);
                setShowEditModal(true);
              }}
              disabled={actionLoading === m.uuid}
            >
              <Edit className="h-4 w-4" />
            </ActionButton>
          )}
          {canEdit && (
            <ActionButton
              label={t('machines.deleteTitle')}
              tone="danger"
              onClick={() => handleDelete(m.uuid)}
              disabled={actionLoading === m.uuid}
            >
              <Trash2 className="h-4 w-4" />
            </ActionButton>
          )}
        </div>
      ),
    },
  ];

  const filterDefs = useMemo(
    () => [
      searchFilter(t('machines.searchPlaceholder')),
      ...columnFilterDefs('machines', columns, t, { companyId: effectiveCompanyId }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, effectiveCompanyId]
  );

  const { filteredData: machines, loading,
    filterBarProps, refresh, paginationProps } =
    useEntityList<Machine>({ fetchFn: fetchMachines, searchFields: ['code', 'description'],
    filterDefs, });


  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="gd-page-title">{t('machines.title')}</h1>
            <p className="text-secondary-600">{t('machines.subtitle')}</p>
          </div>
          {canEdit && (
            <Button onClick={() => setShowCreateModal(true)} className="inline-flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              {t('machines.add')}
            </Button>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <FilterBar {...filterBarProps} />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            {!loading && machines.length === 0 ? (
              <div className="text-center py-12">
                <Factory className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('machines.empty.title')}</h3>
                <p className="gd-page-sub">{t('machines.empty.description')}</p>
              </div>
            ) : (
              <>
                <Table columns={columns} data={machines} loading={loading} listId="machines" />
                <Pagination {...paginationProps} />
              </>
            )}
          </div>
        </div>
      </div>

      <CreateMachineModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          refresh();
        }}
      />
      <EditMachineModal
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
        machine={selected}
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

export default Machines;
