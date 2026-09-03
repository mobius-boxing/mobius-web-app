import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Edit, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ColorType } from '../types';
import { colorTypesApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { SearchInput } from '../components/ui/SearchInput';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import CreateColorTypeModal from '../components/modals/CreateColorTypeModal';
import EditColorTypeModal from '../components/modals/EditColorTypeModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { logger } from '../utils/logger';
import { historyColumn } from '../components/audit/historyColumn';

const ColorTypes: React.FC = () => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedColorType, setSelectedColorType] = useState<ColorType | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const confirmModal = useConfirmModal();

  const fetchColorTypes = useCallback((params: Record<string, unknown>) => {
    const fetchParams = effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params;
    return colorTypesApi.getColorTypes(fetchParams);
  }, [effectiveCompanyId]);

  const {
    filteredData: colorTypes,
    loading,
    search,
    setSearch,
    refresh,
    paginationProps,
  } = useEntityList<ColorType>({
    fetchFn: fetchColorTypes,
    searchFields: ['name', 'description'],
  });

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const handleEdit = (colorType: ColorType) => {
    setSelectedColorType(colorType);
    setShowEditModal(true);
  };

  const handleDelete = (colorTypeId: string) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('colorTypes.deleteConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(colorTypeId);
          await colorTypesApi.deleteColorType(colorTypeId);
          await refresh();
        } catch (error: any) {
          logger.error('Error deleting color type:', error);
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
    setSelectedColorType(null);
    refresh();
  };

  const columns = [
    {
      key: 'name',
      header: t('colorTypes.columns.name'),
      render: (value: any, colorType: ColorType) => (
        <span className="text-sm font-medium text-secondary-900">
          {colorType.name || 'N/A'}
        </span>
      ),
    },
    {
      key: 'description',
      header: t('colorTypes.columns.description'),
      render: (value: any, colorType: ColorType) => (
        <span className="text-sm text-secondary-500">
          {colorType.description || '-'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: t('colorTypes.columns.created'),
      render: (value: any, colorType: ColorType) => (
        <span className="text-sm text-secondary-500">
          {colorType.createdAt ? new Date(colorType.createdAt).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    historyColumn('color_types', t),
    {
      key: 'actions',
      header: t('colorTypes.columns.actions'),
      render: (value: any, colorType: ColorType) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(colorType)}
            disabled={actionLoading === colorType?.uuid || !colorType}
            title={t('colorTypes.editColorType')}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(colorType?.uuid)}
            disabled={actionLoading === colorType?.uuid || !colorType}
            className="text-red-600 hover:text-red-700"
            title={t('colorTypes.deleteColorType')}
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
            <h1 className="gd-page-title">{t('colorTypes.title')}</h1>
            <p className="text-secondary-600">{t('colorTypes.subtitle')}</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('colorTypes.addColorType')}
          </Button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('colorTypes.searchPlaceholder')}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('colorTypes.allColorTypes')} ({colorTypes.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : colorTypes.length === 0 ? (
              <div className="text-center py-12">
                <Layers className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('colorTypes.empty.title')}</h3>
                <p className="gd-page-sub">
                  {search ? t('colorTypes.empty.description') : t('colorTypes.empty.noData')}
                </p>
                {!search && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('colorTypes.addColorType')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Table
                  columns={columns}
                  data={colorTypes}
                  loading={loading}
                />
                <Pagination {...paginationProps} />
              </>
            )}
          </div>
        </div>
      </div>

      <CreateColorTypeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditColorTypeModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedColorType(null);
        }}
        onSuccess={handleEditSuccess}
        colorType={selectedColorType}
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

export default ColorTypes;
