import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ToolingType, CreateToolingTypeForm } from '../../types';
import { toolingTypesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import ErrorMessage from '../ui/ErrorMessage';
import ModalFooter from '../ui/ModalFooter';
import { useModalForm } from '../../hooks/useModalForm';

interface EditToolingTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolingType: ToolingType | null;
  onSuccess: () => void;
}

const EditToolingTypeModal: React.FC<EditToolingTypeModalProps> = ({
  isOpen,
  onClose,
  toolingType,
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
  } = useModalForm<CreateToolingTypeForm>({
    onSuccess,
    onClose,
  });

  useEffect(() => {
    if (isOpen && toolingType) {
      reset({
        code: toolingType.code,
        name: toolingType.name,
        description: toolingType.description || '',
        automaticConsumption: toolingType.automaticConsumption || false,
      });
    }
  }, [isOpen, toolingType, reset]);

  if (!toolingType) return null;

  const onSubmit = handleSubmit((data) =>
    toolingTypesApi.updateToolingType(toolingType.uuid, data)
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('toolingTypes.editTitle')}>
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
            id="editAutomaticConsumption"
            {...register('automaticConsumption')}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
          />
          <label htmlFor="editAutomaticConsumption" className="ml-2 block text-sm text-secondary-700">
            {t('toolingTypes.automaticConsumption')}
          </label>
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('toolingTypes.updateButton')}
        />
      </form>
    </Modal>
  );
};

export default EditToolingTypeModal;
