import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Edit, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Color } from '../types';
import { colorsApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { SearchInput } from '../components/ui/SearchInput';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import CreateColorModal from '../components/modals/CreateColorModal';
import EditColorModal from '../components/modals/EditColorModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { logger } from '../utils/logger';

const Colors: React.FC = () => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState<Color | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const confirmModal = useConfirmModal();

  const fetchColors = useCallback((params: Record<string, unknown>) => {
    const fetchParams = effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params;
    return colorsApi.getColors(fetchParams);
  }, [effectiveCompanyId]);

  const {
    filteredData: colors,
    loading,
    search,
    setSearch,
    refresh,
    paginationProps,
  } = useEntityList<Color>({
    fetchFn: fetchColors,
    searchFields: ['code', 'name', 'description'],
  });

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const handleEdit = (color: Color) => {
    setSelectedColor(color);
    setShowEditModal(true);
  };

  const handleDelete = (colorId: string) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('colors.deleteConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(colorId);
          await colorsApi.deleteColor(colorId);
          await refresh();
        } catch (error: any) {
          logger.error('Error deleting color:', error);
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
    setSelectedColor(null);
    refresh();
  };

  const columns = [
    {
      key: 'code',
      header: t('colors.columns.code'),
      render: (value: any, color: Color) => (
        <span className="text-sm font-medium text-secondary-900">
          {color.code || 'N/A'}
        </span>
      ),
    },
    {
      key: 'name',
      header: t('colors.columns.name'),
      render: (value: any, color: Color) => (
        <span className="text-sm text-secondary-500">
          {color.name || '-'}
        </span>
      ),
    },
    {
      key: 'tonality',
      header: t('colors.columns.tonality'),
      render: (value: any, color: Color) => (
        <span className="text-sm text-secondary-500">
          {color.tonality ?? '-'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: t('colors.columns.created'),
      render: (value: any, color: Color) => (
        <span className="text-sm text-secondary-500">
          {color.createdAt ? new Date(color.createdAt).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('colors.columns.actions'),
      render: (value: any, color: Color) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(color)}
            disabled={actionLoading === color?.uuid || !color}
            title={t('colors.editColor')}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(color?.uuid)}
            disabled={actionLoading === color?.uuid || !color}
            className="text-red-600 hover:text-red-700"
            title={t('colors.deleteColor')}
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
            <h1 className="text-2xl font-bold text-secondary-900">{t('colors.title')}</h1>
            <p className="text-secondary-600">{t('colors.subtitle')}</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('colors.addColor')}
          </Button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('colors.searchPlaceholder')}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('colors.allColors')} ({colors.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : colors.length === 0 ? (
              <div className="text-center py-12">
                <Layers className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('colors.empty.title')}</h3>
                <p className="mt-1 text-sm text-secondary-500">
                  {search ? t('colors.empty.description') : t('colors.empty.noData')}
                </p>
                {!search && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('colors.addColor')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Table
                  columns={columns}
                  data={colors}
                  loading={loading}
                />
                <Pagination {...paginationProps} />
              </>
            )}
          </div>
        </div>
      </div>

      <CreateColorModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditColorModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedColor(null);
        }}
        onSuccess={handleEditSuccess}
        color={selectedColor}
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

export default Colors;
