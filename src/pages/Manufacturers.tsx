import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Edit, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Manufacturer } from '../types';
import { manufacturersApi } from '../services/api';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Table from '../components/ui/Table';
import CreateManufacturerModal from '../components/modals/CreateManufacturerModal';
import EditManufacturerModal from '../components/modals/EditManufacturerModal';

const Manufacturers: React.FC = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState<Manufacturer | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchManufacturers();
  }, []);

  const fetchManufacturers = async () => {
    try {
      setLoading(true);
      const response = await manufacturersApi.getManufacturers();
      setManufacturers(response.data || []);
    } catch (error) {
      console.error('Error fetching manufacturers:', error);
      setManufacturers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (manufacturer: Manufacturer) => {
    setSelectedManufacturer(manufacturer);
    setShowEditModal(true);
  };

  const handleDelete = async (manufacturerId: string) => {
    if (!window.confirm(t('manufacturers.deleteConfirm'))) {
      return;
    }

    try {
      setActionLoading(manufacturerId);
      await manufacturersApi.deleteManufacturer(manufacturerId);
      await fetchManufacturers();
    } catch (error: any) {
      console.error('Error deleting manufacturer:', error);
      const errorMessage = error.response?.data?.message || t('manufacturers.deleteFailed');
      alert(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchManufacturers();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedManufacturer(null);
    fetchManufacturers();
  };

  // Filter manufacturers based on search term
  const filteredManufacturers = manufacturers.filter((manufacturer) => {
    if (!manufacturer) return false;

    const matchesSearch = searchTerm === '' ||
      (manufacturer.code && manufacturer.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (manufacturer.name && manufacturer.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  const columns = [
    {
      key: 'code',
      header: t('manufacturers.columns.code'),
      render: (value: any, manufacturer: Manufacturer) => (
        <span className="text-sm font-medium text-secondary-900">
          {manufacturer.code || 'N/A'}
        </span>
      ),
    },
    {
      key: 'name',
      header: t('manufacturers.columns.name'),
      render: (value: any, manufacturer: Manufacturer) => (
        <span className="text-sm text-secondary-900">
          {manufacturer.name || 'N/A'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: t('manufacturers.columns.created'),
      render: (value: any, manufacturer: Manufacturer) => (
        <span className="text-sm text-secondary-500">
          {manufacturer.createdAt ? new Date(manufacturer.createdAt).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('manufacturers.columns.actions'),
      render: (value: any, manufacturer: Manufacturer) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(manufacturer)}
            disabled={actionLoading === manufacturer?.uuid || !manufacturer}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(manufacturer?.uuid)}
            disabled={actionLoading === manufacturer?.uuid || !manufacturer}
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
            <h1 className="text-2xl font-bold text-secondary-900">{t('manufacturers.title')}</h1>
            <p className="text-secondary-600">{t('manufacturers.subtitle')}</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('manufacturers.addManufacturer')}
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                <Input
                  type="text"
                  placeholder={t('manufacturers.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Manufacturers Table */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('manufacturers.allManufacturers')} ({filteredManufacturers.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredManufacturers.length === 0 ? (
              <div className="text-center py-12">
                <Wrench className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('manufacturers.empty.title')}</h3>
                <p className="mt-1 text-sm text-secondary-500">
                  {searchTerm ? t('manufacturers.empty.description') : t('manufacturers.empty.noData')}
                </p>
                {!searchTerm && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('manufacturers.addManufacturer')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Table
                columns={columns}
                data={filteredManufacturers}
                loading={loading}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateManufacturerModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditManufacturerModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedManufacturer(null);
        }}
        onSuccess={handleEditSuccess}
        manufacturer={selectedManufacturer}
      />
    </Layout>
  );
};

export default Manufacturers;
