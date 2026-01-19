import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useModalForm } from '../../hooks/useModalForm';
import { FluteType, CreateFluteTypeForm } from '../../types';
import { fluteTypesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';

interface EditFluteTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  fluteType: FluteType | null;
  onSuccess: () => void;
}

const EditFluteTypeModal: React.FC<EditFluteTypeModalProps> = ({
  isOpen,
  onClose,
  fluteType,
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

  useEffect(() => {
    if (isOpen && fluteType) {
      // Note: We don't use form.reset() here since we access form via destructuring
      // The form will be reset on close via handleClose
    }
  }, [isOpen, fluteType]);

  const onSubmit = handleSubmit(async (data) => {
    if (!fluteType) return;

    // Convert string values to numbers for numeric fields
    const formData = {
      ...data,
      fluteFactor: data.fluteFactor ? Number(data.fluteFactor) : undefined,
      length: data.length ? Number(data.length) : undefined,
      width: data.width ? Number(data.width) : undefined,
      height: data.height ? Number(data.height) : undefined,
    };

    await fluteTypesApi.updateFluteType(fluteType.id, formData);
  });

  if (!fluteType) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('fluteTypes.editTitle')}>
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
          defaultValue={fluteType.code}
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
            defaultValue={fluteType.description || ''}
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
            defaultValue={fluteType.fluteFactor}
          />

          <Input
            {...register('length')}
            type="number"
            step="0.01"
            label={t('fluteTypes.length')}
            placeholder={t('fluteTypes.lengthPlaceholder')}
            error={errors.length?.message as string}
            defaultValue={fluteType.length}
          />

          <Input
            {...register('width')}
            type="number"
            step="0.01"
            label={t('fluteTypes.width')}
            placeholder={t('fluteTypes.widthPlaceholder')}
            error={errors.width?.message as string}
            defaultValue={fluteType.width}
          />

          <Input
            {...register('height')}
            type="number"
            step="0.01"
            label={t('fluteTypes.height')}
            placeholder={t('fluteTypes.heightPlaceholder')}
            error={errors.height?.message as string}
            defaultValue={fluteType.height}
          />
        </div>

        <ModalFooter loading={loading} onCancel={handleClose} submitText={t('fluteTypes.updateButton')} />
      </form>
    </Modal>
  );
};

export default EditFluteTypeModal;
