import React from 'react';
import useEffectiveCompany from '../../hooks/useEffectiveCompany';
import { useTranslation } from 'react-i18next';
import { CreateCorrugationClassForm } from '../../types';
import { corrugationClassesApi } from '../../services/api';
import { useModalForm } from '../../hooks/useModalForm';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';

interface CreateCorrugationClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateCorrugationClassModal: React.FC<CreateCorrugationClassModalProps> = ({
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
  } = useModalForm<CreateCorrugationClassForm>({
    onSuccess,
    onClose,
  });

  const onSubmit = handleSubmit((data) => corrugationClassesApi.createCorrugationClass({ ...data, ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}) }));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('corrugationClasses.createTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <Input
          {...register('code', {
            required: t('corrugationClasses.validation.codeRequired'),
            minLength: {
              value: 1,
              message: t('corrugationClasses.validation.codeMinLength'),
            },
            maxLength: {
              value: 50,
              message: t('corrugationClasses.validation.codeMaxLength'),
            },
          })}
          label={t('corrugationClasses.code')}
          placeholder={t('corrugationClasses.codePlaceholder')}
          error={errors.code?.message as string}
        />

        <div>
          <label className="gd-label">
            {t('corrugationClasses.description')}
          </label>
          <textarea
            {...register('description')}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('corrugationClasses.descriptionPlaceholder')}
            rows={3}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message as string}</p>
          )}
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('corrugationClasses.createButton')}
        />
      </form>
    </Modal>
  );
};

export default CreateCorrugationClassModal;
