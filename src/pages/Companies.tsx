import React, { useState } from 'react';
import { Plus, Trash2, Edit, Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Company } from '../types';
import { companiesApi } from '../services/api';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { SearchInput } from '../components/ui/SearchInput';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import CreateCompanyModal from '../components/modals/CreateCompanyModal';
import EditCompanyModal from '../components/modals/EditCompanyModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { logger } from '../utils/logger';

const Companies: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { t } = useTranslation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const confirmModal = useConfirmModal();

  // Use the entity list hook for data management
  const {
    filteredData: companies,
    loading,
    search,
    setSearch,
    refresh,
    paginationProps,
  } = useEntityList<Company>({
    fetchFn: companiesApi.getCompanies,
    searchFields: ['name', 'description'],
  });

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setShowEditModal(true);
  };

  const handleDelete = (company: Company) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('companies.deleteConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(company.uuid);
          await companiesApi.deleteCompany(company.uuid);
          await refresh();
        } catch (error) {
          logger.error('Error deleting company:', error);
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleToggleStatus = async (company: Company) => {
    try {
      setActionLoading(company.uuid);
      await companiesApi.updateCompanyStatus(company.uuid, !company.isActive);
      await refresh();
    } catch (error) {
      logger.error('Error updating company status:', error);
      alert(t('companies.statusUpdateFailed'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    refresh();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedCompany(null);
    refresh();
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const columns = [
    {
      key: 'name',
      header: t('companies.columns.company'),
      render: (value: any, company: Company) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="font-medium text-secondary-900">{company.name || t('companies.fallbacks.unknownCompany')}</div>
            <div className="text-sm text-secondary-500">
              {company.description || t('companies.fallbacks.noDescription')}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: t('companies.columns.status'),
      render: (value: any, company: Company) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(company?.isActive ?? false)}`}>
          {company?.isActive ? t('companies.status.active') : t('companies.status.inactive')}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: t('companies.columns.created'),
      render: (value: any, company: Company) => (
        <span className="text-sm text-secondary-900">
          {company?.createdAt ? new Date(company.createdAt).toLocaleDateString() : t('companies.fallbacks.noDate')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('companies.columns.actions'),
      render: (value: any, company: Company) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(company)}
            disabled={actionLoading === company?.uuid || !company}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleStatus(company)}
            disabled={actionLoading === company?.uuid || !company}
            className={company?.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
          >
            {company?.isActive ? t('companies.actions.deactivate') : t('companies.actions.activate')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(company)}
            disabled={actionLoading === company?.uuid || !company}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (!currentUser || currentUser.role !== 'superAdmin') {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-medium text-secondary-900 mb-2">{t('auth.accessDenied')}</h3>
            <p className="text-secondary-500">{t('auth.noPermission')}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">{t('companies.title')}</h1>
            <p className="text-secondary-600">{t('companies.subtitle')}</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('companies.addCompany')}
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('companies.searchPlaceholder')}
              />
            </div>
          </div>
        </div>

        {/* Companies Table */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('companies.allCompanies')} ({companies.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : companies.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('companies.empty.title')}</h3>
                <p className="mt-1 text-sm text-secondary-500">
                  {search ? t('companies.empty.description') : t('companies.empty.noData')}
                </p>
                {!search && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('companies.addCompany')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Table
                  columns={columns}
                  data={companies}
                  loading={loading}
                />
                <Pagination {...paginationProps} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateCompanyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditCompanyModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCompany(null);
        }}
        onSuccess={handleEditSuccess}
        company={selectedCompany}
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

export default Companies;