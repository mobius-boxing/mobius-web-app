import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Edit, User as UserIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Customer } from '../types';
import { customersApi } from '../services/api';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import { SearchInput } from '../components/ui/SearchInput';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import CreateCustomerModal from '../components/modals/CreateCustomerModal';
import EditCustomerModal from '../components/modals/EditCustomerModal';
import ConfirmModal from '../components/ui/ConfirmModal';

const Customers: React.FC = () => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const confirmModal = useConfirmModal();

  // Create fetch function with company filter
  const fetchCustomers = useCallback((params: Record<string, unknown>) => {
    const fetchParams = effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params;
    return customersApi.getCustomers(fetchParams);
  }, [effectiveCompanyId]);

  // Use the entity list hook for data management
  const {
    filteredData: customers,
    loading,
    search,
    setSearch,
    refresh,
  } = useEntityList<Customer>({
    fetchFn: fetchCustomers,
    searchFields: ['name', 'supplierCode', 'categoryName', 'salesPersonName'],
  });

  // Refetch when effectiveCompanyId changes
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowEditModal(true);
  };

  const handleDelete = (customerId: string) => {
    confirmModal.showConfirm({
      title: t('confirmModal.deleteTitle'),
      message: t('customers.deleteConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(customerId);
          await customersApi.deleteCustomer(customerId);
          await refresh();
        } catch (error: any) {
          console.error('Error deleting customer:', error);
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    refresh();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedCustomer(null);
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
      header: t('customers.columns.customerName'),
      render: (value: any, customer: Customer) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <UserIcon className="h-5 w-5 text-primary-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="font-medium text-secondary-900">{customer.name || 'Unknown Customer'}</div>
            {customer.legalName && (
              <div className="text-sm text-secondary-500">{customer.legalName}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'supplierCode',
      header: t('customers.columns.supplierCode'),
      render: (value: any, customer: Customer) => (
        <span className="text-sm text-secondary-900">
          {customer.supplierCode || 'N/A'}
        </span>
      ),
    },
    {
      key: 'category',
      header: t('customers.columns.category'),
      render: (value: any, customer: Customer) => (
        <span className="text-sm text-secondary-900">
          {customer.categoryName || 'N/A'}
        </span>
      ),
    },
    {
      key: 'salesPerson',
      header: t('customers.columns.salesPerson'),
      render: (value: any, customer: Customer) => (
        <span className="text-sm text-secondary-900">
          {customer.salesPersonName || 'N/A'}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('customers.columns.status'),
      render: (value: any, customer: Customer) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(customer?.active ?? false)}`}>
          {customer?.active ? t('customers.status.active') : t('customers.status.inactive')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('customers.columns.actions'),
      render: (value: any, customer: Customer) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(customer)}
            disabled={actionLoading === customer?.uuid || !customer}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(customer?.uuid)}
            disabled={actionLoading === customer?.uuid || !customer}
            className="text-red-600 hover:text-red-700"
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">{t('customers.title')}</h1>
            <p className="text-secondary-600">{t('customers.subtitle')}</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('customers.addCustomer')}
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('customers.searchPlaceholder')}
              />
            </div>
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('customers.allCustomers')} ({customers.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-12">
                <UserIcon className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('customers.empty.title')}</h3>
                <p className="mt-1 text-sm text-secondary-500">
                  {search ? t('customers.empty.description') : t('customers.empty.noData')}
                </p>
                {!search && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('customers.addCustomer')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Table
                columns={columns}
                data={customers}
                loading={loading}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateCustomerModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditCustomerModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCustomer(null);
        }}
        onSuccess={handleEditSuccess}
        customer={selectedCustomer}
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

export default Customers;
