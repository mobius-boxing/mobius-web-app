import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Edit, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CorrugationClass } from '../types';
import { corrugationClassesApi } from '../services/api';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Table from '../components/ui/Table';
import ConfirmModal from '../components/ui/ConfirmModal';
import CreateCorrugationClassModal from '../components/modals/CreateCorrugationClassModal';
import EditCorrugationClassModal from '../components/modals/EditCorrugationClassModal';

const CorrugationClasses: React.FC = () => {
  const { t } = useTranslation();
  const [corrugationClasses, setCorrugationClasses] = useState<CorrugationClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCorrugationClass, setSelectedCorrugationClass] = useState<CorrugationClass | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchCorrugationClasses();
  }, []);

  const fetchCorrugationClasses = async () => {
    try {
      setLoading(true);
      const response = await corrugationClassesApi.getCorrugationClasses();
      setCorrugationClasses(response.data || []);
    } catch (error) {
      console.error('Error fetching corrugation classes:', error);
      setCorrugationClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (corrugationClass: CorrugationClass) => {
    setSelectedCorrugationClass(corrugationClass);
    setShowEditModal(true);
  };

  const handleDeleteClick = (corrugationClass: CorrugationClass) => {
    setSelectedCorrugationClass(corrugationClass);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCorrugationClass?.uuid) return;

    try {
      setActionLoading(true);
      await corrugationClassesApi.deleteCorrugationClass(selectedCorrugationClass.uuid);
      setShowDeleteModal(false);
      setSelectedCorrugationClass(null);
      await fetchCorrugationClasses();
    } catch (error) {
      console.error('Error deleting corrugation class:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchCorrugationClasses();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedCorrugationClass(null);
    fetchCorrugationClasses();
  };

  // Filter corrugation classes based on search term
  const filteredCorrugationClasses = corrugationClasses.filter((corrugationClass) => {
    if (!corrugationClass) return false;

    const matchesSearch = searchTerm === '' ||
      (corrugationClass.code && corrugationClass.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (corrugationClass.description && corrugationClass.description.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  const columns = [
    {
      key: 'code',
      header: t('corrugationClasses.columns.code'),
      render: (value: any, corrugationClass: CorrugationClass) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <Layers className="h-5 w-5 text-primary-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="font-medium text-secondary-900">{corrugationClass.code || 'Unknown Code'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: t('corrugationClasses.columns.description'),
      render: (value: any, corrugationClass: CorrugationClass) => (
        <span className="text-sm text-secondary-900">
          {corrugationClass?.description || '-'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: t('corrugationClasses.columns.created'),
      render: (value: any, corrugationClass: CorrugationClass) => (
        <span className="text-sm text-secondary-900">
          {corrugationClass?.createdAt ? new Date(corrugationClass.createdAt).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('corrugationClasses.columns.actions'),
      render: (value: any, corrugationClass: CorrugationClass) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(corrugationClass)}
            disabled={!corrugationClass}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteClick(corrugationClass)}
            disabled={!corrugationClass}
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
            <h1 className="text-2xl font-bold text-secondary-900">{t('corrugationClasses.title')}</h1>
            <p className="text-secondary-600">{t('corrugationClasses.subtitle')}</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('corrugationClasses.addClass')}
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
                  placeholder={t('corrugationClasses.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Corrugation Classes Table */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('corrugationClasses.allClasses')} ({filteredCorrugationClasses.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredCorrugationClasses.length === 0 ? (
              <div className="text-center py-12">
                <Layers className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('corrugationClasses.empty.title')}</h3>
                <p className="mt-1 text-sm text-secondary-500">
                  {searchTerm ? t('corrugationClasses.empty.description') : t('corrugationClasses.empty.noData')}
                </p>
                {!searchTerm && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('corrugationClasses.addClass')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Table
                columns={columns}
                data={filteredCorrugationClasses}
                loading={loading}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateCorrugationClassModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditCorrugationClassModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCorrugationClass(null);
        }}
        onSuccess={handleEditSuccess}
        corrugationClass={selectedCorrugationClass}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedCorrugationClass(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={t('common.confirm')}
        message={t('corrugationClasses.deleteConfirm')}
        confirmText={t('common.delete')}
        loading={actionLoading}
        variant="danger"
      />
    </Layout>
  );
};

export default CorrugationClasses;
