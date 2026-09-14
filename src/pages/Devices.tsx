import React, { useEffect, useState } from 'react';
import { Check, Ban } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ApiError, DeviceStatus, UserDevice } from '../types';
import { devicesApi } from '../services/api';
import { useEffectiveCompany } from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import ConfirmModal from '../components/ui/ConfirmModal';
import { SearchInput } from '../components/ui/SearchInput';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import { logger } from '../utils/logger';

const STATUS_BADGE: Record<DeviceStatus, string> = {
  pending: 'gd-badge-warning',
  approved: 'gd-badge-positive',
  revoked: 'gd-badge-negative',
};

const USER_AGENT_MAX = 60;

const truncate = (value: string, max: number): string =>
  value.length > max ? `${value.slice(0, max)}…` : value;

const readErrorCode = (error: unknown): string | undefined =>
  (error as { response?: { data?: ApiError } })?.response?.data?.code;

const Devices: React.FC = () => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [actionError, setActionError] = useState<string | null>(null);
  const confirmModal = useConfirmModal();

  const {
    data: devices,
    loading,
    search,
    setSearch,
    refresh,
    setFilters,
    setSort,
    sortBy,
    sortOrder,
    paginationProps,
  } = useEntityList<UserDevice>({
    fetchFn: devicesApi.getDevices,
  });

  // Both query params travel through `setFilters`, not the hook's `defaultFilters`
  // (which is merged AFTER the live filters on every fetch and would pin them to
  // their initial values for good). `companyId` is what the superAdmin's company
  // switcher selects; for everyone else it is undefined and the API reads the JWT.
  useEffect(() => {
    const status = statusFilter === 'all' ? {} : { status: statusFilter };
    setFilters(effectiveCompanyId ? { ...status, companyId: effectiveCompanyId } : status);
  }, [statusFilter, effectiveCompanyId, setFilters]);

  /**
   * The confirm modal closes itself whatever happens, so a failure has to land on
   * the page. A 409 means another admin's tab got there first: refetch either way,
   * so the row stops offering an action the API will keep refusing.
   */
  const runDeviceAction = (
    device: UserDevice,
    action: (uuid: string) => Promise<UserDevice>,
    conflictKey: string,
    errorKey: string,
  ) => async () => {
    setActionError(null);
    try {
      await action(device.uuid);
      await refresh();
    } catch (error) {
      logger.error('Device action failed:', error);
      setActionError(
        readErrorCode(error) === 'INVALID_DEVICE_TRANSITION' ? t(conflictKey) : t(errorKey)
      );
      await refresh();
    }
  };

  const confirmParams = (device: UserDevice) => ({
    email: device.user.email,
    device: truncate(device.userAgent || t('devices.unknownUserAgent'), USER_AGENT_MAX),
    requestedAt: new Date(device.requestedAt).toLocaleString(),
  });

  const handleApprove = (device: UserDevice) => {
    confirmModal.showConfirm({
      title: t('devices.approve.confirmTitle'),
      message: t('devices.approve.confirmMessage', confirmParams(device)),
      variant: 'info',
      confirmText: t('devices.approve.submit'),
      onConfirm: runDeviceAction(
        device,
        devicesApi.approve,
        'devices.approve.alreadyApproved',
        'devices.approve.error'
      ),
    });
  };

  const handleRevoke = (device: UserDevice) => {
    confirmModal.showConfirm({
      title: t('devices.revoke.confirmTitle'),
      message: t('devices.revoke.confirmMessage', confirmParams(device)),
      variant: 'danger',
      confirmText: t('devices.revoke.submit'),
      onConfirm: runDeviceAction(
        device,
        devicesApi.revoke,
        'devices.revoke.alreadyRevoked',
        'devices.revoke.error'
      ),
    });
  };

  const columns = [
    {
      key: 'user',
      header: t('devices.columns.user'),
      hideable: false,
      card: 'title' as const,
      render: (_: unknown, device: UserDevice) => (
        <div>
          <div className="font-medium text-secondary-900">
            {device.user.firstName} {device.user.lastName}
          </div>
          <div className="text-sm text-secondary-500">{device.user.email}</div>
        </div>
      ),
    },
    {
      key: 'userAgent',
      header: t('devices.columns.device'),
      render: (_: unknown, device: UserDevice) => (
        <div className="max-w-xs">
          <div className="truncate text-sm text-secondary-900" title={device.userAgent ?? ''}>
            {device.userAgent || t('devices.unknownUserAgent')}
          </div>
          <div className="text-sm text-secondary-500">{device.requestIp || '—'}</div>
        </div>
      ),
    },
    {
      key: 'requestedAt',
      header: t('devices.columns.requestedAt'),
      sortable: true,
      render: (_: unknown, device: UserDevice) => (
        <span className="text-sm text-secondary-900">
          {new Date(device.requestedAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('devices.columns.status'),
      sortable: true,
      render: (_: unknown, device: UserDevice) => (
        <span className={`gd-badge ${STATUS_BADGE[device.status]}`}>
          {t(`devices.status.${device.status}`)}
        </span>
      ),
    },
    {
      key: 'approvedBy',
      header: t('devices.columns.approvedBy'),
      render: (_: unknown, device: UserDevice) => (
        <span className="text-sm text-secondary-500">
          {device.approvedBy?.email || '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('devices.columns.actions'),
      pinned: true,
      card: 'actions' as const,
      render: (_: unknown, device: UserDevice) => (
        <div className="flex items-center space-x-2">
          {/* Approve from pending or revoked (D-149: an admin who revoked the wrong
              device re-approves it without making the employee log in again);
              approve→approve and revoke→revoke are the only 409s left. */}
          {device.status !== 'approved' && (
            <button
              onClick={() => handleApprove(device)}
              className="text-green-600 hover:text-green-800"
              title={t('devices.approve.action')}
              data-testid={`device-approve-${device.uuid}`}
            >
              <Check className="h-4 w-4" />
            </button>
          )}
          {device.status !== 'revoked' && (
            <button
              onClick={() => handleRevoke(device)}
              className="text-red-400 hover:text-red-600"
              title={t('devices.revoke.action')}
              data-testid={`device-revoke-${device.uuid}`}
            >
              <Ban className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="gd-page-title">{t('devices.title')}</h1>
          <p className="mt-1 text-secondary-600">{t('devices.subtitle')}</p>
        </div>

        <div className="flex flex-col gap-4 rounded-lg border border-secondary-200 bg-white p-4 sm:flex-row">
          <div className="w-full sm:flex-1 sm:max-w-md">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('devices.searchPlaceholder')}
            />
          </div>

          <div className="w-full sm:w-48">
            <select
              name="status"
              data-testid="devices-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">{t('devices.filters.statusAll')}</option>
              <option value="pending">{t('devices.status.pending')}</option>
              <option value="approved">{t('devices.status.approved')}</option>
              <option value="revoked">{t('devices.status.revoked')}</option>
            </select>
          </div>
        </div>

        <ErrorMessage message={actionError} />

        <div className="rounded-lg border border-secondary-200 bg-white">
          {loading ? (
            <div className="p-8 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
              <p className="mt-4 text-secondary-600">{t('devices.loading')}</p>
            </div>
          ) : (
            <>
              <Table
                data={devices}
                columns={columns}
                emptyMessage={t('devices.empty')}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={setSort}
                listId="devices"
              />
              <Pagination {...paginationProps} />
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={confirmModal.handleClose}
        onConfirm={confirmModal.handleConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        variant={confirmModal.variant}
        loading={confirmModal.loading}
      />
    </Layout>
  );
};

export default Devices;
