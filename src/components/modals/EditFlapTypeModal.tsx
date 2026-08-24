import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FlapType, CreateFlapTypeForm } from '../../types';
import { flapTypesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import ErrorMessage from '../ui/ErrorMessage';
import ModalFooter from '../ui/ModalFooter';
import { useModalForm } from '../../hooks/useModalForm';

interface EditFlapTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  flapType: FlapType | null;
}

const EditFlapTypeModal: React.FC<EditFlapTypeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  flapType,
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
  } = useModalForm<CreateFlapTypeForm>({
    onSuccess,
    onClose,
  });

  useEffect(() => {
    if (isOpen && flapType) {
      reset({
        code: flapType.code,
        description: flapType.description,
      });
    }
  }, [isOpen, flapType, reset]);

  if (!flapType) return null;

  const onSubmit = handleSubmit((data) =>
    flapTypesApi.updateFlapType(flapType.uuid, data)
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('flapTypes.editTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <div>
          <label className="gd-label">
            {t('flapTypes.code')} *
          </label>
          <Input
            {...register('code', {
              required: t('flapTypes.validation.codeRequired'),
            })}
            placeholder={t('flapTypes.codePlaceholder')}
            error={errors.code?.message}
          />
        </div>

        <div>
          <label className="gd-label">
            {t('flapTypes.description')}
          </label>
          <Input
            {...register('description')}
            placeholder={t('flapTypes.descriptionPlaceholder')}
            error={errors.description?.message}
          />
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('flapTypes.updateButton')}
        />
      </form>
    </Modal>
  );
};

export default EditFlapTypeModal;
