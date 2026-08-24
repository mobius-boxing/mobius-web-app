import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GlueType, CreateGlueTypeForm } from '../../types';
import { glueTypesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import ErrorMessage from '../ui/ErrorMessage';
import ModalFooter from '../ui/ModalFooter';
import { useModalForm } from '../../hooks/useModalForm';

interface EditGlueTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  glueType: GlueType | null;
}

const EditGlueTypeModal: React.FC<EditGlueTypeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  glueType,
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
  } = useModalForm<CreateGlueTypeForm>({
    onSuccess,
    onClose,
  });

  useEffect(() => {
    if (isOpen && glueType) {
      reset({
        code: glueType.code,
        description: glueType.description,
      });
    }
  }, [isOpen, glueType, reset]);

  if (!glueType) return null;

  const onSubmit = handleSubmit((data) =>
    glueTypesApi.updateGlueType(glueType.uuid, data)
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('glueTypes.editTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <div>
          <label className="gd-label">
            {t('glueTypes.code')} *
          </label>
          <Input
            {...register('code', {
              required: t('glueTypes.validation.codeRequired'),
            })}
            placeholder={t('glueTypes.codePlaceholder')}
            error={errors.code?.message}
          />
        </div>

        <div>
          <label className="gd-label">
            {t('glueTypes.description')}
          </label>
          <Input
            {...register('description')}
            placeholder={t('glueTypes.descriptionPlaceholder')}
            error={errors.description?.message}
          />
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('glueTypes.updateButton')}
        />
      </form>
    </Modal>
  );
};

export default EditGlueTypeModal;
