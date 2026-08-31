import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Color, ColorType, CreateColorForm } from '../../types';
import { colorsApi, colorTypesApi } from '../../services/api';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import ErrorMessage from '../ui/ErrorMessage';
import ModalFooter from '../ui/ModalFooter';
import { useModalForm } from '../../hooks/useModalForm';
import { editColorSchema } from '../../validation/schemas/color';
import { logger } from '../../utils/logger';

interface EditColorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  color: Color | null;
}

const EditColorModal: React.FC<EditColorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  color,
}) => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const [colorTypes, setColorTypes] = useState<ColorType[]>([]);

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
  } = useModalForm<CreateColorForm>({
    onSuccess,
    onClose,
    schema: editColorSchema(t),
  });

  useEffect(() => {
    if (!isOpen) return;
    colorTypesApi
      .getColorTypes({ limit: 100, ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}) })
      .then((res) => setColorTypes(res.data))
      .catch((err) => logger.error('Error loading color types:', err));
  }, [isOpen, effectiveCompanyId]);

  useEffect(() => {
    if (isOpen && color) {
      reset({
        code: color.code,
        name: color.name,
        description: color.description,
        observations: color.observations,
        tonality: color.tonality ?? undefined,
        colorTypeUuid: undefined,
      });
    }
  }, [isOpen, color, reset]);

  if (!color) return null;

  const onSubmit = handleSubmit((data) =>
    colorsApi.updateColor(color.uuid, {
      ...data,
      colorTypeUuid: data.colorTypeUuid || undefined,
    })
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('colors.editTitle')}>
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
          submitText={t('colors.updateButton')}
        />
      </form>
    </Modal>
  );
};

export default EditColorModal;
