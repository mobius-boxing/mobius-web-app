import React from 'react';
import { useTranslation } from 'react-i18next';
import { CreateToolingTypeForm } from '../../types';
import { toolingTypesApi } from '../../services/api';
import { useModalForm } from '../../hooks/useModalForm';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';

interface CreateToolingTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateToolingTypeModal: React.FC<CreateToolingTypeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
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
  } = useModalForm<CreateToolingTypeForm>({
    onSuccess,
    onClose,
  });

  const onSubmit = handleSubmit((data) => toolingTypesApi.createToolingType(data));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('toolingTypes.createTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <Input
          {...register('code', {
            required: t('toolingTypes.validation.codeRequired'),
            minLength: {
              value: 1,
              message: t('toolingTypes.validation.codeMinLength'),
            },
            maxLength: {
              value: 50,
              message: t('toolingTypes.validation.codeMaxLength'),
            },
          })}
          label={t('toolingTypes.code')}
          placeholder={t('toolingTypes.codePlaceholder')}
          error={errors.code?.message as string}
        />

        <Input
          {...register('name', {
            required: t('toolingTypes.validation.nameRequired'),
            minLength: {
              value: 1,
              message: t('toolingTypes.validation.nameMinLength'),
            },
            maxLength: {
              value: 255,
              message: t('toolingTypes.validation.nameMaxLength'),
            },
          })}
          label={t('toolingTypes.name')}
          placeholder={t('toolingTypes.namePlaceholder')}
          error={errors.name?.message as string}
        />

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('toolingTypes.description')}
          </label>
          <textarea
            {...register('description')}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('toolingTypes.descriptionPlaceholder')}
            rows={3}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message as string}</p>
          )}
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="automaticConsumption"
            {...register('automaticConsumption')}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
          />
          <label htmlFor="automaticConsumption" className="ml-2 block text-sm text-secondary-700">
            {t('toolingTypes.automaticConsumption')}
          </label>
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('toolingTypes.createButton')}
        />
      </form>
    </Modal>
  );
};

export default CreateToolingTypeModal;
