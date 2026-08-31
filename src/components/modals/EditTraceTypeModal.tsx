import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TraceType, CreateTraceTypeForm } from '../../types';
import { traceTypesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import ErrorMessage from '../ui/ErrorMessage';
import ModalFooter from '../ui/ModalFooter';
import { useModalForm } from '../../hooks/useModalForm';
import { editTraceTypeSchema } from '../../validation/schemas/traceType';

interface EditTraceTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  traceType: TraceType | null;
}

const EditTraceTypeModal: React.FC<EditTraceTypeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  traceType,
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
  } = useModalForm<CreateTraceTypeForm>({
    onSuccess,
    onClose,
    schema: editTraceTypeSchema(t),
  });

  useEffect(() => {
    if (isOpen && traceType) {
      reset({
        code: traceType.code,
        description: traceType.description ?? '',
      });
    }
  }, [isOpen, traceType, reset]);

  if (!traceType) return null;

  const onSubmit = handleSubmit((data) =>
    traceTypesApi.updateTraceType(traceType.uuid, data)
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('traceTypes.editTitle')}>
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
          submitText={t('traceTypes.updateButton')}
        />
      </form>
    </Modal>
  );
};

export default EditTraceTypeModal;
