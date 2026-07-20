import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Edit, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FinishedGood } from '../types';
import { finishedGoodsApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { SearchInput } from '../components/ui/SearchInput';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import CreateFinishedGoodModal from '../components/modals/CreateFinishedGoodModal';
import EditFinishedGoodModal from '../components/modals/EditFinishedGoodModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { logger } from '../utils/logger';

const FinishedGoods: React.FC = () => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFinishedGood, setSelectedFinishedGood] = useState<FinishedGood | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const confirmModal = useConfirmModal();

  const fetchFinishedGoods = useCallback((params: Record<string, unknown>) => {
    const fetchParams = effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params;
    return finishedGoodsApi.getFinishedGoods(fetchParams);
  }, [effectiveCompanyId]);

  const {
    filteredData: finishedGoods,
    loading,
    search,
    setSearch,
    refresh,
    paginationProps,
  } = useEntityList<FinishedGood>({
    fetchFn: fetchFinishedGoods,
    searchFields: ['code', 'name', 'description'],
  });

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const handleEdit = (finishedGood: FinishedGood) => {
    setSelectedFinishedGood(finishedGood);
    setShowEditModal(true);
  };

  const handleDelete = (uuid: string) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('finishedGoods.deleteConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(uuid);
          await finishedGoodsApi.deleteFinishedGood(uuid);
          await refresh();
        } catch (error: any) {
          logger.error('Error deleting finished good:', error);
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const columns = [
    {
      key: 'code',
      header: t('finishedGoods.columns.code'),
      render: (value: any, item: FinishedGood) => (
        <span className="text-sm font-medium text-secondary-900">{item.code || '-'}</span>
      ),
    },
    {
      key: 'name',
      header: t('finishedGoods.columns.name'),
      render: (value: any, item: FinishedGood) => (
        <span className="text-sm text-secondary-900">{item.name}</span>
      ),
    },
    {
      key: 'supplier',
      header: t('finishedGoods.columns.supplier'),
      render: (value: any, item: FinishedGood) => (
        <span className="text-sm text-secondary-500">{item.supplier?.name || item.supplier?.code || '-'}</span>
      ),
    },
    {
      key: 'minimumStock',
      header: t('finishedGoods.columns.minimumStock'),
      render: (value: any, item: FinishedGood) => (
        <span className="text-sm text-secondary-500">
          {item.minimumStock != null ? item.minimumStock : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('finishedGoods.columns.actions'),
      render: (value: any, item: FinishedGood) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(item)}
            disabled={actionLoading === item?.uuid || !item}
            title={t('finishedGoods.editFinishedGood')}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(item?.uuid)}
            disabled={actionLoading === item?.uuid || !item}
            className="text-red-600 hover:text-red-700"
            title={t('finishedGoods.deleteFinishedGood')}
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
            <h1 className="text-2xl font-bold text-secondary-900">{t('finishedGoods.title')}</h1>
            <p className="text-secondary-600">{t('finishedGoods.subtitle')}</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="inline-flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            {t('finishedGoods.addFinishedGood')}
          </Button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('finishedGoods.searchPlaceholder')}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('finishedGoods.allFinishedGoods')} ({finishedGoods.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : finishedGoods.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('finishedGoods.empty.title')}</h3>
                <p className="mt-1 text-sm text-secondary-500">
                  {search ? t('finishedGoods.empty.description') : t('finishedGoods.empty.noData')}
                </p>
                {!search && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('finishedGoods.addFinishedGood')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Table columns={columns} data={finishedGoods} loading={loading} />
                <Pagination {...paginationProps} />
              </>
            )}
          </div>
        </div>
      </div>

      <CreateFinishedGoodModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          refresh();
        }}
      />

      <EditFinishedGoodModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedFinishedGood(null);
        }}
        onSuccess={() => {
          setShowEditModal(false);
          setSelectedFinishedGood(null);
          refresh();
        }}
        finishedGood={selectedFinishedGood}
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

export default FinishedGoods;
