import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ColorType, CreateColorForm } from '../../types';
import { colorsApi, colorTypesApi } from '../../services/api';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import { useModalForm } from '../../hooks/useModalForm';
import { createColorSchema } from '../../validation/schemas/color';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';
import { logger } from '../../utils/logger';

interface CreateColorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateColorModal: React.FC<CreateColorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [colorTypes, setColorTypes] = useState<ColorType[]>([]);

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
  } = useModalForm<CreateColorForm>({
    defaultValues: {},
    onSuccess,
    onClose,
    schema: createColorSchema(t),
  });

  useEffect(() => {
    if (!isOpen) return;
    colorTypesApi
      .getColorTypes({ limit: 100, ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}) })
      .then((res) => setColorTypes(res.data))
      .catch((err) => logger.error('Error loading color types:', err));
  }, [isOpen, effectiveCompanyId]);

  const onSubmit = handleSubmit((data) =>
    colorsApi.createColor({
      ...data,
      colorTypeUuid: data.colorTypeUuid || undefined,
      companyId: effectiveCompanyId,
    })
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('colors.createTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <div>
          <label className="gd-label">
            {t('colors.code')} *
          </label>
          <Input
            {...register('code')}
            placeholder={t('colors.codePlaceholder')}
            error={errors.code?.message}
          />
        </div>

        <div>
          <label className="gd-label">
            {t('colors.name')}
          </label>
          <Input {...register('name')} error={errors.name?.message as string} placeholder={t('colors.namePlaceholder')} />
        </div>

        <div>
          <label className="gd-label">
            {t('colors.description')}
          </label>
          <Input {...register('description')} error={errors.description?.message as string} placeholder={t('colors.descriptionPlaceholder')} />
        </div>

        <div>
          <label className="gd-label">
            {t('colors.observations')}
          </label>
          <Input {...register('observations')} error={errors.observations?.message as string} placeholder={t('colors.observationsPlaceholder')} />
        </div>

        <div>
          <label className="gd-label">
            {t('colors.tonality')}
          </label>
          <Input
            type="number"
            {...register('tonality')}
            error={errors.tonality?.message as string}
            placeholder={t('colors.tonalityPlaceholder')}
          />
        </div>

        <div>
          <label className="gd-label">
            {t('colors.colorType')}
          </label>
          <select
            {...register('colorTypeUuid')}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('colors.selectColorType')}</option>
            {colorTypes.map((ct) => (
              <option key={ct.uuid} value={ct.uuid}>
                {ct.name}
              </option>
            ))}
          </select>
          {errors.colorTypeUuid && (
            <p className="mt-1 text-sm text-red-600">{errors.colorTypeUuid.message as string}</p>
          )}
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('colors.createButton')}
        />
      </form>
    </Modal>
  );
};

export default CreateColorModal;
