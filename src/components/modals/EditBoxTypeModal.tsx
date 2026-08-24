import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BoxType, CreateBoxTypeForm } from '../../types';
import { boxTypesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import ErrorMessage from '../ui/ErrorMessage';
import ModalFooter from '../ui/ModalFooter';
import { useModalForm } from '../../hooks/useModalForm';

interface EditBoxTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  boxType: BoxType | null;
}

const EditBoxTypeModal: React.FC<EditBoxTypeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  boxType,
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
  } = useModalForm<CreateBoxTypeForm>({
    onSuccess,
    onClose,
  });

  useEffect(() => {
    if (isOpen && boxType) {
      reset({
        code: boxType.code,
        name: boxType.name,
      });
    }
  }, [isOpen, boxType, reset]);

  if (!boxType) return null;

  const onSubmit = handleSubmit((data) =>
    boxTypesApi.updateBoxType(boxType.uuid, data)
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('boxTypes.editTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <div>
          <label className="gd-label">
            {t('boxTypes.code')} *
          </label>
          <Input
            {...register('code', {
              required: t('boxTypes.validation.codeRequired'),
            })}
            placeholder={t('boxTypes.codePlaceholder')}
            error={errors.code?.message}
          />
        </div>

        <div>
          <label className="gd-label">
            {t('boxTypes.name')} *
          </label>
          <Input
            {...register('name', {
              required: t('boxTypes.validation.nameRequired'),
            })}
            placeholder={t('boxTypes.namePlaceholder')}
            error={errors.name?.message}
          />
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('boxTypes.updateButton')}
        />
      </form>
    </Modal>
  );
};

export default EditBoxTypeModal;
