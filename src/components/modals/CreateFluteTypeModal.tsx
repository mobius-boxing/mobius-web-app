import React from 'react';
import useEffectiveCompany from '../../hooks/useEffectiveCompany';
import { useTranslation } from 'react-i18next';
import { CreateFluteTypeForm } from '../../types';
import { fluteTypesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { useModalForm } from '../../hooks/useModalForm';
import { createFluteTypeSchema } from '../../validation/schemas/fluteType';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';

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
  const { effectiveCompanyId } = useEffectiveCompany();
  const { t } = useTranslation();

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
  } = useModalForm<CreateFluteTypeForm>({
    onSuccess,
    onClose,
    schema: createFluteTypeSchema(t),
  });

  // No hand-rolled Number() block: the schema already emits numbers, and an
  // empty numeric input arrives as `undefined` instead of NaN.
  const onSubmit = handleSubmit((data) =>
    fluteTypesApi.createFluteType({
      ...data,
      ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}),
    })
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('fluteTypes.createTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <Input
          {...register('code')}
          label={t('fluteTypes.code')}
          placeholder={t('fluteTypes.codePlaceholder')}
          error={errors.code?.message as string}
        />

        <div>
          <label className="gd-label">
            {t('fluteTypes.description')}
          </label>
          <textarea
            {...register('description')}
            data-testid="fluteType-description"
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

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('fluteTypes.createButton')}
        />
      </form>
    </Modal>
  );
};

export default CreateFluteTypeModal;
