import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Corrugation, CreateCorrugationForm, CorrugationClass } from '../../types';
import { corrugationsApi, corrugationClassesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import ErrorMessage from '../ui/ErrorMessage';
import ModalFooter from '../ui/ModalFooter';
import { useModalForm } from '../../hooks/useModalForm';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';

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
  const { effectiveCompanyId } = useEffectiveCompany();
  const [corrugationClasses, setCorrugationClasses] = useState<CorrugationClass[]>([]);
  const [dropdownsLoaded, setDropdownsLoaded] = useState(false);

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
  } = useModalForm<CreateCorrugationForm>({
    onSuccess,
    onClose,
  });

  useEffect(() => {
    if (isOpen && corrugation) {
      setDropdownsLoaded(false);
      fetchCorrugationClasses();
    }
  }, [isOpen, corrugation, effectiveCompanyId]);

  useEffect(() => {
    if (isOpen && corrugation && dropdownsLoaded) {
      reset({
        code: corrugation.code,
        description: corrugation.description || '',
        theoreticalGrammage: corrugation.theoreticalGrammage,
        suggestedWidth: corrugation.suggestedWidth,
        caliper: corrugation.caliper,
        // SECURITY: Use corrugation class UUID from related object, not numeric ID
        corrugationClassUuid: corrugation.corrugationClass?.uuid || '',
      });
    }
  }, [isOpen, corrugation, dropdownsLoaded, reset]);

  const fetchCorrugationClasses = async () => {
    try {
      const companyFilter = effectiveCompanyId ? { companyId: effectiveCompanyId } : {};
      const response = await corrugationClassesApi.getCorrugationClasses({ limit: 100, ...companyFilter });
      setCorrugationClasses(response.data || []);
    } catch (error) {
      console.error('Error fetching corrugation classes:', error);
    } finally {
      setDropdownsLoaded(true);
    }
  };

  if (!corrugation) return null;

  const onSubmit = handleSubmit(async (data) => {
    const submitData = {
      ...data,
      theoreticalGrammage: data.theoreticalGrammage ? Number(data.theoreticalGrammage) : undefined,
      suggestedWidth: data.suggestedWidth ? Number(data.suggestedWidth) : undefined,
      caliper: data.caliper ? Number(data.caliper) : undefined,
      // SECURITY: Send UUID, not numeric ID
      corrugationClassUuid: data.corrugationClassUuid || undefined,
    };
    // SECURITY: Use corrugation UUID, not numeric ID
    await corrugationsApi.updateCorrugation(corrugation.uuid, submitData);
  });

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('corrugations.editTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

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
            {...register('corrugationClassUuid')}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">{t('corrugations.selectCorrugationClass')}</option>
            {corrugationClasses.map((cc) => (
              <option key={cc.uuid} value={cc.uuid}>
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

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('corrugations.updateButton')}
        />
      </form>
    </Modal>
  );
};

export default EditCorrugationModal;
