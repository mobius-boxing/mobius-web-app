import React from 'react';
import { useTranslation } from 'react-i18next';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import { CreateCustomerCategoryForm } from '../../types';
import { customerCategoriesApi } from '../../services/api';
import { useModalForm } from '../../hooks/useModalForm';
import { createCustomerCategorySchema } from '../../validation/schemas/customerCategory';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';

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

  const {
    form: {
      register,
      handleSubmit: formSubmit,
      formState: { errors },
    },
    loading,
    error,
    handleSubmit,
    handleClose,
  } = useModalForm<CreateCustomerCategoryForm>({
    onSuccess,
    onClose,
    schema: createCustomerCategorySchema(t),
  });

  const onSubmit = handleSubmit((data) =>
    customerCategoriesApi.createCategory({
      ...data,
      companyId: effectiveCompanyId,
    })
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('customerCategories.createTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <Input
          {...register('name')}
          label={t('customerCategories.name')}
          placeholder={t('customerCategories.namePlaceholder')}
          error={errors.name?.message as string}
        />

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('customerCategories.createButton')}
        />
      </form>
    </Modal>
  );
};

export default CreateCustomerCategoryModal;
