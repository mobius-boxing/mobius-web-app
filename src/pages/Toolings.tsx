import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Edit, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Tooling } from '../types';
import { toolingsApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { FilterBar, searchFilter } from '../components/ui/filters';
import { useEntityList } from '../hooks/useEntityList';
import { usePermissions } from '../hooks/usePermissions';
import ConfirmModal from '../components/ui/ConfirmModal';
import CreateToolingModal from '../components/modals/CreateToolingModal';
import EditToolingModal from '../components/modals/EditToolingModal';
import { logger } from '../utils/logger';
import { historyColumn } from '../components/audit/historyColumn';

const Toolings: React.FC = () => {
  const { t } = useTranslation();
  const { has } = usePermissions();
  const canEdit = has('tooling.edit');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTooling, setSelectedTooling] = useState<Tooling | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { effectiveCompanyId } = useEffectiveCompany();

  const fetchToolings = useCallback((params: Record<string, unknown>) => {
    const fetchParams = effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params;
    return toolingsApi.getToolings(fetchParams);
  }, [effectiveCompanyId]);

  const {
    filteredData: toolings,
    loading,
    search,
    filterBarProps,
    refresh,
    paginationProps,
  } = useEntityList<Tooling>({
    fetchFn: fetchToolings,
    searchFields: ['name', 'description'],
    filterDefs: [searchFilter(t('toolings.searchPlaceholder'))],
  });

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const handleEdit = (tooling: Tooling) => {
    setSelectedTooling(tooling);
    setShowEditModal(true);
  };

  const handleDeleteClick = (tooling: Tooling) => {
    setSelectedTooling(tooling);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTooling?.uuid) return;

    try {
      setActionLoading(true);
      await toolingsApi.deleteTooling(selectedTooling.uuid);
      setShowDeleteModal(false);
      setSelectedTooling(null);
      await refresh();
    } catch (error) {
      logger.error('Error deleting tooling:', error);
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
    setSelectedTooling(null);
    refresh();
  };

  const columns = [
    {
      key: 'name',
      header: t('toolings.columns.name'),
      hideable: false,
      card: 'title' as const,
      render: (value: any, tooling: Tooling) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <Wrench className="h-5 w-5 text-primary-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="font-medium text-secondary-900">{tooling.name || 'Unknown'}</div>
            {tooling.description && (
              <div className="text-sm text-secondary-500 truncate max-w-xs">{tooling.description}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'toolingType',
      header: t('toolings.columns.toolingType'),
      render: (value: any, tooling: Tooling) => (
        <span className="text-sm text-secondary-900">
          {tooling?.toolingType?.name || '-'}
        </span>
      ),
    },
    {
      key: 'manufacturer',
      header: t('toolings.columns.manufacturer'),
      render: (value: any, tooling: Tooling) => (
        <span className="text-sm text-secondary-900">
          {tooling?.manufacturer?.name || '-'}
        </span>
      ),
    },
    {
      key: 'supplier',
      header: t('toolings.columns.supplier'),
      render: (value: any, tooling: Tooling) => (
        <span className="text-sm text-secondary-900">
          {tooling?.supplier?.code || '-'}
        </span>
      ),
    },
    {
      key: 'minimumStock',
      header: t('toolings.columns.minimumStock'),
      render: (value: any, tooling: Tooling) => (
        <span className="text-sm text-secondary-900">
          {tooling?.minimumStock ?? 0}
        </span>
      ),
    },
    historyColumn('toolings', t),
    {
      key: 'actions',
      header: t('toolings.columns.actions'),
      pinned: true,
      card: 'actions' as const,
      render: (value: any, tooling: Tooling) => (
        <div className="flex items-center space-x-2">
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(tooling)}
              disabled={!tooling}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteClick(tooling)}
              disabled={!tooling}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="gd-page-title">{t('toolings.title')}</h1>
            <p className="text-secondary-600">{t('toolings.subtitle')}</p>
          </div>
          {canEdit && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('toolings.addTooling')}
            </Button>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-full sm:flex-1 sm:max-w-md">
              <FilterBar {...filterBarProps} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('toolings.allToolings')} ({toolings.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : toolings.length === 0 ? (
              <div className="text-center py-12">
                <Wrench className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('toolings.empty.title')}</h3>
                <p className="gd-page-sub">
                  {search ? t('toolings.empty.description') : t('toolings.empty.noData')}
                </p>
                {!search && canEdit && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('toolings.addTooling')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Table
                  columns={columns}
                  data={toolings}
                  loading={loading}
                  listId="toolings"
                />
                <Pagination {...paginationProps} />
              </>
            )}
          </div>
        </div>
      </div>

      <CreateToolingModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditToolingModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTooling(null);
        }}
        onSuccess={handleEditSuccess}
        tooling={selectedTooling}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedTooling(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={t('common.confirm')}
        message={t('toolings.deleteConfirm')}
        confirmText={t('common.delete')}
        loading={actionLoading}
        variant="danger"
      />
    </Layout>
  );
};

export default Toolings;
