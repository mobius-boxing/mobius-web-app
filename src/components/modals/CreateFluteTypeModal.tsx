import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { CreateFluteTypeForm } from '../../types';
import { fluteTypesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface CreateFluteTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateFluteTypeModal: React.FC<CreateFluteTypeModalProps> = ({
  isOpen,
  onClose,
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
  } = useForm<CreateFluteTypeForm>();

  const onSubmit = async (data: CreateFluteTypeForm) => {
    setLoading(true);
    setError('');

    try {
      // Convert string values to numbers for numeric fields
      const formData = {
        ...data,
        fluteFactor: data.fluteFactor ? Number(data.fluteFactor) : undefined,
        length: data.length ? Number(data.length) : undefined,
        width: data.width ? Number(data.width) : undefined,
        height: data.height ? Number(data.height) : undefined,
      };

      await fluteTypesApi.createFluteType(formData);
      reset();
      onSuccess();
    } catch (err: any) {
      console.error('Error creating flute type:', err);
      setError(
        err.response?.data?.message ||
        'Failed to create flute type. Please try again.'
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
    <Modal isOpen={isOpen} onClose={handleClose} title={t('fluteTypes.createTitle')}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <Input
          {...register('code', {
            required: 'Code is required',
            minLength: {
              value: 1,
              message: 'Code must be at least 1 character',
            },
            maxLength: {
              value: 50,
              message: 'Code must be less than 50 characters',
            },
          })}
          label={t('fluteTypes.code')}
          placeholder={t('fluteTypes.codePlaceholder')}
          error={errors.code?.message as string}
        />

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('fluteTypes.description')}
          </label>
          <textarea
            {...register('description')}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('fluteTypes.descriptionPlaceholder')}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            {...register('fluteFactor')}
            type="number"
            step="0.01"
            label={t('fluteTypes.fluteFactor')}
            placeholder={t('fluteTypes.fluteFactorPlaceholder')}
            error={errors.fluteFactor?.message as string}
          />

          <Input
            {...register('length')}
            type="number"
            step="0.01"
            label={t('fluteTypes.length')}
            placeholder={t('fluteTypes.lengthPlaceholder')}
            error={errors.length?.message as string}
          />

          <Input
            {...register('width')}
            type="number"
            step="0.01"
            label={t('fluteTypes.width')}
            placeholder={t('fluteTypes.widthPlaceholder')}
            error={errors.width?.message as string}
          />

          <Input
            {...register('height')}
            type="number"
            step="0.01"
            label={t('fluteTypes.height')}
            placeholder={t('fluteTypes.heightPlaceholder')}
            error={errors.height?.message as string}
          />
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
            {t('fluteTypes.createButton')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateFluteTypeModal;
