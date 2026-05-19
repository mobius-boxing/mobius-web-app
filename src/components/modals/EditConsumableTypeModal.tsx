import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ConsumableType, CreateConsumableTypeForm } from '../../types';
import { consumableTypesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import ErrorMessage from '../ui/ErrorMessage';
import ModalFooter from '../ui/ModalFooter';
import { useModalForm } from '../../hooks/useModalForm';

interface EditConsumableTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  consumableType: ConsumableType | null;
  onSuccess: () => void;
}

const EditConsumableTypeModal: React.FC<EditConsumableTypeModalProps> = ({
  isOpen,
  onClose,
  consumableType,
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
  } = useModalForm<CreateConsumableTypeForm>({
    onSuccess,
    onClose,
  });

  useEffect(() => {
    if (isOpen && consumableType) {
      reset({
        code: consumableType.code,
        name: consumableType.name,
        autoConsumption: consumableType.autoConsumption || false,
      });
    }
  }, [isOpen, consumableType, reset]);

  if (!consumableType) return null;

  const onSubmit = handleSubmit((data) =>
    consumableTypesApi.updateConsumableType(consumableType.uuid, data)
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('consumableTypes.editTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <Input
          {...register('code', {
            required: t('consumableTypes.validation.codeRequired'),
            minLength: {
              value: 1,
              message: t('consumableTypes.validation.codeMinLength'),
            },
            maxLength: {
              value: 50,
              message: t('consumableTypes.validation.codeMaxLength'),
            },
          })}
          label={t('consumableTypes.code')}
          placeholder={t('consumableTypes.codePlaceholder')}
          error={errors.code?.message as string}
        />

        <Input
          {...register('name', {
            required: t('consumableTypes.validation.nameRequired'),
            minLength: {
              value: 1,
              message: t('consumableTypes.validation.nameMinLength'),
            },
            maxLength: {
              value: 255,
              message: t('consumableTypes.validation.nameMaxLength'),
            },
          })}
          label={t('consumableTypes.name')}
          placeholder={t('consumableTypes.namePlaceholder')}
          error={errors.name?.message as string}
        />

        <div className="flex items-center">
          <input
            type="checkbox"
            id="editAutoConsumption"
            {...register('autoConsumption')}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
          />
          <label htmlFor="editAutoConsumption" className="ml-2 block text-sm text-secondary-700">
            {t('consumableTypes.autoConsumption')}
          </label>
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('consumableTypes.updateButton')}
        />
      </form>
    </Modal>
  );
};

export default EditConsumableTypeModal;
