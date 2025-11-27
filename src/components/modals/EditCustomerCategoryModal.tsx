import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      await customerCategoriesApi.updateCategory(category.uuid, data);
      reset();
      onSuccess();
    } catch (err: any) {
      console.error('Error updating customer category:', err);
      setError(
        err.response?.data?.message ||
        t('customerCategories.errors.updateFailed')
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
    <Modal isOpen={isOpen} onClose={handleClose} title={t('customerCategories.editTitle')}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <Input
          {...register('name', {
            required: t('customerCategories.validation.nameRequired'),
            minLength: {
              value: 2,
              message: t('customerCategories.validation.nameMinLength'),
            },
            maxLength: {
              value: 100,
              message: t('customerCategories.validation.nameMaxLength'),
            },
          })}
          label={t('customerCategories.name')}
          placeholder={t('customerCategories.namePlaceholder')}
          error={errors.name?.message as string}
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            {t('customerCategories.cancel')}
          </Button>
          <Button type="submit" loading={loading}>
            {t('customerCategories.updateButton')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditCustomerCategoryModal;
