import React from 'react';
import { useTranslation } from 'react-i18next';
import { CreateProductTypeForm } from '../../types';
import { productTypesApi } from '../../services/api';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import { useModalForm } from '../../hooks/useModalForm';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';

interface CreateProductTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateProductTypeModal: React.FC<CreateProductTypeModalProps> = ({
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
  } = useModalForm<CreateProductTypeForm>({
    defaultValues: {},
    onSuccess,
    onClose,
  });

  const onSubmit = handleSubmit((data) =>
    productTypesApi.createProductType({
      ...data,
      companyId: effectiveCompanyId,
    })
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('productTypes.createTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <div>
          <label className="gd-label">
            {t('productTypes.code')} *
          </label>
          <Input
            {...register('code', {
              required: t('productTypes.validation.codeRequired'),
            })}
            placeholder={t('productTypes.codePlaceholder')}
            error={errors.code?.message}
          />
        </div>

        <div>
          <label className="gd-label">
            {t('productTypes.name')} *
          </label>
          <Input
            {...register('name', {
              required: t('productTypes.validation.nameRequired'),
            })}
            placeholder={t('productTypes.namePlaceholder')}
            error={errors.name?.message}
          />
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('productTypes.createButton')}
        />
      </form>
    </Modal>
  );
};

export default CreateProductTypeModal;
