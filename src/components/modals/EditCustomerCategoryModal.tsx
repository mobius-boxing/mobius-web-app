import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CustomerCategory, CreateCustomerCategoryForm } from '../../types';
import { customerCategoriesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import ErrorMessage from '../ui/ErrorMessage';
import ModalFooter from '../ui/ModalFooter';
import { useModalForm } from '../../hooks/useModalForm';

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

  const {
    form: {
      register,
      handleSubmit: formSubmit,
      formState: { errors },
      reset,
    },
    loading,
    error,
    handleSubmit,
    handleClose,
  } = useModalForm<CreateCustomerCategoryForm>({
    onSuccess,
    onClose,
  });

  useEffect(() => {
    if (isOpen && category) {
      reset({
        name: category.name,
      });
    }
  }, [isOpen, category, reset]);

  if (!category) return null;

  const onSubmit = handleSubmit((data) =>
    customerCategoriesApi.updateCategory(category.uuid, data)
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('customerCategories.editTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

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

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('customerCategories.updateButton')}
        />
      </form>
    </Modal>
  );
};

export default EditCustomerCategoryModal;
