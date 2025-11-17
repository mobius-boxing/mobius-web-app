import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Edit, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { FluteType } from '../types';
import { fluteTypesApi } from '../services/api';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Table from '../components/ui/Table';
import CreateFluteTypeModal from '../components/modals/CreateFluteTypeModal';
import EditFluteTypeModal from '../components/modals/EditFluteTypeModal';

const FluteTypes: React.FC = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [fluteTypes, setFluteTypes] = useState<FluteType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFluteType, setSelectedFluteType] = useState<FluteType | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchFluteTypes();
  }, []);

  const fetchFluteTypes = async () => {
    try {
      setLoading(true);
      const response = await fluteTypesApi.getFluteTypes();
      setFluteTypes(response.data || []);
    } catch (error) {
      console.error('Error fetching flute types:', error);
      setFluteTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (fluteType: FluteType) => {
    setSelectedFluteType(fluteType);
    setShowEditModal(true);
  };

  const handleDelete = async (fluteTypeId: string) => {
    if (!window.confirm(t('fluteTypes.deleteConfirm'))) {
      return;
    }

    try {
      setActionLoading(fluteTypeId);
      await fluteTypesApi.deleteFluteType(fluteTypeId);
      await fetchFluteTypes();
    } catch (error) {
      console.error('Error deleting flute type:', error);
      alert(t('fluteTypes.deleteFailed'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchFluteTypes();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedFluteType(null);
    fetchFluteTypes();
  };

  // Filter flute types based on search term
  const filteredFluteTypes = fluteTypes.filter((fluteType) => {
    if (!fluteType) return false;

    const matchesSearch = searchTerm === '' ||
      (fluteType.code && fluteType.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (fluteType.description && fluteType.description.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  const columns = [
    {
      key: 'code',
      header: t('fluteTypes.columns.code'),
      render: (value: any, fluteType: FluteType) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <Layers className="h-5 w-5 text-primary-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="font-medium text-secondary-900">{fluteType.code || 'Unknown Code'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: t('fluteTypes.columns.description'),
      render: (value: any, fluteType: FluteType) => (
        <span className="text-sm text-secondary-900">
          {fluteType?.description || '-'}
        </span>
      ),
    },
    {
      key: 'flueFactor',
      header: t('fluteTypes.columns.flueFactor'),
      render: (value: any, fluteType: FluteType) => (
        <span className="text-sm text-secondary-900">
          {fluteType?.flueFactor !== undefined ? fluteType.flueFactor : '-'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: t('fluteTypes.columns.created'),
      render: (value: any, fluteType: FluteType) => (
        <span className="text-sm text-secondary-900">
          {fluteType?.createdAt ? new Date(fluteType.createdAt).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('fluteTypes.columns.actions'),
      render: (value: any, fluteType: FluteType) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(fluteType)}
            disabled={actionLoading === fluteType?.id || !fluteType}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(fluteType?.id)}
            disabled={actionLoading === fluteType?.id || !fluteType}
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
            <h1 className="text-2xl font-bold text-secondary-900">{t('fluteTypes.title')}</h1>
            <p className="text-secondary-600">{t('fluteTypes.subtitle')}</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('fluteTypes.addType')}
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
                  placeholder={t('fluteTypes.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Flute Types Table */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('fluteTypes.allTypes')} ({filteredFluteTypes.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredFluteTypes.length === 0 ? (
              <div className="text-center py-12">
                <Layers className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('fluteTypes.empty.title')}</h3>
                <p className="mt-1 text-sm text-secondary-500">
                  {searchTerm ? t('fluteTypes.empty.description') : t('fluteTypes.empty.noData')}
                </p>
                {!searchTerm && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('fluteTypes.addType')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Table
                columns={columns}
                data={filteredFluteTypes}
                loading={loading}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateFluteTypeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditFluteTypeModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedFluteType(null);
        }}
        onSuccess={handleEditSuccess}
        fluteType={selectedFluteType}
      />
    </Layout>
  );
};

export default FluteTypes;
