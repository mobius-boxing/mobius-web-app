import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FscType, CreateFscTypeForm } from '../../types';
import { fscTypesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import ErrorMessage from '../ui/ErrorMessage';
import ModalFooter from '../ui/ModalFooter';
import { useModalForm } from '../../hooks/useModalForm';

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
  });

  useEffect(() => {
    if (isOpen && fscType) {
      reset({
        code: fscType.code,
        description: fscType.description,
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
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('fscTypes.code')} *
          </label>
          <Input
            {...register('code', {
              required: t('fscTypes.validation.codeRequired'),
            })}
            placeholder={t('fscTypes.codePlaceholder')}
            error={errors.code?.message}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
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
