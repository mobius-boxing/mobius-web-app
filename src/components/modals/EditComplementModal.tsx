import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Complement, CreateComplementForm } from '../../types';
import { complementsApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import ErrorMessage from '../ui/ErrorMessage';
import ModalFooter from '../ui/ModalFooter';
import { useModalForm } from '../../hooks/useModalForm';

interface EditComplementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  complement: Complement | null;
}

const EditComplementModal: React.FC<EditComplementModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  complement,
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
  } = useModalForm<CreateComplementForm>({
    onSuccess,
    onClose,
  });

  useEffect(() => {
    if (isOpen && complement) {
      reset({
        code: complement.code,
        description: complement.description,
      });
    }
  }, [isOpen, complement, reset]);

  if (!complement) return null;

  const onSubmit = handleSubmit((data) =>
    complementsApi.updateComplement(complement.uuid, data)
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('complements.editTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <div>
          <label className="gd-label">
            {t('complements.code')} *
          </label>
          <Input
            {...register('code', {
              required: t('complements.validation.codeRequired'),
            })}
            placeholder={t('complements.codePlaceholder')}
            error={errors.code?.message}
          />
        </div>

        <div>
          <label className="gd-label">
            {t('complements.description')}
          </label>
          <Input
            {...register('description')}
            placeholder={t('complements.descriptionPlaceholder')}
            error={errors.description?.message}
          />
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('complements.updateButton')}
        />
      </form>
    </Modal>
  );
};

export default EditComplementModal;
