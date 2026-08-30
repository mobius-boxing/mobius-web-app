import React from 'react';
import useEffectiveCompany from '../../hooks/useEffectiveCompany';
import { useTranslation } from 'react-i18next';
import { CreatePaperTypeForm } from '../../types';
import { paperTypesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { useModalForm } from '../../hooks/useModalForm';
import { createPaperTypeSchema } from '../../validation/schemas/paperType';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';

interface CreatePaperTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreatePaperTypeModal: React.FC<CreatePaperTypeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { effectiveCompanyId } = useEffectiveCompany();
  const { t } = useTranslation();

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
  } = useModalForm<CreatePaperTypeForm>({
    onSuccess,
    onClose,
    schema: createPaperTypeSchema(t),
  });

  const onSubmit = handleSubmit((data) => paperTypesApi.createPaperType({ ...data, ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}) }));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('paperTypes.createTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <Input
          {...register('code')}
          label={t('paperTypes.code')}
          placeholder={t('paperTypes.codePlaceholder')}
          error={errors.code?.message as string}
        />

        <div>
          <label className="gd-label">
            {t('paperTypes.description')}
          </label>
          <textarea
            {...register('description')}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('paperTypes.descriptionPlaceholder')}
            rows={3}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message as string}</p>
          )}
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('paperTypes.createButton')}
        />
      </form>
    </Modal>
  );
};

export default CreatePaperTypeModal;
