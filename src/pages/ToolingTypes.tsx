import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Edit, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ToolingType } from '../types';
import { toolingTypesApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { FilterBar, searchFilter } from '../components/ui/filters';
import { useEntityList } from '../hooks/useEntityList';
import { usePermissions } from '../hooks/usePermissions';
import ConfirmModal from '../components/ui/ConfirmModal';
import CreateToolingTypeModal from '../components/modals/CreateToolingTypeModal';
import EditToolingTypeModal from '../components/modals/EditToolingTypeModal';
import { logger } from '../utils/logger';
import { historyColumn } from '../components/audit/historyColumn';

const ToolingTypes: React.FC = () => {
  const { t } = useTranslation();
  const { has } = usePermissions();
  const canEdit = has('tooling-types.edit');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedToolingType, setSelectedToolingType] = useState<ToolingType | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { effectiveCompanyId } = useEffectiveCompany();

  const fetchToolingTypes = useCallback((params: Record<string, unknown>) => {
    const fetchParams = effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params;
    return toolingTypesApi.getToolingTypes(fetchParams);
  }, [effectiveCompanyId]);

  const {
    filteredData: toolingTypes,
    loading,
    search,
    filterBarProps,
    refresh,
    paginationProps,
  } = useEntityList<ToolingType>({
    fetchFn: fetchToolingTypes,
    searchFields: ['code', 'name', 'description'],
    filterDefs: [searchFilter(t('toolingTypes.searchPlaceholder'))],
  });

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const handleEdit = (toolingType: ToolingType) => {
    setSelectedToolingType(toolingType);
    setShowEditModal(true);
  };

  const handleDeleteClick = (toolingType: ToolingType) => {
    setSelectedToolingType(toolingType);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedToolingType?.uuid) return;

    try {
      setActionLoading(true);
      await toolingTypesApi.deleteToolingType(selectedToolingType.uuid);
      setShowDeleteModal(false);
      setSelectedToolingType(null);
      await refresh();
    } catch (error) {
      logger.error('Error deleting tooling type:', error);
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
    setSelectedToolingType(null);
    refresh();
  };

  const columns = [
    {
      key: 'code',
      header: t('toolingTypes.columns.code'),
      hideable: false,
      card: 'title' as const,
      render: (value: any, toolingType: ToolingType) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <Wrench className="h-5 w-5 text-primary-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="font-medium text-secondary-900">{toolingType.code || 'Unknown Code'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'name',
      header: t('toolingTypes.columns.name'),
      render: (value: any, toolingType: ToolingType) => (
        <span className="text-sm text-secondary-900">
          {toolingType?.name || '-'}
        </span>
      ),
    },
    {
      key: 'description',
      header: t('toolingTypes.columns.description'),
      render: (value: any, toolingType: ToolingType) => (
        <span className="text-sm text-secondary-900">
          {toolingType?.description || '-'}
        </span>
      ),
    },
    {
      key: 'automaticConsumption',
      header: t('toolingTypes.columns.automaticConsumption'),
      render: (value: any, toolingType: ToolingType) => (
        <span className={`gd-badge ${
          toolingType?.automaticConsumption
            ? 'gd-badge-positive'
            : 'gd-badge-neutral'
        }`}>
          {toolingType?.automaticConsumption ? t('common.yes') : t('common.no')}
        </span>
      ),
    },
    historyColumn('tooling_types', t),
    {
      key: 'actions',
      header: t('toolingTypes.columns.actions'),
      pinned: true,
      card: 'actions' as const,
      render: (value: any, toolingType: ToolingType) => (
        <div className="flex items-center space-x-2">
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(toolingType)}
              disabled={!toolingType}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteClick(toolingType)}
              disabled={!toolingType}
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
            <h1 className="gd-page-title">{t('toolingTypes.title')}</h1>
            <p className="text-secondary-600">{t('toolingTypes.subtitle')}</p>
          </div>
          {canEdit && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('toolingTypes.addType')}
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
                {t('toolingTypes.allTypes')} ({toolingTypes.length})
              </h2>
            </div>

            {!loading && toolingTypes.length === 0 ? (
              <div className="text-center py-12">
                <Wrench className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('toolingTypes.empty.title')}</h3>
                <p className="gd-page-sub">
                  {search ? t('toolingTypes.empty.description') : t('toolingTypes.empty.noData')}
                </p>
                {!search && canEdit && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('toolingTypes.addType')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Table
                  columns={columns}
                  data={toolingTypes}
                  loading={loading}
                  listId="tooling-types"
                />
                <Pagination {...paginationProps} />
              </>
            )}
          </div>
        </div>
      </div>

      <CreateToolingTypeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditToolingTypeModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedToolingType(null);
        }}
        onSuccess={handleEditSuccess}
        toolingType={selectedToolingType}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedToolingType(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={t('common.confirm')}
        message={t('toolingTypes.deleteConfirm')}
        confirmText={t('common.delete')}
        loading={actionLoading}
        variant="danger"
      />
    </Layout>
  );
};

export default ToolingTypes;
