import React from 'react';
import { useTranslation } from 'react-i18next';
import { CreateTraceTypeForm } from '../../types';
import { traceTypesApi } from '../../services/api';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import { useModalForm } from '../../hooks/useModalForm';
import { createTraceTypeSchema } from '../../validation/schemas/traceType';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';

interface CreateTraceTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateTraceTypeModal: React.FC<CreateTraceTypeModalProps> = ({
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
  } = useModalForm<CreateTraceTypeForm>({
    defaultValues: {},
    onSuccess,
    onClose,
    schema: createTraceTypeSchema(t),
  });

  const onSubmit = handleSubmit((data) =>
    traceTypesApi.createTraceType({
      ...data,
      companyId: effectiveCompanyId,
    })
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('traceTypes.createTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <div>
          <label className="gd-label">
            {t('traceTypes.code')} *
          </label>
          <Input
            {...register('code')}
            placeholder={t('traceTypes.codePlaceholder')}
            error={errors.code?.message}
          />
        </div>

        <div>
          <label className="gd-label">
            {t('traceTypes.description')}
          </label>
          <Input
            {...register('description')}
            placeholder={t('traceTypes.descriptionPlaceholder')}
            error={errors.description?.message}
          />
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('traceTypes.createButton')}
        />
      </form>
    </Modal>
  );
};

export default CreateTraceTypeModal;
