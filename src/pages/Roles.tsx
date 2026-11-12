import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, KeyRound, ShieldCheck } from 'lucide-react';
import { Role } from '../types';
import { rolesApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import { usePermissions } from '../hooks/usePermissions';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import ActionButton from '../components/ui/ActionButton';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import ConfirmModal from '../components/ui/ConfirmModal';
import ErrorMessage from '../components/ui/ErrorMessage';
import { FilterPromptState } from '../components/ui/filters';
import CreateRoleModal from '../components/roles/CreateRoleModal';
import EditRoleModal from '../components/roles/EditRoleModal';
import RolePermissionsModal from '../components/roles/RolePermissionsModal';
import { logger } from '../utils/logger';

const Roles: React.FC = () => {
  const { t } = useTranslation();
  const { has } = usePermissions();
  const { effectiveCompanyId, hasCompanySelected } = useEffectiveCompany();
  // Admin's grants can't be edited and system roles can't be renamed/deleted
  // regardless of `canWrite`: this only gates create/rename/delete.
  const canWrite = has('roles.edit');

  const fetchRoles = useCallback(
    (params: Record<string, unknown>) =>
      rolesApi.getRoles({
        page: params.page as number | undefined,
        limit: params.limit as number | undefined,
        search: params.search as string | undefined,
        ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}),
      }),
    [effectiveCompanyId]
  );

  const {
    data,
    loading,
    error: loadError,
    search,
    setSearch,
    refresh,
    paginationProps,
  } = useEntityList<Role>({
    fetchFn: fetchRoles,
    initialLimit: 100,
    enabled: hasCompanySelected,
  });

  // fetchFn is not an auto-fetch dependency, so a company switch refetches here.
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    refreshRef.current();
  }, [effectiveCompanyId]);

  const confirm = useConfirmModal();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setIsEditModalOpen(true);
  };

  const handlePermissions = (role: Role) => {
    setSelectedRole(role);
    setIsPermissionsModalOpen(true);
  };

  const handleDelete = (role: Role) => {
    confirm.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('roleManagement.deleteConfirm', { name: role.name }),
      variant: 'danger',
      onConfirm: async () => {
        setActionLoading(role.uuid);
        setActionError(null);
        try {
          await rolesApi.deleteRole(role.uuid, effectiveCompanyId);
          await refresh();
        } catch (err: unknown) {
          logger.error('Error deleting role:', err);
          const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
          setActionError(message || t('roleManagement.deleteFailed'));
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const closeModals = () => {
    setIsEditModalOpen(false);
    setIsPermissionsModalOpen(false);
    setSelectedRole(null);
  };

  const columns = [
    {
      key: 'name',
      header: t('roleManagement.columns.name'),
      hideable: false,
      card: 'title' as const,
      render: (_value: unknown, role: Role) => (
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-secondary-900">{role.name}</span>
          {role.systemKey && (
            <span className="gd-badge gd-badge-info">
              <ShieldCheck className="h-3 w-3 mr-1 inline" />
              {t(`roleManagement.systemKeys.${role.systemKey}`)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'userCount',
      header: t('roleManagement.columns.userCount'),
      render: (_value: unknown, role: Role) => (
        <span className="text-sm text-secondary-700">{role.userCount}</span>
      ),
    },
    {
      key: 'actions',
      header: t('roleManagement.columns.actions'),
      pinned: true,
      card: 'actions' as const,
      render: (_value: unknown, role: Role) => {
        const locked = !!role.systemKey;
        return (
          <div className="flex items-center space-x-2">
            <ActionButton label={t('roleManagement.editPermissions')} onClick={() => handlePermissions(role)}>
              <KeyRound className="h-4 w-4" />
            </ActionButton>
            {canWrite && (
              <>
                <ActionButton
                  label={t('roleManagement.editRole')}
                  onClick={() => handleEdit(role)}
                  disabled={locked}
                >
                  <Edit className="h-4 w-4" />
                </ActionButton>
                <ActionButton
                  label={t('roleManagement.deleteRole')}
                  tone="danger"
                  onClick={() => handleDelete(role)}
                  disabled={actionLoading === role.uuid || locked || role.userCount > 0}
                >
                  <Trash2 className="h-4 w-4" />
                </ActionButton>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="gd-page-title">{t('roleManagement.title')}</h1>
            <p className="text-secondary-600">{t('roleManagement.subtitle')}</p>
          </div>
          {canWrite && hasCompanySelected && (
            <Button onClick={() => setIsCreateModalOpen(true)} className="inline-flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              {t('roleManagement.addRole')}
            </Button>
          )}
        </div>

        <ErrorMessage message={actionError} />
        <ErrorMessage message={loadError} />

        {!hasCompanySelected ? (
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
            <FilterPromptState
              icon={ShieldCheck}
              title={t('companySelector.noCompanySelected')}
              description={t('roleManagement.selectCompanyPrompt')}
            />
          </div>
        ) : (
          <>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
              <div className="gd-search relative">
                <input
                  type="text"
                  placeholder={t('roleManagement.searchPlaceholder')}
                  aria-label={t('roleManagement.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
              <div className="p-6">
                <Table
                  columns={columns}
                  data={data}
                  loading={loading}
                  emptyMessage={t('roleManagement.noRoles')}
                  listId="roles"
                />
                <Pagination {...paginationProps} />
              </div>
            </div>
          </>
        )}
      </div>

      <CreateRoleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          refresh();
        }}
        companyId={effectiveCompanyId}
      />

      <EditRoleModal
        isOpen={isEditModalOpen}
        onClose={closeModals}
        onSuccess={() => {
          closeModals();
          refresh();
        }}
        role={selectedRole}
        companyId={effectiveCompanyId}
      />

      <RolePermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={closeModals}
        onSuccess={() => {
          closeModals();
          refresh();
        }}
        role={selectedRole}
        companyId={effectiveCompanyId}
      />

      <ConfirmModal
        isOpen={confirm.isOpen}
        onClose={confirm.handleClose}
        onConfirm={confirm.handleConfirm}
        title={confirm.title}
        message={confirm.message}
        variant={confirm.variant}
        loading={confirm.loading}
      />
    </Layout>
  );
};

export default Roles;
