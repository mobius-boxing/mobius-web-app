import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import { CreateCustomerCategoryForm } from '../../types';
import { customerCategoriesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface CreateCustomerCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateCustomerCategoryModal: React.FC<CreateCustomerCategoryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateCustomerCategoryForm>();

  const onSubmit = async (data: CreateCustomerCategoryForm) => {
    setLoading(true);
    setError('');

    try {
      const categoryData = {
        ...data,
        companyId: effectiveCompanyId,
      };

      await customerCategoriesApi.createCategory(categoryData);
      reset();
      onSuccess();
    } catch (err: any) {
      console.error('Error creating customer category:', err);
      setError(
        err.response?.data?.message ||
        t('customerCategories.errors.createFailed')
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
    <Modal isOpen={isOpen} onClose={handleClose} title={t('customerCategories.createTitle')}>
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
            {t('customerCategories.createButton')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateCustomerCategoryModal;
