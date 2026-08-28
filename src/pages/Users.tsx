import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { User, Company } from '../types';
import { usersApi, companiesApi } from '../services/api';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { SearchInput } from '../components/ui/SearchInput';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import InviteUserModal from '../components/modals/InviteUserModal';
import EditUserModal from '../components/modals/EditUserModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { logger } from '../utils/logger';

const Users: React.FC = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const confirmModal = useConfirmModal();

  const {
    filteredData: users,
    loading,
    search,
    setSearch,
    refresh,
    setFilters,
    paginationProps,
  } = useEntityList<User>({
    fetchFn: usersApi.getUsers,
    searchFields: ['email', 'firstName', 'lastName', 'companyName'],
  });

  useEffect(() => {
    if (currentUser?.role === 'superAdmin') {
      companiesApi.getCompanies().then((response) => {
        setCompanies(response.data);
      }).catch((error) => {
        logger.error('Error fetching companies:', error);
      });
    }
  }, [currentUser?.role]);

  useEffect(() => {
    if (selectedCompany === 'all') {
      setFilters({});
    } else {
      setFilters({ companyId: selectedCompany });
    }
  }, [selectedCompany, setFilters]);

  const handleDeleteUser = (user: User) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('users.deleteConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(user.uuid);
          await usersApi.deleteUser(user.uuid);
          await refresh();
        } catch (error) {
          logger.error('Error deleting user:', error);
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleUserUpdated = () => {
    setShowEditModal(false);
    setSelectedUser(null);
    refresh();
  };

  const handleUserInvited = () => {
    setShowInviteModal(false);
    refresh();
  };

  const filteredUsers = users.filter(user => {
    return selectedRole === 'all' || user.role === selectedRole;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superAdmin':
        return 'gd-badge-brand';
      case 'admin':
        return 'gd-badge-info';
      case 'member':
        return 'gd-badge-positive';
      default:
        return 'gd-badge-neutral';
    }
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive
      ? 'gd-badge-positive'
      : 'gd-badge-negative';
  };

  const columns = [
    {
      key: 'name',
      header: t('users.columns.name'),
      render: (_: any, user: User) => (
        <div>
          <div className="font-medium text-secondary-900">
            {user.firstName || t('users.noName')} {user.lastName || ''}
          </div>
          <div className="text-sm text-secondary-500">{user.email}</div>
        </div>
      ),
    },
    ...(currentUser?.role === 'superAdmin' ? [{
      key: 'company',
      header: t('users.columns.company'),
      render: (_: any, user: User) => (
        <span className="text-sm text-secondary-900">
          {user.companyName || t('users.platformAdmin')}
        </span>
      ),
    }] : []),
    {
      key: 'role',
      header: t('users.columns.role'),
      render: (_: any, user: User) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
          {t(`roleNames.${user.role}`, { defaultValue: user.role })}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('users.columns.status'),
      render: (_: any, user: User) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(user.isActive)}`}>
          {user.isActive ? t('users.status.active') : t('users.status.inactive')}
        </span>
      ),
    },
    {
      key: 'emailVerified',
      header: t('users.columns.emailVerified'),
      render: (_: any, user: User) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(user.emailVerified)}`}>
          {user.emailVerified ? t('users.emailStatus.verified') : t('users.emailStatus.pending')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('users.columns.actions'),
      render: (_: any, user: User) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEditUser(user)}
            className="text-secondary-400 hover:text-secondary-600"
            title={t('users.editUser')}
          >
            <Edit className="h-4 w-4" />
          </button>
          {user.uuid !== currentUser?.uuid && (
            <button
              onClick={() => handleDeleteUser(user)}
              disabled={actionLoading === user.uuid}
              className="text-red-400 hover:text-red-600 disabled:opacity-50"
              title={t('users.deleteUser')}
            >
              {actionLoading === user.uuid ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="gd-page-title">{t('users.title')}</h1>
            <p className="text-secondary-600 mt-1">
              {t('users.subtitle')}
            </p>
          </div>
          <Button onClick={() => setShowInviteModal(true)} className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            {t('users.inviteUser')}
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border border-secondary-200">
          <div className="flex-1 max-w-md">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('users.searchPlaceholder')}
            />
          </div>

          {currentUser?.role === 'superAdmin' && (
            <div className="w-full sm:w-48">
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">{t('users.allCompanies')}</option>
                {companies.map((company) => (
                  <option key={company.uuid} value={company.uuid}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="w-full sm:w-32">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">{t('users.allRoles')}</option>
              <option value="member">{t('roleNames.member')}</option>
              <option value="admin">{t('roleNames.admin')}</option>
              {currentUser?.role === 'superAdmin' && (
                <option value="superAdmin">{t('roleNames.superAdmin')}</option>
              )}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-secondary-200">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-secondary-600 mt-4">{t('users.loading')}</p>
            </div>
          ) : (
            <>
              <Table
                data={filteredUsers}
                columns={columns}
                emptyMessage={t('users.noUsers')}
              />
              <Pagination {...paginationProps} />
            </>
          )}
        </div>
      </div>

      {showInviteModal && (
        <InviteUserModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onSuccess={handleUserInvited}
        />
      )}

      {showEditModal && selectedUser && (
        <EditUserModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onSuccess={handleUserUpdated}
        />
      )}

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

export default Users;