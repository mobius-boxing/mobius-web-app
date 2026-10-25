import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Ban, Smartphone } from 'lucide-react';
import { UserDevice } from '../types';
import { devicesApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import { useEntityList, FetchParams } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import Layout from '../components/layout/Layout';
import ActionButton from '../components/ui/ActionButton';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import ConfirmModal from '../components/ui/ConfirmModal';
import ErrorMessage from '../components/ui/ErrorMessage';
import { FilterBar, FilterPromptState, searchFilter } from '../components/ui/filters';

const USER_AGENT_MAX = 60;

const STATUS_BADGE: Record<UserDevice['status'], string> = {
  pending: 'gd-badge-warning',
  approved: 'gd-badge-positive',
  revoked: 'gd-badge-negative',
};

const readErrorCode = (error: unknown): string | undefined =>
  (error as { response?: { data?: { code?: string } } })?.response?.data?.code;

const Devices: React.FC = () => {
  const { t } = useTranslation();
  const { effectiveCompanyId, hasCompanySelected } = useEffectiveCompany();

  const [statusFilter, setStatusFilter] = useState('pending');
  const [actionError, setActionError] = useState<string | null>(null);
  const confirm = useConfirmModal();

  // The search box rides useEntityList's debounce; status lives here so the
  // first paint is one request already filtered to Pending.
  const fetchDevices = useCallback(
    (params: FetchParams) =>
      devicesApi.getDevices({
        page: params.page,
        limit: params.limit,
        search: params.search,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
        ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}),
      }),
    [statusFilter, effectiveCompanyId]
  );

  const {
    filteredData: devices,
    loading,
    error,
    refresh,
    filterBarProps,
    paginationProps,
  } = useEntityList<UserDevice>({
    fetchFn: fetchDevices,
    initialLimit: 100,
    enabled: hasCompanySelected,
  });

  // fetchFn is not an auto-fetch dependency, so a status or company change refetches here.
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    refreshRef.current();
  }, [statusFilter, effectiveCompanyId]);

  const truncatedUserAgent = (device: UserDevice): string => {
    const value = device.userAgent || t('deviceManagement.unknownUserAgent');
    return value.length > USER_AGENT_MAX ? `${value.slice(0, USER_AGENT_MAX)}…` : value;
  };

  const confirmParams = (device: UserDevice) => ({
    email: device.user.email,
    device: truncatedUserAgent(device),
    requestedAt: new Date(device.requestedAt).toLocaleString(),
  });

  const runDeviceAction = (
    device: UserDevice,
    action: (uuid: string) => Promise<UserDevice>,
    conflictKey: string,
    errorKey: string
  ) => async () => {
    setActionError(null);
    try {
      await action(device.uuid);
    } catch (err) {
      setActionError(
        readErrorCode(err) === 'INVALID_DEVICE_TRANSITION' ? t(conflictKey) : t(errorKey)
      );
    }
    await refresh();
  };

  const handleApprove = (device: UserDevice) => {
    confirm.showConfirm({
      title: t('deviceManagement.approve.confirmTitle'),
      message: t('deviceManagement.approve.confirmMessage', confirmParams(device)),
      variant: 'info',
      confirmText: t('deviceManagement.approve.submit'),
      onConfirm: runDeviceAction(
        device,
        devicesApi.approveDevice,
        'deviceManagement.approve.alreadyApproved',
        'deviceManagement.approve.error'
      ),
    });
  };

  const handleRevoke = (device: UserDevice) => {
    confirm.showConfirm({
      title: t('deviceManagement.revoke.confirmTitle'),
      message: t('deviceManagement.revoke.confirmMessage', confirmParams(device)),
      variant: 'danger',
      confirmText: t('deviceManagement.revoke.submit'),
      onConfirm: runDeviceAction(
        device,
        devicesApi.revokeDevice,
        'deviceManagement.revoke.alreadyRevoked',
        'deviceManagement.revoke.error'
      ),
    });
  };

  const columns = [
    {
      key: 'user',
      header: t('deviceManagement.columns.user'),
      hideable: false,
      card: 'title' as const,
      render: (_value: unknown, device: UserDevice) => (
        <div>
          <div className="text-sm font-medium text-secondary-900">
            {device.user.firstName} {device.user.lastName}
          </div>
          <div className="text-sm text-secondary-500">{device.user.email}</div>
        </div>
      ),
    },
    {
      key: 'userAgent',
      header: t('deviceManagement.columns.device'),
      render: (_value: unknown, device: UserDevice) => (
        <span className="text-sm text-secondary-900">{truncatedUserAgent(device)}</span>
      ),
    },
    {
      key: 'requestIp',
      header: t('deviceManagement.columns.ip'),
      render: (_value: unknown, device: UserDevice) => (
        <span className="text-sm text-secondary-500">{device.requestIp || '—'}</span>
      ),
    },
    {
      key: 'requestedAt',
      header: t('deviceManagement.columns.requestedAt'),
      render: (_value: unknown, device: UserDevice) => (
        <span className="text-sm text-secondary-900">{new Date(device.requestedAt).toLocaleString()}</span>
      ),
    },
    {
      key: 'status',
      header: t('deviceManagement.columns.status'),
      render: (_value: unknown, device: UserDevice) => (
        <span className={`gd-badge ${STATUS_BADGE[device.status]}`}>
          {t(`deviceManagement.status.${device.status}`)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('deviceManagement.columns.actions'),
      pinned: true,
      card: 'actions' as const,
      render: (_value: unknown, device: UserDevice) => (
        <div className="flex items-center space-x-2">
          {device.status !== 'approved' && (
            <ActionButton label={t('deviceManagement.approve.action')} onClick={() => handleApprove(device)}>
              <Check className="h-4 w-4" />
            </ActionButton>
          )}
          {device.status !== 'revoked' && (
            <ActionButton
              label={t('deviceManagement.revoke.action')}
              tone="danger"
              onClick={() => handleRevoke(device)}
            >
              <Ban className="h-4 w-4" />
            </ActionButton>
          )}
        </div>
      ),
    },
  ];

  const filterDefs = React.useMemo(
    () => [searchFilter(t('deviceManagement.searchPlaceholder'))],
    [t]
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="gd-page-title">{t('deviceManagement.title')}</h1>
          <p className="text-secondary-600">{t('deviceManagement.subtitle')}</p>
        </div>

        <ErrorMessage message={actionError} />
        {error && !loading && <ErrorMessage message={t('deviceManagement.loadError')} />}

        {!hasCompanySelected ? (
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
            <FilterPromptState
              icon={Smartphone}
              title={t('companySelector.noCompanySelected')}
              description={t('deviceManagement.selectCompanyPrompt')}
            />
          </div>
        ) : (
          <>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
              <FilterBar {...filterBarProps} defs={filterDefs}>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label={t('deviceManagement.columns.status')}
                  className="w-full sm:w-48 border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">{t('deviceManagement.filters.statusAll')}</option>
                  <option value="pending">{t('deviceManagement.filters.statusPending')}</option>
                  <option value="approved">{t('deviceManagement.filters.statusApproved')}</option>
                  <option value="revoked">{t('deviceManagement.filters.statusRevoked')}</option>
                </select>
              </FilterBar>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
              <div className="p-6">
                <Table
                  columns={columns}
                  data={devices}
                  loading={loading}
                  emptyMessage={t('deviceManagement.empty')}
                  listId="devices"
                />
                <Pagination {...paginationProps} />
              </div>
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={confirm.isOpen}
        onClose={confirm.handleClose}
        onConfirm={confirm.handleConfirm}
        title={confirm.title}
        message={confirm.message}
        confirmText={confirm.confirmText}
        cancelText={confirm.cancelText}
        variant={confirm.variant}
        loading={confirm.loading}
      />
    </Layout>
  );
};

export default Devices;
