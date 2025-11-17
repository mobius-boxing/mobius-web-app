import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Edit, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { PaperClass } from '../types';
import { paperClassesApi } from '../services/api';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Table from '../components/ui/Table';
import CreatePaperClassModal from '../components/modals/CreatePaperClassModal';
import EditPaperClassModal from '../components/modals/EditPaperClassModal';

const PaperClasses: React.FC = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [paperClasses, setPaperClasses] = useState<PaperClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPaperClass, setSelectedPaperClass] = useState<PaperClass | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPaperClasses();
  }, []);

  const fetchPaperClasses = async () => {
    try {
      setLoading(true);
      const response = await paperClassesApi.getPaperClasses();
      setPaperClasses(response.data || []);
    } catch (error) {
      console.error('Error fetching paper classes:', error);
      setPaperClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (paperClass: PaperClass) => {
    setSelectedPaperClass(paperClass);
    setShowEditModal(true);
  };

  const handleDelete = async (paperClassId: string) => {
    if (!window.confirm(t('paperClasses.deleteConfirm'))) {
      return;
    }

    try {
      setActionLoading(paperClassId);
      await paperClassesApi.deletePaperClass(paperClassId);
      await fetchPaperClasses();
    } catch (error) {
      console.error('Error deleting paper class:', error);
      alert(t('paperClasses.deleteFailed'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchPaperClasses();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedPaperClass(null);
    fetchPaperClasses();
  };

  // Filter paper classes based on search term
  const filteredPaperClasses = paperClasses.filter((paperClass) => {
    if (!paperClass) return false;

    const matchesSearch = searchTerm === '' ||
      (paperClass.code && paperClass.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (paperClass.name && paperClass.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  const columns = [
    {
      key: 'code',
      header: t('paperClasses.columns.code'),
      render: (value: any, paperClass: PaperClass) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="font-medium text-secondary-900">{paperClass.code || 'Unknown Code'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'name',
      header: t('paperClasses.columns.name'),
      render: (value: any, paperClass: PaperClass) => (
        <span className="text-sm text-secondary-900">
          {paperClass?.name || '-'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: t('paperClasses.columns.created'),
      render: (value: any, paperClass: PaperClass) => (
        <span className="text-sm text-secondary-900">
          {paperClass?.createdAt ? new Date(paperClass.createdAt).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('paperClasses.columns.actions'),
      render: (value: any, paperClass: PaperClass) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(paperClass)}
            disabled={actionLoading === paperClass?.id || !paperClass}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(paperClass?.id)}
            disabled={actionLoading === paperClass?.id || !paperClass}
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
            <h1 className="text-2xl font-bold text-secondary-900">{t('paperClasses.title')}</h1>
            <p className="text-secondary-600">{t('paperClasses.subtitle')}</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('paperClasses.addClass')}
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
                  placeholder={t('paperClasses.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Paper Classes Table */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('paperClasses.allClasses')} ({filteredPaperClasses.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredPaperClasses.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('paperClasses.empty.title')}</h3>
                <p className="mt-1 text-sm text-secondary-500">
                  {searchTerm ? t('paperClasses.empty.description') : t('paperClasses.empty.noData')}
                </p>
                {!searchTerm && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('paperClasses.addClass')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Table
                columns={columns}
                data={filteredPaperClasses}
                loading={loading}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreatePaperClassModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditPaperClassModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedPaperClass(null);
        }}
        onSuccess={handleEditSuccess}
        paperClass={selectedPaperClass}
      />
    </Layout>
  );
};

export default PaperClasses;
