import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CorrugationClass, CreateCorrugationClassForm } from '../../types';
import { corrugationClassesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import ErrorMessage from '../ui/ErrorMessage';
import ModalFooter from '../ui/ModalFooter';
import { useModalForm } from '../../hooks/useModalForm';
import { editCorrugationClassSchema } from '../../validation/schemas/corrugationClass';

interface EditCorrugationClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  corrugationClass: CorrugationClass | null;
  onSuccess: () => void;
}

const EditCorrugationClassModal: React.FC<EditCorrugationClassModalProps> = ({
  isOpen,
  onClose,
  corrugationClass,
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
  } = useModalForm<CreateCorrugationClassForm>({
    onSuccess,
    onClose,
    schema: editCorrugationClassSchema(t),
  });

  useEffect(() => {
    if (isOpen && corrugationClass) {
      reset({
        code: corrugationClass.code,
        description: corrugationClass.description || '',
      });
    }
  }, [isOpen, corrugationClass, reset]);

  if (!corrugationClass) return null;

  const onSubmit = handleSubmit((data) =>
    // SECURITY: Use UUID, not numeric ID
    corrugationClassesApi.updateCorrugationClass(corrugationClass.uuid, data)
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('corrugationClasses.editTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <Input
          {...register('code')}
          label={t('corrugationClasses.code')}
          placeholder={t('corrugationClasses.codePlaceholder')}
          error={errors.code?.message as string}
        />

        <div>
          <label className="gd-label">
            {t('corrugationClasses.description')}
          </label>
          <textarea
            {...register('description')}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('corrugationClasses.descriptionPlaceholder')}
            rows={3}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message as string}</p>
          )}
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('corrugationClasses.updateButton')}
        />
      </form>
    </Modal>
  );
};

export default EditCorrugationClassModal;
