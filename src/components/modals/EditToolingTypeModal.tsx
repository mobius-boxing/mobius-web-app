import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ToolingType, CreateToolingTypeForm } from '../../types';
import { toolingTypesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CreateToolingTypeForm>();

  useEffect(() => {
    if (isOpen && toolingType) {
      setValue('code', toolingType.code);
      setValue('name', toolingType.name);
      setValue('description', toolingType.description || '');
      setValue('automaticConsumption', toolingType.automaticConsumption || false);
    }
  }, [isOpen, toolingType, setValue]);

  const onSubmit = async (data: CreateToolingTypeForm) => {
    if (!toolingType) return;

    setLoading(true);
    setError('');

    try {
      await toolingTypesApi.updateToolingType(toolingType.uuid, data);
      reset();
      onSuccess();
    } catch (err: any) {
      console.error('Error updating tooling type:', err);
      setError(
        err.response?.data?.message ||
        t('toolingTypes.updateFailed')
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

  if (!toolingType) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('toolingTypes.editTitle')}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

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

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={loading}>
            {t('toolingTypes.updateButton')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditToolingTypeModal;
