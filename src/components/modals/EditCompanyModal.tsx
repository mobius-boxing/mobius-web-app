import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Company, CreateCompanyForm } from '../../types';
import { companiesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import ErrorMessage from '../ui/ErrorMessage';
import ModalFooter from '../ui/ModalFooter';
import { useModalForm } from '../../hooks/useModalForm';
import { editCompanySchema } from '../../validation/schemas/company';

interface EditCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
  onSuccess: () => void;
}

const EditCompanyModal: React.FC<EditCompanyModalProps> = ({
  isOpen,
  onClose,
  company,
  onSuccess,
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
  } = useModalForm<CreateCompanyForm>({
    onSuccess,
    onClose,
    schema: editCompanySchema(t),
  });

  useEffect(() => {
    if (isOpen && company) {
      reset({
        name: company.name,
        description: company.description || '',
      });
    }
  }, [isOpen, company, reset]);

  if (!company) return null;

  const onSubmit = handleSubmit((data) =>
    companiesApi.updateCompany(company.uuid, data)
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('companies.editTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <Input
          {...register('name')}
          label={t('companies.name')}
          placeholder={t('companies.namePlaceholder')}
          error={errors.name?.message as string}
        />

        <div>
          <label className="gd-label">
            {t('companies.description')}
          </label>
          <textarea
            {...register('description')}
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
          submitText={t('companies.updateButton')}
        />
      </form>
    </Modal>
  );
};

export default EditCompanyModal;
