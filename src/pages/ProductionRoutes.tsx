import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Edit, Copy, Route as RouteIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ProductionRoute } from '../types';
import { productionRoutesApi } from '../services/api';
import { useEffectiveCompany } from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { SearchInput } from '../components/ui/SearchInput';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import RouteFormModal from '../components/modals/RouteFormModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { logger } from '../utils/logger';
import { historyColumn } from '../components/audit/historyColumn';

const ProductionRoutes: React.FC = () => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [showFormModal, setShowFormModal] = useState(false);
  const [selected, setSelected] = useState<ProductionRoute | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const confirmModal = useConfirmModal();

  const fetchRoutes = useCallback(
    (params: Record<string, unknown>) =>
      productionRoutesApi.getRoutes(
        effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params,
      ),
    [effectiveCompanyId],
  );

  const { filteredData: routes, loading, search, setSearch, refresh, paginationProps } =
    useEntityList<ProductionRoute>({ fetchFn: fetchRoutes, searchFields: ['name'] });

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const handleClone = async (route: ProductionRoute) => {
    try {
      setActionLoading(route.uuid);
      await productionRoutesApi.cloneRoute(route.uuid);
      await refresh();
    } catch (error: any) {
      logger.error('Error cloning route:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = (uuid: string) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('productionRoutes.deleteConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(uuid);
          await productionRoutesApi.deleteRoute(uuid);
          await refresh();
        } catch (error: any) {
          logger.error('Error deleting route:', error);
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const badge = (text: string, cls: string) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {text}
    </span>
  );

  const columns = [
    {
      key: 'name',
      header: t('productionRoutes.columns.name'),
      render: (_: any, r: ProductionRoute) => (
        <span className="text-sm font-medium text-secondary-900">{r.name}</span>
      ),
    },
    {
      key: 'badges',
      header: t('productionRoutes.columns.status'),
      render: (_: any, r: ProductionRoute) => (
        <div className="flex gap-1">
          {r.isGlobal && badge(t('productionRoutes.global'), 'gd-badge-info')}
          {r.active
            ? badge(t('productionRoutes.active'), 'gd-badge-positive')
            : badge(t('productionRoutes.inactive'), 'bg-secondary-100 text-secondary-600')}
          {r.isDefault && badge(t('productionRoutes.default'), 'gd-badge-warning')}
        </div>
      ),
    },
    {
      key: 'stageCount',
      header: t('productionRoutes.columns.stages'),
      render: (_: any, r: ProductionRoute) => (
        <span className="text-sm text-secondary-500">{r.stageCount ?? 0}</span>
      ),
    },
    historyColumn('production_routes', t),
    {
      key: 'actions',
      header: t('productionRoutes.columns.actions'),
      render: (_: any, r: ProductionRoute) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelected(r);
              setShowFormModal(true);
            }}
            disabled={actionLoading === r.uuid}
            title={t('productionRoutes.editTitle')}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleClone(r)}
            disabled={actionLoading === r.uuid}
            title={t('productionRoutes.cloneTitle')}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(r.uuid)}
            disabled={actionLoading === r.uuid}
            className="text-red-600 hover:text-red-700"
            title={t('productionRoutes.deleteTitle')}
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
            <h1 className="gd-page-title">{t('productionRoutes.title')}</h1>
            <p className="text-secondary-600">{t('productionRoutes.subtitle')}</p>
          </div>
          <Button
            onClick={() => {
              setSelected(null);
              setShowFormModal(true);
            }}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('productionRoutes.add')}
          </Button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex-1 max-w-md">
            <SearchInput value={search} onChange={setSearch} placeholder={t('productionRoutes.searchPlaceholder')} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : routes.length === 0 ? (
              <div className="text-center py-12">
                <RouteIcon className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('productionRoutes.empty.title')}</h3>
                <p className="gd-page-sub">{t('productionRoutes.empty.description')}</p>
              </div>
            ) : (
              <>
                <Table columns={columns} data={routes} loading={loading} />
                <Pagination {...paginationProps} />
              </>
            )}
          </div>
        </div>
      </div>

      <RouteFormModal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setSelected(null);
        }}
        onSuccess={() => {
          setShowFormModal(false);
          setSelected(null);
          refresh();
        }}
        route={selected}
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

export default ProductionRoutes;
