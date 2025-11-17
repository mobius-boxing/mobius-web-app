import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { CreateCustomerCategoryForm, Company } from '../../types';
import { customerCategoriesApi, companiesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface CreateCustomerCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CreateCustomerCategoryFormWithCompany extends CreateCustomerCategoryForm {
  companyId?: string;
}

const CreateCustomerCategoryModal: React.FC<CreateCustomerCategoryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user: currentUser } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateCustomerCategoryFormWithCompany>();

  useEffect(() => {
    if (isOpen && currentUser?.role === 'superAdmin') {
      fetchCompanies();
    }
  }, [isOpen, currentUser]);

  const fetchCompanies = async () => {
    try {
      const companiesData = await companiesApi.getCompanies();
      setCompanies(companiesData.data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const onSubmit = async (data: CreateCustomerCategoryFormWithCompany) => {
    setLoading(true);
    setError('');

    try {
      // Determine companyId based on user role
      let companyId: string | undefined;

      if (currentUser?.role === 'superAdmin') {
        // SuperAdmin must select a company
        companyId = data.companyId;
      } else {
        // Regular admin uses their own company
        companyId = currentUser?.companyId;
      }

      const categoryData = {
        ...data,
        companyId,
      };

      await customerCategoriesApi.createCategory(categoryData);
      reset();
      onSuccess();
    } catch (err: any) {
      console.error('Error creating customer category:', err);
      setError(
        err.response?.data?.message ||
        'Failed to create customer category. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Customer Category">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <Input
          {...register('name', {
            required: 'Category name is required',
            minLength: {
              value: 2,
              message: 'Category name must be at least 2 characters',
            },
            maxLength: {
              value: 100,
              message: 'Category name must be less than 100 characters',
            },
          })}
          label="Category Name"
          placeholder="Enter category name"
          error={errors.name?.message as string}
        />

        {currentUser?.role === 'superAdmin' && (
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Company
            </label>
            <select
              {...register('companyId', { required: 'Company is required' })}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select a company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            {errors.companyId && (
              <p className="mt-1 text-sm text-red-600">{errors.companyId.message as string}</p>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create Category
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateCustomerCategoryModal;
