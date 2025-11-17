import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CustomerCategory, CreateCustomerCategoryForm } from '../../types';
import { customerCategoriesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface EditCustomerCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: CustomerCategory | null;
  onSuccess: () => void;
}

const EditCustomerCategoryModal: React.FC<EditCustomerCategoryModalProps> = ({
  isOpen,
  onClose,
  category,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CreateCustomerCategoryForm>();

  useEffect(() => {
    if (isOpen && category) {
      setValue('name', category.name);
    }
  }, [isOpen, category, setValue]);

  const onSubmit = async (data: CreateCustomerCategoryForm) => {
    if (!category) return;

    setLoading(true);
    setError('');

    try {
      await customerCategoriesApi.updateCategory(category.id, data);
      reset();
      onSuccess();
    } catch (err: any) {
      console.error('Error updating customer category:', err);
      setError(
        err.response?.data?.message ||
        'Failed to update customer category. Please try again.'
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

  if (!category) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Customer Category">
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
            Update Category
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditCustomerCategoryModal;
