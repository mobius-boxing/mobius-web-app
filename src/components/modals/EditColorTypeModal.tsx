import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ColorType, CreateColorTypeForm } from '../../types';
import { colorTypesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import ErrorMessage from '../ui/ErrorMessage';
import ModalFooter from '../ui/ModalFooter';
import { useModalForm } from '../../hooks/useModalForm';

interface EditColorTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  colorType: ColorType | null;
}

const EditColorTypeModal: React.FC<EditColorTypeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  colorType,
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
  } = useModalForm<CreateColorTypeForm>({
    onSuccess,
    onClose,
  });

  useEffect(() => {
    if (isOpen && colorType) {
      reset({
        name: colorType.name,
        description: colorType.description,
      });
    }
  }, [isOpen, colorType, reset]);

  if (!colorType) return null;

  const onSubmit = handleSubmit((data) =>
    colorTypesApi.updateColorType(colorType.uuid, data)
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('colorTypes.editTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <div>
          <label className="gd-label">
            {t('colorTypes.name')} *
          </label>
          <Input
            {...register('name', {
              required: t('colorTypes.validation.nameRequired'),
            })}
            placeholder={t('colorTypes.namePlaceholder')}
            error={errors.name?.message}
          />
        </div>

        <div>
          <label className="gd-label">
            {t('colorTypes.description')}
          </label>
          <Input
            {...register('description')}
            placeholder={t('colorTypes.descriptionPlaceholder')}
            error={errors.description?.message}
          />
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('colorTypes.updateButton')}
        />
      </form>
    </Modal>
  );
};

export default EditColorTypeModal;
