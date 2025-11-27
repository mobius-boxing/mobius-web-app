import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Edit, Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { CustomerCategory } from '../types';
import { customerCategoriesApi } from '../services/api';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Table from '../components/ui/Table';
import CreateCustomerCategoryModal from '../components/modals/CreateCustomerCategoryModal';
import EditCustomerCategoryModal from '../components/modals/EditCustomerCategoryModal';

const CustomerCategories: React.FC = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [categories, setCategories] = useState<CustomerCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CustomerCategory | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await customerCategoriesApi.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching customer categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: CustomerCategory) => {
    setSelectedCategory(category);
    setShowEditModal(true);
  };

  const handleDelete = async (category: CustomerCategory) => {
    if (!window.confirm(t('customerCategories.deleteConfirm'))) {
      return;
    }

    try {
      setActionLoading(category.uuid);
      await customerCategoriesApi.deleteCategory(category.uuid);
      await fetchCategories();
    } catch (error) {
      console.error('Error deleting customer category:', error);
      alert(t('customerCategories.deleteFailed'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchCategories();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedCategory(null);
    fetchCategories();
  };

  // Filter categories based on search term
  const filteredCategories = categories.filter((category) => {
    if (!category) return false;

    const matchesSearch = searchTerm === '' ||
      (category.name && category.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  const columns = [
    {
      key: 'name',
      header: t('customerCategories.columns.categoryName'),
      render: (value: any, category: CustomerCategory) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <Tag className="h-5 w-5 text-primary-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="font-medium text-secondary-900">{category.name || 'Unknown Category'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: t('customerCategories.columns.created'),
      render: (value: any, category: CustomerCategory) => (
        <span className="text-sm text-secondary-900">
          {category?.createdAt ? new Date(category.createdAt).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('customerCategories.columns.actions'),
      render: (value: any, category: CustomerCategory) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(category)}
            disabled={actionLoading === category?.uuid || !category}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(category)}
            disabled={actionLoading === category?.uuid || !category}
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
            <h1 className="text-2xl font-bold text-secondary-900">{t('customerCategories.title')}</h1>
            <p className="text-secondary-600">{t('customerCategories.subtitle')}</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('customerCategories.addCategory')}
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
                  placeholder={t('customerCategories.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Categories Table */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-secondary-900">
                {t('customerCategories.allCategories')} ({filteredCategories.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-12">
                <Tag className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">{t('customerCategories.empty.title')}</h3>
                <p className="mt-1 text-sm text-secondary-500">
                  {searchTerm ? t('customerCategories.empty.description') : t('customerCategories.empty.noData')}
                </p>
                {!searchTerm && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('customerCategories.addCategory')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Table
                columns={columns}
                data={filteredCategories}
                loading={loading}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateCustomerCategoryModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditCustomerCategoryModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCategory(null);
        }}
        onSuccess={handleEditSuccess}
        category={selectedCategory}
      />
    </Layout>
  );
};

export default CustomerCategories;
