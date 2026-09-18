import React, { useState, useCallback, useEffect , useMemo } from 'react';
import { Plus, Trash2, Edit, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DeliveryZone } from '../types';
import { deliveryZonesApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { FilterBar, searchFilter } from '../components/ui/filters';
import { columnFilterDefs } from '../filters/columnFilters';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import { usePermissions } from '../hooks/usePermissions';
import CreateDeliveryZoneModal from '../components/modals/CreateDeliveryZoneModal';
import EditDeliveryZoneModal from '../components/modals/EditDeliveryZoneModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { logger } from '../utils/logger';
import { historyColumn } from '../components/audit/historyColumn';

const DeliveryZones: React.FC = () => {
  const { t } = useTranslation();
  const { has } = usePermissions();
  const canEdit = has('delivery-zones.edit');
  const { effectiveCompanyId } = useEffectiveCompany();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const confirmModal = useConfirmModal();

  const fetchZones = useCallback((params: Record<string, unknown>) => {
    const fetchParams = effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params;
    return deliveryZonesApi.getDeliveryZones(fetchParams);
  }, [effectiveCompanyId]);


  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const handleEdit = (zone: DeliveryZone) => {
    setSelectedZone(zone);
    setShowEditModal(true);
  };

  const handleDelete = (zoneUuid: string) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('deliveryZones.deleteConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(zoneUuid);
          await deliveryZonesApi.deleteDeliveryZone(zoneUuid);
          await refresh();
        } catch (error: any) {
          logger.error('Error deleting delivery zone:', error);
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const columns = [
    {
      key: 'code',
      header: t('deliveryZones.columns.code'),
      hideable: false,
      card: 'title' as const,
      render: (value: any, zone: DeliveryZone) => (
        <span className="text-sm font-medium text-secondary-900">{zone.code || 'N/A'}</span>
      ),
    },
    {
      key: 'description',
      header: t('deliveryZones.columns.description'),
      render: (value: any, zone: DeliveryZone) => (
        <span className="text-sm text-secondary-500">{zone.description || '-'}</span>
      ),
    },
    {
      key: 'createdAt',
      header: t('deliveryZones.columns.created'),
      render: (value: any, zone: DeliveryZone) => (
        <span className="text-sm text-secondary-500">
          {zone.createdAt ? new Date(zone.createdAt).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    historyColumn('delivery_zones', t),
    {
      key: 'actions',
      header: t('deliveryZones.columns.actions'),
      pinned: true,
      card: 'actions' as const,
      render: (value: any, zone: DeliveryZone) => (
        <div className="flex items-center space-x-2">
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(zone)}
              disabled={actionLoading === zone?.uuid || !zone}
              title={t('deliveryZones.editZone')}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(zone?.uuid)}
              disabled={actionLoading === zone?.uuid || !zone}
              className="text-red-600 hover:text-red-700"
              title={t('deliveryZones.deleteZone')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const filterDefs = useMemo(
    () => [
      searchFilter(t('deliveryZones.searchPlaceholder')),
      ...columnFilterDefs('delivery-zones', columns, t, { companyId: effectiveCompanyId }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, effectiveCompanyId]
  );

  const {
    filteredData: zones,
    loading,
    search,
    filterBarProps,
    refresh,
    paginationProps,
  } = useEntityList<DeliveryZone>({
    fetchFn: fetchZones,
    searchFields: ['code', 'description'],
    filterDefs,
  });


  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="gd-page-title">{t('deliveryZones.title')}</h1>
            <p className="text-secondary-600">{t('deliveryZones.subtitle')}</p>
          </div>
          {canEdit && (
            <Button onClick={() => setShowCreateModal(true)} className="inline-flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              {t('deliveryZones.addZone')}
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
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('deliveryZones.allZones')} ({zones.length})
              </h2>
            </div>

            {!loading && zones.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('deliveryZones.empty.title')}</h3>
                <p className="gd-page-sub">
                  {search ? t('deliveryZones.empty.description') : t('deliveryZones.empty.noData')}
                </p>
                {!search && canEdit && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('deliveryZones.addZone')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Table columns={columns} data={zones} loading={loading} listId="delivery-zones" />
                <Pagination {...paginationProps} />
              </>
            )}
          </div>
        </div>
      </div>

      <CreateDeliveryZoneModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          refresh();
        }}
      />

      <EditDeliveryZoneModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedZone(null);
        }}
        onSuccess={() => {
          setShowEditModal(false);
          setSelectedZone(null);
          refresh();
        }}
        deliveryZone={selectedZone}
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

export default DeliveryZones;
