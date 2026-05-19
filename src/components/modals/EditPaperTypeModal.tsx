import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useModalForm } from '../../hooks/useModalForm';
import { PaperType, CreatePaperTypeForm } from '../../types';
import { paperTypesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';

interface EditPaperTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  paperType: PaperType | null;
  onSuccess: () => void;
}

const EditPaperTypeModal: React.FC<EditPaperTypeModalProps> = ({
  isOpen,
  onClose,
  paperType,
  onSuccess,
}) => {
  const { t } = useTranslation();

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
  } = useModalForm<CreatePaperTypeForm>({
    onSuccess,
    onClose,
  });

  useEffect(() => {
    if (isOpen && paperType) {
      reset({
        code: paperType.code,
        description: paperType.description || '',
      });
    }
  }, [isOpen, paperType, reset]);

  const onSubmit = handleSubmit(async (data) => {
    if (!paperType) return;
    await paperTypesApi.updatePaperType(paperType.uuid, data);
  });

  if (!paperType) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('paperTypes.editTitle')}>
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
          label={t('paperTypes.code')}
          placeholder={t('paperTypes.codePlaceholder')}
          error={errors.code?.message as string}
        />

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('paperTypes.description')}
          </label>
          <textarea
            {...register('description')}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('paperTypes.descriptionPlaceholder')}
            rows={3}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message as string}</p>
          )}
        </div>

        <ModalFooter loading={loading} onCancel={handleClose} submitText={t('paperTypes.updateButton')} />
      </form>
    </Modal>
  );
};

export default EditPaperTypeModal;
