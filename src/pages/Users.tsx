import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { User, Company } from '../types';
import { usersApi, companiesApi } from '../services/api';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import { SearchInput } from '../components/ui/SearchInput';
import { useEntityList } from '../hooks/useEntityList';
import InviteUserModal from '../components/modals/InviteUserModal';
import EditUserModal from '../components/modals/EditUserModal';

const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Use the entity list hook for data management
  const {
    filteredData: users,
    loading,
    search,
    setSearch,
    refresh,
    setFilters,
  } = useEntityList<User>({
    fetchFn: usersApi.getUsers,
    searchFields: ['email', 'firstName', 'lastName', 'companyName'],
  });

  // Fetch companies for super admin dropdown
  useEffect(() => {
    if (currentUser?.role === 'superAdmin') {
      companiesApi.getCompanies().then((response) => {
        setCompanies(response.data);
      }).catch((error) => {
        console.error('Error fetching companies:', error);
      });
    }
  }, [currentUser?.role]);

  // Update filters when company selection changes
  useEffect(() => {
    if (selectedCompany === 'all') {
      setFilters({});
    } else {
      setFilters({ companyId: selectedCompany });
    }
  }, [selectedCompany, setFilters]);

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      setActionLoading(user.uuid);
      await usersApi.deleteUser(user.uuid);
      await refresh();
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setActionLoading(null);
    }
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

  // Apply role filter (client-side) - search is handled by useEntityList
  const filteredUsers = users.filter(user => {
    return selectedRole === 'all' || user.role === selectedRole;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superAdmin':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'member':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-secondary-100 text-secondary-800';
    }
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  // Column definitions
  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (_: any, user: User) => (
        <div>
          <div className="font-medium text-secondary-900">
            {user.firstName || 'N/A'} {user.lastName || ''}
          </div>
          <div className="text-sm text-secondary-500">{user.email}</div>
        </div>
      ),
    },
    ...(currentUser?.role === 'superAdmin' ? [{
      key: 'company',
      header: 'Company',
      render: (_: any, user: User) => (
        <span className="text-sm text-secondary-900">
          {user.companyName || 'Platform Admin'}
        </span>
      ),
    }] : []),
    {
      key: 'role',
      header: 'Role',
      render: (_: any, user: User) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
          {user.role}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (_: any, user: User) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(user.isActive)}`}>
          {user.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'emailVerified',
      header: 'Email Verified',
      render: (_: any, user: User) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(user.emailVerified)}`}>
          {user.emailVerified ? 'Verified' : 'Pending'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: any, user: User) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEditUser(user)}
            className="text-secondary-400 hover:text-secondary-600"
            title="Edit user"
          >
            <Edit className="h-4 w-4" />
          </button>
          {user.uuid !== currentUser?.uuid && (
            <button
              onClick={() => handleDeleteUser(user)}
              disabled={actionLoading === user.uuid}
              className="text-red-400 hover:text-red-600 disabled:opacity-50"
              title="Delete user"
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
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">User Management</h1>
            <p className="text-secondary-600 mt-1">
              Manage users and their permissions
            </p>
          </div>
          <Button onClick={() => setShowInviteModal(true)} className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border border-secondary-200">
          <div className="flex-1 max-w-md">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search users..."
            />
          </div>

          {currentUser?.role === 'superAdmin' && (
            <div className="w-full sm:w-48">
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Companies</option>
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
              <option value="all">All Roles</option>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              {currentUser?.role === 'superAdmin' && (
                <option value="superAdmin">Super Admin</option>
              )}
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg border border-secondary-200">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-secondary-600 mt-4">Loading users...</p>
            </div>
          ) : (
            <Table
              data={filteredUsers}
              columns={columns}
              emptyMessage="No users found"
            />
          )}
        </div>
      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <InviteUserModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onSuccess={handleUserInvited}
        />
      )}

      {/* Edit User Modal */}
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
    </Layout>
  );
};

export default Users;