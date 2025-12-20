import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { CorrugationClass, CreateCorrugationClassForm } from '../../types';
import { corrugationClassesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface EditCorrugationClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  corrugationClass: CorrugationClass | null;
  onSuccess: () => void;
}

const EditCorrugationClassModal: React.FC<EditCorrugationClassModalProps> = ({
  isOpen,
  onClose,
  corrugationClass,
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
  } = useForm<CreateCorrugationClassForm>();

  useEffect(() => {
    if (isOpen && corrugationClass) {
      setValue('code', corrugationClass.code);
      setValue('description', corrugationClass.description || '');
    }
  }, [isOpen, corrugationClass, setValue]);

  const onSubmit = async (data: CreateCorrugationClassForm) => {
    if (!corrugationClass) return;

    setLoading(true);
    setError('');

    try {
      // SECURITY: Use UUID, not numeric ID
      await corrugationClassesApi.updateCorrugationClass(corrugationClass.uuid, data);
      reset();
      onSuccess();
    } catch (err: any) {
      console.error('Error updating corrugation class:', err);
      setError(
        err.response?.data?.message ||
        t('corrugationClasses.updateFailed')
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

  if (!corrugationClass) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('corrugationClasses.editTitle')}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <Input
          {...register('code', {
            required: t('corrugationClasses.validation.codeRequired'),
            minLength: {
              value: 1,
              message: t('corrugationClasses.validation.codeMinLength'),
            },
            maxLength: {
              value: 50,
              message: t('corrugationClasses.validation.codeMaxLength'),
            },
          })}
          label={t('corrugationClasses.code')}
          placeholder={t('corrugationClasses.codePlaceholder')}
          error={errors.code?.message as string}
        />

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('corrugationClasses.description')}
          </label>
          <textarea
            {...register('description')}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('corrugationClasses.descriptionPlaceholder')}
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
            {t('corrugationClasses.updateButton')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditCorrugationClassModal;
