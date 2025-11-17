import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { CreatePaperTypeForm } from '../../types';
import { paperTypesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface CreatePaperTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreatePaperTypeModal: React.FC<CreatePaperTypeModalProps> = ({
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
  } = useForm<CreatePaperTypeForm>();

  const onSubmit = async (data: CreatePaperTypeForm) => {
    setLoading(true);
    setError('');

    try {
      await paperTypesApi.createPaperType(data);
      reset();
      onSuccess();
    } catch (err: any) {
      console.error('Error creating paper type:', err);
      setError(
        err.response?.data?.message ||
        'Failed to create paper type. Please try again.'
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
    <Modal isOpen={isOpen} onClose={handleClose} title={t('paperTypes.createTitle')}>
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
          label={t('paperTypes.code')}
          placeholder={t('paperTypes.codePlaceholder')}
          error={errors.code?.message as string}
        />

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('paperTypes.description')}
          </label>
          <textarea
            {...register('description')}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('paperTypes.descriptionPlaceholder')}
            rows={3}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message as string}</p>
          )}
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
            {t('paperTypes.createButton')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreatePaperTypeModal;
