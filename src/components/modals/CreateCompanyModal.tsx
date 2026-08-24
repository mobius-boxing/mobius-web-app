import React from 'react';
import { useTranslation } from 'react-i18next';
import { CreateCompanyForm } from '../../types';
import { companiesApi } from '../../services/api';
import { useModalForm } from '../../hooks/useModalForm';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';

interface CreateCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateCompanyModal: React.FC<CreateCompanyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
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
  } = useModalForm<CreateCompanyForm>({
    onSuccess,
    onClose,
  });

  const onSubmit = handleSubmit((data) => companiesApi.createCompany(data));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('companies.createTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <Input
          {...register('name', {
            required: t('companies.validation.nameRequired'),
            minLength: {
              value: 2,
              message: t('companies.validation.nameMinLength'),
            },
            maxLength: {
              value: 100,
              message: t('companies.validation.nameMaxLength'),
            },
          })}
          label={t('companies.name')}
          placeholder={t('companies.namePlaceholder')}
          error={errors.name?.message as string}
        />

        <div>
          <label className="gd-label">
            {t('companies.description')}
          </label>
          <textarea
            {...register('description', {
              maxLength: {
                value: 500,
                message: t('companies.validation.descriptionMaxLength'),
              },
            })}
            rows={3}
            placeholder={t('companies.descriptionPlaceholder')}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message as string}</p>
          )}
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('companies.createButton')}
        />
      </form>
    </Modal>
  );
};

export default CreateCompanyModal;
