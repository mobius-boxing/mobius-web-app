import React from 'react';
import { useTranslation } from 'react-i18next';
import { CreateFluteTypeForm } from '../../types';
import { fluteTypesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { useModalForm } from '../../hooks/useModalForm';
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
  });

  const onSubmit = handleSubmit((data) => {
    // Convert string values to numbers for numeric fields
    const formData = {
      ...data,
      fluteFactor: data.fluteFactor ? Number(data.fluteFactor) : undefined,
      length: data.length ? Number(data.length) : undefined,
      width: data.width ? Number(data.width) : undefined,
      height: data.height ? Number(data.height) : undefined,
    };
    return fluteTypesApi.createFluteType(formData);
  });

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('fluteTypes.createTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

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
          label={t('fluteTypes.code')}
          placeholder={t('fluteTypes.codePlaceholder')}
          error={errors.code?.message as string}
        />

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('fluteTypes.description')}
          </label>
          <textarea
            {...register('description')}
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
