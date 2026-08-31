import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StrappingType, CreateStrappingTypeForm } from '../../types';
import { strappingTypesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import ErrorMessage from '../ui/ErrorMessage';
import ModalFooter from '../ui/ModalFooter';
import { useModalForm } from '../../hooks/useModalForm';
import { editStrappingTypeSchema } from '../../validation/schemas/strappingType';

interface EditStrappingTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  strappingType: StrappingType | null;
}

const EditStrappingTypeModal: React.FC<EditStrappingTypeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  strappingType,
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
  } = useModalForm<CreateStrappingTypeForm>({
    onSuccess,
    onClose,
    schema: editStrappingTypeSchema(t),
  });

  useEffect(() => {
    if (isOpen && strappingType) {
      reset({
        code: strappingType.code,
        description: strappingType.description ?? '',
      });
    }
  }, [isOpen, strappingType, reset]);

  if (!strappingType) return null;

  const onSubmit = handleSubmit((data) =>
    strappingTypesApi.updateStrappingType(strappingType.uuid, data)
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('strappingTypes.editTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <div>
          <label className="gd-label">
            {t('strappingTypes.code')} *
          </label>
          <Input
            {...register('code')}
            placeholder={t('strappingTypes.codePlaceholder')}
            error={errors.code?.message}
          />
        </div>

        <div>
          <label className="gd-label">
            {t('strappingTypes.description')}
          </label>
          <Input
            {...register('description')}
            placeholder={t('strappingTypes.descriptionPlaceholder')}
            error={errors.description?.message}
          />
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('strappingTypes.updateButton')}
        />
      </form>
    </Modal>
  );
};

export default EditStrappingTypeModal;
