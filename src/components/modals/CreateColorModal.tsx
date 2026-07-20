import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ColorType, CreateColorForm } from '../../types';
import { colorsApi, colorTypesApi } from '../../services/api';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import { useModalForm } from '../../hooks/useModalForm';
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
      tonality: data.tonality !== undefined && data.tonality !== null && `${data.tonality}` !== '' ? Number(data.tonality) : undefined,
      colorTypeUuid: data.colorTypeUuid || undefined,
      companyId: effectiveCompanyId,
    })
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('colors.createTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('colors.code')} *
          </label>
          <Input
            {...register('code', {
              required: t('colors.validation.codeRequired'),
            })}
            placeholder={t('colors.codePlaceholder')}
            error={errors.code?.message}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('colors.name')}
          </label>
          <Input {...register('name')} placeholder={t('colors.namePlaceholder')} />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('colors.description')}
          </label>
          <Input {...register('description')} placeholder={t('colors.descriptionPlaceholder')} />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('colors.observations')}
          </label>
          <Input {...register('observations')} placeholder={t('colors.observationsPlaceholder')} />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('colors.tonality')}
          </label>
          <Input
            type="number"
            {...register('tonality')}
            placeholder={t('colors.tonalityPlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
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
