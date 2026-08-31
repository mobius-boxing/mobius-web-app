import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FscType, CreateFscTypeForm } from '../../types';
import { fscTypesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import ErrorMessage from '../ui/ErrorMessage';
import ModalFooter from '../ui/ModalFooter';
import { useModalForm } from '../../hooks/useModalForm';
import { editFscTypeSchema } from '../../validation/schemas/fscType';

interface EditFscTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  fscType: FscType | null;
}

const EditFscTypeModal: React.FC<EditFscTypeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  fscType,
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
  } = useModalForm<CreateFscTypeForm>({
    onSuccess,
    onClose,
    schema: editFscTypeSchema(t),
  });

  useEffect(() => {
    if (isOpen && fscType) {
      reset({
        code: fscType.code,
        description: fscType.description ?? '',
      });
    }
  }, [isOpen, fscType, reset]);

  if (!fscType) return null;

  const onSubmit = handleSubmit((data) =>
    fscTypesApi.updateFscType(fscType.uuid, data)
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('fscTypes.editTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <div>
          <label className="gd-label">
            {t('fscTypes.code')} *
          </label>
          <Input
            {...register('code')}
            placeholder={t('fscTypes.codePlaceholder')}
            error={errors.code?.message}
          />
        </div>

        <div>
          <label className="gd-label">
            {t('fscTypes.description')}
          </label>
          <Input
            {...register('description')}
            placeholder={t('fscTypes.descriptionPlaceholder')}
            error={errors.description?.message}
          />
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('fscTypes.updateButton')}
        />
      </form>
    </Modal>
  );
};

export default EditFscTypeModal;
