import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Corrugation,
  CreateCorrugationForm,
  CorrugationClass,
  CorrugationLayerInput,
  PaperClass,
  FluteType,
} from '../../types';
import {
  corrugationsApi,
  corrugationClassesApi,
  paperClassesApi,
  fluteTypesApi,
} from '../../services/api';
import CorrugationLayersEditor from '../forms/CorrugationLayersEditor';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import ErrorMessage from '../ui/ErrorMessage';
import ModalFooter from '../ui/ModalFooter';
import { useModalForm } from '../../hooks/useModalForm';
import { editCorrugationSchema } from '../../validation/schemas/corrugation';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import { logger } from '../../utils/logger';

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
  const [paperClasses, setPaperClasses] = useState<PaperClass[]>([]);
  const [fluteTypes, setFluteTypes] = useState<FluteType[]>([]);
  const [layers, setLayers] = useState<CorrugationLayerInput[]>([]);
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
    schema: editCorrugationSchema(t),
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
      const [classesRes, paperClassesRes, fluteTypesRes, fullCorrugation] = await Promise.all([
        corrugationClassesApi.getCorrugationClasses({ limit: 100, ...companyFilter }),
        paperClassesApi.getPaperClasses({ limit: 100, ...companyFilter }),
        fluteTypesApi.getFluteTypes({ limit: 100, ...companyFilter }),
        // List rows don't carry layers — fetch the full record for the Capas stack.
        corrugation ? corrugationsApi.getCorrugationById(corrugation.uuid) : Promise.resolve(null),
      ]);
      setCorrugationClasses(classesRes.data || []);
      setPaperClasses(paperClassesRes.data || []);
      setFluteTypes(fluteTypesRes.data || []);
      setLayers(
        (fullCorrugation?.layers || []).map((layer) => ({
          position: layer.position,
          isLiner: layer.isLiner,
          paperClassUuid: layer.paperClass?.uuid,
          fluteTypeUuid: layer.fluteType?.uuid,
        })),
      );
    } catch (error) {
      logger.error('Error fetching corrugation classes:', error);
    } finally {
      setDropdownsLoaded(true);
    }
  };

  if (!corrugation) return null;

  const onSubmit = handleSubmit(async (data) => {
    const submitData = {
      ...data,
      // SECURITY: Send UUID, not numeric ID
      corrugationClassUuid: data.corrugationClassUuid || undefined,
      // Capas: replaced wholesale on save.
      layers,
    };
    // SECURITY: Use corrugation UUID, not numeric ID
    await corrugationsApi.updateCorrugation(corrugation.uuid, submitData);
  });

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('corrugations.editTitle')} size="xl">
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <Input
          {...register('code')}
          label={t('corrugations.code')}
          placeholder={t('corrugations.codePlaceholder')}
          error={errors.code?.message as string}
        />

        <div>
          <label className="gd-label">
            {t('corrugations.description')}
          </label>
          <textarea
            {...register('description')}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('corrugations.descriptionPlaceholder')}
            rows={3}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message as string}</p>
          )}
        </div>

        <div>
          <label className="gd-label">
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
          {errors.corrugationClassUuid && (
            <p className="mt-1 text-sm text-red-600">{errors.corrugationClassUuid.message as string}</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            {...register('theoreticalGrammage')}
            error={errors.theoreticalGrammage?.message as string}
            type="number"
            step="0.01"
            label={t('corrugations.theoreticalGrammage')}
            placeholder={t('corrugations.theoreticalGrammagePlaceholder')}
          />

          <Input
            {...register('suggestedWidth')}
            error={errors.suggestedWidth?.message as string}
            type="number"
            step="0.01"
            label={t('corrugations.suggestedWidth')}
            placeholder={t('corrugations.suggestedWidthPlaceholder')}
          />

          <Input
            {...register('caliper')}
            error={errors.caliper?.message as string}
            type="number"
            step="0.0001"
            label={t('corrugations.caliper')}
            placeholder={t('corrugations.caliperPlaceholder')}
          />
        </div>

        <CorrugationLayersEditor
          layers={layers}
          onChange={setLayers}
          paperClasses={paperClasses}
          fluteTypes={fluteTypes}
        />

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
