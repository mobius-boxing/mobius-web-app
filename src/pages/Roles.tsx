import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Edit, ShieldCheck, KeyRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Role } from '../types';
import { rolesApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { SearchInput } from '../components/ui/SearchInput';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import { usePermissions } from '../hooks/usePermissions';
import CreateRoleModal from '../components/modals/CreateRoleModal';
import EditRoleModal from '../components/modals/EditRoleModal';
import RolePermissionsModal from '../components/modals/RolePermissionsModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { logger } from '../utils/logger';
import { historyColumn } from '../components/audit/historyColumn';

const Roles: React.FC = () => {
  const { t } = useTranslation();
  const { has } = usePermissions();
  const canEdit = has('roles.edit');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const confirmModal = useConfirmModal();

  const { effectiveCompanyId } = useEffectiveCompany();

  // Roles are cloned per company (RBAC Model B) — without this scope a
  // superAdmin sees every company's identical starter set stacked N times.
  const fetchRoles = useCallback(
    (params: Record<string, unknown>) =>
      rolesApi.getRoles(
        effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params
      ),
    [effectiveCompanyId]
  );

  const {
    filteredData: roles,
    loading,
    search,
    setSearch,
    refresh,
    paginationProps,
  } = useEntityList<Role>({
    fetchFn: fetchRoles,
    searchFields: ['name'],
  });

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setShowEditModal(true);
  };

  const handlePermissions = (role: Role) => {
    setSelectedRole(role);
    setShowPermissionsModal(true);
  };

  const handleDelete = (role: Role) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('roles.deleteConfirm', { name: role.name }),
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(role.uuid);
          await rolesApi.deleteRole(role.uuid);
          await refresh();
        } catch (error: any) {
          logger.error('Error deleting role:', error);
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const columns = [
    {
      key: 'name',
      header: t('roles.columns.name'),
      render: (value: any, role: Role) => (
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-secondary-900">
            {role.name}
          </span>
          {role.isProtected && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
              <ShieldCheck className="h-3 w-3 mr-1" />
              {t('roles.protected')}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'profileType',
      header: t('roles.columns.profileType'),
      render: (value: any, role: Role) => (
        <span className="text-sm text-secondary-500">
          {t(`roles.profileTypes.${role.profileType}`)}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: t('roles.columns.created'),
      render: (value: any, role: Role) => (
        <span className="text-sm text-secondary-500">
          {role.createdAt ? new Date(role.createdAt).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    historyColumn('roles', t),
    {
      key: 'actions',
      header: t('roles.columns.actions'),
      render: (value: any, role: Role) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePermissions(role)}
            disabled={actionLoading === role?.uuid || !role}
            title={t('roles.editPermissions')}
          >
            <KeyRound className="h-4 w-4" />
          </Button>
          {canEdit && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(role)}
                disabled={actionLoading === role?.uuid || !role}
                title={t('roles.editRole')}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(role)}
                disabled={
                  actionLoading === role?.uuid || !role || role.isProtected
                }
                className="text-red-600 hover:text-red-700"
                title={t('roles.deleteRole')}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="gd-page-title">
              {t('roles.title')}
            </h1>
            <p className="text-secondary-600">{t('roles.subtitle')}</p>
          </div>
          {canEdit && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('roles.addRole')}
            </Button>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('roles.searchPlaceholder')}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('roles.allRoles')} ({roles.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : roles.length === 0 ? (
              <div className="text-center py-12">
                <ShieldCheck className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">
                  {t('roles.empty.title')}
                </h3>
                <p className="gd-page-sub">
                  {search
                    ? t('roles.empty.description')
                    : t('roles.empty.noData')}
                </p>
              </div>
            ) : (
              <>
                <Table columns={columns} data={roles} loading={loading} />
                <Pagination {...paginationProps} />
              </>
            )}
          </div>
        </div>
      </div>

      <CreateRoleModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          refresh();
        }}
      />

      <EditRoleModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedRole(null);
        }}
        onSuccess={() => {
          setShowEditModal(false);
          setSelectedRole(null);
          refresh();
        }}
        role={selectedRole}
      />

      <RolePermissionsModal
        isOpen={showPermissionsModal}
        onClose={() => {
          setShowPermissionsModal(false);
          setSelectedRole(null);
        }}
        onSuccess={() => {
          setShowPermissionsModal(false);
          setSelectedRole(null);
          refresh();
        }}
        role={selectedRole}
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

export default Roles;
