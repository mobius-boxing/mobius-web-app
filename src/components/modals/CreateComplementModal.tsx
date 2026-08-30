import React from 'react';
import { useTranslation } from 'react-i18next';
import { CreateComplementForm } from '../../types';
import { complementsApi } from '../../services/api';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import { useModalForm } from '../../hooks/useModalForm';
import { createComplementSchema } from '../../validation/schemas/complement';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';

interface CreateComplementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateComplementModal: React.FC<CreateComplementModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();

  const {
    form: {
      register,
      handleSubmit: formSubmit,
      formState: { errors },
    },
    loading,
    error,
    handleSubmit,
    handleClose,
  } = useModalForm<CreateComplementForm>({
    defaultValues: {},
    onSuccess,
    onClose,
    schema: createComplementSchema(t),
  });

  const onSubmit = handleSubmit((data) =>
    complementsApi.createComplement({
      ...data,
      companyId: effectiveCompanyId,
    })
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('complements.createTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <div>
          <label className="gd-label">
            {t('complements.code')} *
          </label>
          <Input
            {...register('code')}
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
          submitText={t('complements.createButton')}
        />
      </form>
    </Modal>
  );
};

export default CreateComplementModal;
