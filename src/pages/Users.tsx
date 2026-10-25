import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Users as UsersIcon } from 'lucide-react';
import { User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { usersApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import { usePermissions } from '../hooks/usePermissions';
import { useAssignableRoles } from '../hooks/useAssignableRoles';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import ActionButton from '../components/ui/ActionButton';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import ConfirmModal from '../components/ui/ConfirmModal';
import ErrorMessage from '../components/ui/ErrorMessage';
import { FilterPromptState } from '../components/ui/filters';
import InviteCompanyUserModal from '../components/users/InviteCompanyUserModal';
import EditUserModal from '../components/users/EditUserModal';
import UserRolePicker from '../components/users/UserRolePicker';
import { logger } from '../utils/logger';

const errorMessage = (err: unknown, fallback: string): string =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

const Users: React.FC = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const { has } = usePermissions();
  const { isSuperAdmin, effectiveCompanyId, hasCompanySelected } = useEffectiveCompany();
  const canWriteUsers = has('users.edit');

  const { roles: filterRoles } = useAssignableRoles(effectiveCompanyId, hasCompanySelected);
  const [roleFilter, setRoleFilter] = useState('');
  // The API ignores `search` for company actors (L-007), so the term filters
  // the fetched page here instead of travelling as a query param.
  const [searchTerm, setSearchTerm] = useState('');

  // superAdmin users are central-plane: the selected company is named explicitly.
  const fetchUsers = useCallback(
    (params: Record<string, unknown>) =>
      usersApi.getUsers({
        page: params.page as number | undefined,
        limit: params.limit as number | undefined,
        roleUuid: params.roleUuid as string | undefined,
        ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}),
      }),
    [effectiveCompanyId]
  );

  const {
    data,
    loading,
    error: loadError,
    setFilters,
    refresh,
    paginationProps,
  } = useEntityList<User>({
    fetchFn: fetchUsers,
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
    setRoleFilter('');
    setFilters({});
    refreshRef.current();
  }, [effectiveCompanyId, setFilters]);

  const users = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return data;
    return data.filter((u) =>
      [u.firstName, u.lastName, u.email].some((value) => value?.toLowerCase().includes(term))
    );
  }, [data, searchTerm]);

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setFilters(value ? { roleUuid: value } : {});
  };

  const confirm = useConfirmModal();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    confirm.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('userManagement.deleteConfirm', { name: `${user.firstName} ${user.lastName}` }),
      variant: 'danger',
      onConfirm: async () => {
        setDeleteLoading(user.uuid);
        setActionError(null);
        try {
          await usersApi.deleteUser(user.uuid);
          await refresh();
        } catch (err: unknown) {
          logger.error('Error deleting user:', err);
          setActionError(errorMessage(err, t('userManagement.deleteFailed')));
        } finally {
          setDeleteLoading(null);
        }
      },
    });
  };

  const handleToggleActive = async (user: User) => {
    setStatusLoading(user.uuid);
    setActionError(null);
    try {
      // The full profile travels with the flag: PUT /users/:uuid answers 400
      // "Params are missing" to an isActive-only body.
      await usersApi.updateUser(user.uuid, {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email,
        role: user.role,
        isActive: !user.isActive,
        ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}),
      });
      await refresh();
    } catch (err: unknown) {
      logger.error('Error changing user status:', err);
      setActionError(errorMessage(err, t('userManagement.statusFailed')));
    } finally {
      setStatusLoading(null);
    }
  };

  const canEditUser = (user: User) => isSuperAdmin || (canWriteUsers && user.role !== 'superAdmin');
  // Company actors never delete users: their lifecycle is invite/deactivate only.
  const canDeleteUser = (user: User) => isSuperAdmin && user.uuid !== currentUser?.uuid;
  const canToggleActive = (user: User) => user.uuid !== currentUser?.uuid && (isSuperAdmin || canWriteUsers);
  const canAssignRole = (user: User) => canWriteUsers && user.uuid !== currentUser?.uuid;

  const columns = [
    {
      key: 'name',
      header: t('userManagement.name'),
      hideable: false,
      card: 'title' as const,
      render: (_value: unknown, user: User) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-sm font-medium text-primary-600">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-secondary-900">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-sm text-secondary-500">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'roleName',
      header: t('userManagement.role'),
      render: (_value: unknown, user: User) =>
        user.role === 'superAdmin' ? (
          <span className="gd-badge gd-badge-brand">{t('userManagement.roles.superAdmin')}</span>
        ) : (
          <UserRolePicker
            user={user}
            roles={filterRoles}
            disabled={!canAssignRole(user)}
            onAssigned={refresh}
            onError={setActionError}
          />
        ),
    },
    {
      key: 'isActive',
      header: t('userManagement.status'),
      render: (_value: unknown, user: User) => (
        <span className={`gd-badge ${user.isActive ? 'gd-badge-positive' : 'gd-badge-negative'}`}>
          {user.isActive ? t('userManagement.active') : t('userManagement.inactive')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('userManagement.actions'),
      pinned: true,
      card: 'actions' as const,
      render: (_value: unknown, user: User) => (
        <div className="flex items-center space-x-2">
          {canEditUser(user) && (
            <ActionButton label={t('common.edit')} onClick={() => handleEditUser(user)}>
              <Edit className="h-4 w-4" />
            </ActionButton>
          )}
          {canToggleActive(user) && (
            <ActionButton
              label={user.isActive ? t('userManagement.deactivate') : t('userManagement.reactivate')}
              onClick={() => handleToggleActive(user)}
              disabled={statusLoading === user.uuid}
            >
              {user.isActive ? (
                <ToggleRight className="h-5 w-5 text-green-600" />
              ) : (
                <ToggleLeft className="h-5 w-5" />
              )}
            </ActionButton>
          )}
          {canDeleteUser(user) && (
            <ActionButton
              label={t('common.delete')}
              tone="danger"
              onClick={() => handleDeleteUser(user)}
              disabled={deleteLoading === user.uuid}
            >
              <Trash2 className="h-4 w-4" />
            </ActionButton>
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
            <h1 className="gd-page-title">{t('userManagement.title')}</h1>
            <p className="text-secondary-600">{t('userManagement.subtitle')}</p>
          </div>
          {canWriteUsers && hasCompanySelected && (
            <Button onClick={() => setIsInviteModalOpen(true)} className="inline-flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              {t('userManagement.inviteUser')}
            </Button>
          )}
        </div>

        <ErrorMessage message={actionError} />
        <ErrorMessage message={loadError} />

        {!hasCompanySelected ? (
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
            <FilterPromptState
              icon={UsersIcon}
              title={t('companySelector.noCompanySelected')}
              description={t('userManagement.selectCompanyPrompt')}
            />
          </div>
        ) : (
          <>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200 flex flex-wrap items-center gap-3">
              <div className="gd-search relative flex-1 min-w-[12rem]">
                <input
                  type="text"
                  placeholder={t('userManagement.searchPlaceholder')}
                  aria-label={t('userManagement.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field"
                />
              </div>
              {filterRoles.length > 0 && (
                <select
                  value={roleFilter}
                  onChange={(e) => handleRoleFilterChange(e.target.value)}
                  aria-label={t('userManagement.filterByRole')}
                  className="border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">{t('userManagement.filterByRole')}</option>
                  {filterRoles.map((role) => (
                    <option key={role.uuid} value={role.uuid}>
                      {role.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
              <div className="p-6">
                <Table
                  columns={columns}
                  data={users}
                  loading={loading}
                  emptyMessage={t('userManagement.noUsers')}
                  listId="users"
                />
                <Pagination {...paginationProps} />
              </div>
            </div>
          </>
        )}
      </div>

      <InviteCompanyUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={() => {
          setIsInviteModalOpen(false);
          refresh();
        }}
        companyId={effectiveCompanyId}
      />

      {selectedUser && (
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          currentUserUuid={currentUser?.uuid}
          onSuccess={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
            refresh();
          }}
        />
      )}

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

export default Users;
