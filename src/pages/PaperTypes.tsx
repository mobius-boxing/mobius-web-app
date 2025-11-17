import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Edit, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { PaperType } from '../types';
import { paperTypesApi } from '../services/api';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Table from '../components/ui/Table';
import CreatePaperTypeModal from '../components/modals/CreatePaperTypeModal';
import EditPaperTypeModal from '../components/modals/EditPaperTypeModal';

const PaperTypes: React.FC = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [paperTypes, setPaperTypes] = useState<PaperType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPaperType, setSelectedPaperType] = useState<PaperType | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPaperTypes();
  }, []);

  const fetchPaperTypes = async () => {
    try {
      setLoading(true);
      const response = await paperTypesApi.getPaperTypes();
      setPaperTypes(response.data || []);
    } catch (error) {
      console.error('Error fetching paper types:', error);
      setPaperTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (paperType: PaperType) => {
    setSelectedPaperType(paperType);
    setShowEditModal(true);
  };

  const handleDelete = async (paperTypeId: string) => {
    if (!window.confirm(t('paperTypes.deleteConfirm'))) {
      return;
    }

    try {
      setActionLoading(paperTypeId);
      await paperTypesApi.deletePaperType(paperTypeId);
      await fetchPaperTypes();
    } catch (error) {
      console.error('Error deleting paper type:', error);
      alert(t('paperTypes.deleteFailed'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchPaperTypes();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedPaperType(null);
    fetchPaperTypes();
  };

  // Filter paper types based on search term
  const filteredPaperTypes = paperTypes.filter((paperType) => {
    if (!paperType) return false;

    const matchesSearch = searchTerm === '' ||
      (paperType.code && paperType.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (paperType.description && paperType.description.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  const columns = [
    {
      key: 'code',
      header: t('paperTypes.columns.code'),
      render: (value: any, paperType: PaperType) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="font-medium text-secondary-900">{paperType.code || 'Unknown Code'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: t('paperTypes.columns.description'),
      render: (value: any, paperType: PaperType) => (
        <span className="text-sm text-secondary-900">
          {paperType?.description || '-'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: t('paperTypes.columns.created'),
      render: (value: any, paperType: PaperType) => (
        <span className="text-sm text-secondary-900">
          {paperType?.createdAt ? new Date(paperType.createdAt).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('paperTypes.columns.actions'),
      render: (value: any, paperType: PaperType) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(paperType)}
            disabled={actionLoading === paperType?.id || !paperType}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(paperType?.id)}
            disabled={actionLoading === paperType?.id || !paperType}
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
            <h1 className="text-2xl font-bold text-secondary-900">{t('paperTypes.title')}</h1>
            <p className="text-secondary-600">{t('paperTypes.subtitle')}</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('paperTypes.addType')}
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
                  placeholder={t('paperTypes.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Paper Types Table */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('paperTypes.allTypes')} ({filteredPaperTypes.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredPaperTypes.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('paperTypes.empty.title')}</h3>
                <p className="mt-1 text-sm text-secondary-500">
                  {searchTerm ? t('paperTypes.empty.description') : t('paperTypes.empty.noData')}
                </p>
                {!searchTerm && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('paperTypes.addType')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Table
                columns={columns}
                data={filteredPaperTypes}
                loading={loading}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreatePaperTypeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditPaperTypeModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedPaperType(null);
        }}
        onSuccess={handleEditSuccess}
        paperType={selectedPaperType}
      />
    </Layout>
  );
};

export default PaperTypes;
