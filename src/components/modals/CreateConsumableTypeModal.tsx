import React from 'react';
import useEffectiveCompany from '../../hooks/useEffectiveCompany';
import { useTranslation } from 'react-i18next';
import { CreateConsumableTypeForm } from '../../types';
import { consumableTypesApi } from '../../services/api';
import { useModalForm } from '../../hooks/useModalForm';
import { createConsumableTypeSchema } from '../../validation/schemas/consumableType';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';

interface CreateConsumableTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateConsumableTypeModal: React.FC<CreateConsumableTypeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { effectiveCompanyId } = useEffectiveCompany();
  const { t } = useTranslation();

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
  } = useModalForm<CreateConsumableTypeForm>({
    onSuccess,
    onClose,
    schema: createConsumableTypeSchema(t),
  });

  const onSubmit = handleSubmit((data) => consumableTypesApi.createConsumableType({ ...data, ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}) }));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('consumableTypes.createTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <Input
          {...register('code')}
          label={t('consumableTypes.code')}
          placeholder={t('consumableTypes.codePlaceholder')}
          error={errors.code?.message as string}
        />

        <Input
          {...register('name')}
          label={t('consumableTypes.name')}
          placeholder={t('consumableTypes.namePlaceholder')}
          error={errors.name?.message as string}
        />

        <div className="flex items-center">
          <input
            type="checkbox"
            id="autoConsumption"
            {...register('autoConsumption')}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
          />
          <label htmlFor="autoConsumption" className="ml-2 block text-sm text-secondary-700">
            {t('consumableTypes.autoConsumption')}
          </label>
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('consumableTypes.createButton')}
        />
      </form>
    </Modal>
  );
};

export default CreateConsumableTypeModal;
