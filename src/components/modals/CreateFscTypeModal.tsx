import React from 'react';
import { useTranslation } from 'react-i18next';
import { CreateFscTypeForm } from '../../types';
import { fscTypesApi } from '../../services/api';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import { useModalForm } from '../../hooks/useModalForm';
import { createFscTypeSchema } from '../../validation/schemas/fscType';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';

interface CreateFscTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateFscTypeModal: React.FC<CreateFscTypeModalProps> = ({
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
  } = useModalForm<CreateFscTypeForm>({
    defaultValues: {},
    onSuccess,
    onClose,
    schema: createFscTypeSchema(t),
  });

  const onSubmit = handleSubmit((data) =>
    fscTypesApi.createFscType({
      ...data,
      companyId: effectiveCompanyId,
    })
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('fscTypes.createTitle')}>
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
          submitText={t('fscTypes.createButton')}
        />
      </form>
    </Modal>
  );
};

export default CreateFscTypeModal;
