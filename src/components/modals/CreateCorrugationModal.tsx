import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
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
import { useModalForm } from '../../hooks/useModalForm';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import { logger } from '../../utils/logger';

interface CreateCorrugationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateCorrugationModal: React.FC<CreateCorrugationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [corrugationClasses, setCorrugationClasses] = useState<CorrugationClass[]>([]);
  const [paperClasses, setPaperClasses] = useState<PaperClass[]>([]);
  const [fluteTypes, setFluteTypes] = useState<FluteType[]>([]);
  const [layers, setLayers] = useState<CorrugationLayerInput[]>([]);

  const {
    form: {
      register,
      handleSubmit: formSubmit,
      formState: { errors },
    },
    loading,
    error,
    handleSubmit,
    handleClose: modalHandleClose,
  } = useModalForm<CreateCorrugationForm>({
    onSuccess,
    onClose,
  });

  useEffect(() => {
    if (isOpen) {
      // Reset the layer stack on every open — a successful create closes the
      // modal via onSuccess without unmounting it, so stale layers would
      // otherwise leak into the next corrugation.
      setLayers([]);
      fetchCorrugationClasses();
    }
  }, [isOpen, effectiveCompanyId]);

  const fetchCorrugationClasses = async () => {
    try {
      const companyFilter = effectiveCompanyId ? { companyId: effectiveCompanyId } : {};
      const [classesRes, paperClassesRes, fluteTypesRes] = await Promise.all([
        corrugationClassesApi.getCorrugationClasses({ limit: 100, ...companyFilter }),
        paperClassesApi.getPaperClasses({ limit: 100, ...companyFilter }),
        fluteTypesApi.getFluteTypes({ limit: 100, ...companyFilter }),
      ]);
      setCorrugationClasses(classesRes.data || []);
      setPaperClasses(paperClassesRes.data || []);
      setFluteTypes(fluteTypesRes.data || []);
    } catch (error) {
      logger.error('Error fetching corrugation classes:', error);
    }
  };

  const onSubmit = handleSubmit((data) => {
    const submitData = {
      ...data,
      theoreticalGrammage: data.theoreticalGrammage ? Number(data.theoreticalGrammage) : undefined,
      suggestedWidth: data.suggestedWidth ? Number(data.suggestedWidth) : undefined,
      caliper: data.caliper ? Number(data.caliper) : undefined,
      // SECURITY: Send UUID, not numeric ID
      corrugationClassUuid: data.corrugationClassUuid || undefined,
      layers,
      // superAdmin operating-as: the backend resolves this body companyId;
      // regular users' company always comes from their JWT instead.
      ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}),
    };
    return corrugationsApi.createCorrugation(submitData);
  });

  const handleModalClose = () => {
    setLayers([]);
    modalHandleClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleModalClose} title={t('corrugations.createTitle')} size="xl">
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

        <CorrugationLayersEditor
          layers={layers}
          onChange={setLayers}
          paperClasses={paperClasses}
          fluteTypes={fluteTypes}
        />

        <ModalFooter
          loading={loading}
          onCancel={handleModalClose}
          submitText={t('corrugations.createButton')}
        />
      </form>
    </Modal>
  );
};

export default CreateCorrugationModal;
