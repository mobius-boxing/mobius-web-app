import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Corrugation, CreateCorrugationForm, CorrugationClass } from '../../types';
import { corrugationsApi, corrugationClassesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface EditCorrugationModalProps {
  isOpen: boolean;
  onClose: () => void;
  corrugation: Corrugation | null;
  onSuccess: () => void;
}

const EditCorrugationModal: React.FC<EditCorrugationModalProps> = ({
  isOpen,
  onClose,
  corrugation,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [corrugationClasses, setCorrugationClasses] = useState<CorrugationClass[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CreateCorrugationForm>();

  useEffect(() => {
    if (isOpen) {
      fetchCorrugationClasses();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && corrugation) {
      setValue('code', corrugation.code);
      setValue('description', corrugation.description || '');
      setValue('theoreticalGrammage', corrugation.theoreticalGrammage);
      setValue('suggestedWidth', corrugation.suggestedWidth);
      setValue('caliper', corrugation.caliper);
      setValue('corrugationClassId', corrugation.corrugationClassId);
    }
  }, [isOpen, corrugation, setValue]);

  const fetchCorrugationClasses = async () => {
    try {
      const response = await corrugationClassesApi.getCorrugationClasses({ limit: 100 });
      setCorrugationClasses(response.data || []);
    } catch (error) {
      console.error('Error fetching corrugation classes:', error);
    }
  };

  const onSubmit = async (data: CreateCorrugationForm) => {
    if (!corrugation) return;

    setLoading(true);
    setError('');

    try {
      const submitData = {
        ...data,
        theoreticalGrammage: data.theoreticalGrammage ? Number(data.theoreticalGrammage) : undefined,
        suggestedWidth: data.suggestedWidth ? Number(data.suggestedWidth) : undefined,
        caliper: data.caliper ? Number(data.caliper) : undefined,
        corrugationClassId: data.corrugationClassId ? Number(data.corrugationClassId) : undefined,
      };
      await corrugationsApi.updateCorrugation(corrugation.id, submitData);
      reset();
      onSuccess();
    } catch (err: any) {
      console.error('Error updating corrugation:', err);
      setError(
        err.response?.data?.message ||
        t('corrugations.updateFailed')
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

  if (!corrugation) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('corrugations.editTitle')}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <Input
          {...register('code', {
            required: t('corrugations.validation.codeRequired'),
            minLength: {
              value: 1,
              message: t('corrugations.validation.codeMinLength'),
            },
            maxLength: {
              value: 50,
              message: t('corrugations.validation.codeMaxLength'),
            },
          })}
          label={t('corrugations.code')}
          placeholder={t('corrugations.codePlaceholder')}
          error={errors.code?.message as string}
        />

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('corrugations.description')}
          </label>
          <textarea
            {...register('description')}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('corrugations.descriptionPlaceholder')}
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('corrugations.corrugationClass')}
          </label>
          <select
            {...register('corrugationClassId')}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">{t('corrugations.selectCorrugationClass')}</option>
            {corrugationClasses.map((cc) => (
              <option key={cc.id} value={cc.id}>
                {cc.code}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            {...register('theoreticalGrammage')}
            type="number"
            step="0.01"
            label={t('corrugations.theoreticalGrammage')}
            placeholder={t('corrugations.theoreticalGrammagePlaceholder')}
          />

          <Input
            {...register('suggestedWidth')}
            type="number"
            step="0.01"
            label={t('corrugations.suggestedWidth')}
            placeholder={t('corrugations.suggestedWidthPlaceholder')}
          />

          <Input
            {...register('caliper')}
            type="number"
            step="0.0001"
            label={t('corrugations.caliper')}
            placeholder={t('corrugations.caliperPlaceholder')}
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
            {t('corrugations.updateButton')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditCorrugationModal;
