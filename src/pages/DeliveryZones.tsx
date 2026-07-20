import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Edit, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DeliveryZone } from '../types';
import { deliveryZonesApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { SearchInput } from '../components/ui/SearchInput';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import CreateDeliveryZoneModal from '../components/modals/CreateDeliveryZoneModal';
import EditDeliveryZoneModal from '../components/modals/EditDeliveryZoneModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { logger } from '../utils/logger';

const DeliveryZones: React.FC = () => {
  const { t } = useTranslation();
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

  const {
    filteredData: zones,
    loading,
    search,
    setSearch,
    refresh,
    paginationProps,
  } = useEntityList<DeliveryZone>({
    fetchFn: fetchZones,
    searchFields: ['code', 'description'],
  });

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
    {
      key: 'actions',
      header: t('deliveryZones.columns.actions'),
      render: (value: any, zone: DeliveryZone) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(zone)}
            disabled={actionLoading === zone?.uuid || !zone}
            title={t('deliveryZones.editZone')}
          >
            <Edit className="h-4 w-4" />
          </Button>
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
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">{t('deliveryZones.title')}</h1>
            <p className="text-secondary-600">{t('deliveryZones.subtitle')}</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="inline-flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            {t('deliveryZones.addZone')}
          </Button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('deliveryZones.searchPlaceholder')}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('deliveryZones.allZones')} ({zones.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : zones.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('deliveryZones.empty.title')}</h3>
                <p className="mt-1 text-sm text-secondary-500">
                  {search ? t('deliveryZones.empty.description') : t('deliveryZones.empty.noData')}
                </p>
                {!search && (
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
                <Table columns={columns} data={zones} loading={loading} />
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
