import React from 'react';
import useEffectiveCompany from '../../hooks/useEffectiveCompany';
import { useTranslation } from 'react-i18next';
import { CreateManufacturerForm } from '../../types';
import { manufacturersApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { useModalForm } from '../../hooks/useModalForm';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';

interface CreateManufacturerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateManufacturerModal: React.FC<CreateManufacturerModalProps> = ({
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
  } = useModalForm<CreateManufacturerForm>({
    onSuccess,
    onClose,
  });

  const onSubmit = handleSubmit((data) => manufacturersApi.createManufacturer({ ...data, ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}) }));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('manufacturers.createTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <div>
          <label className="gd-label">
            {t('manufacturers.code')} *
          </label>
          <Input
            {...register('code', {
              required: t('manufacturers.validation.codeRequired'),
            })}
            placeholder={t('manufacturers.codePlaceholder')}
            error={errors.code?.message}
          />
        </div>

        <div>
          <label className="gd-label">
            {t('manufacturers.name')} *
          </label>
          <Input
            {...register('name', {
              required: t('manufacturers.validation.nameRequired'),
            })}
            placeholder={t('manufacturers.namePlaceholder')}
            error={errors.name?.message}
          />
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('manufacturers.createButton')}
        />
      </form>
    </Modal>
  );
};

export default CreateManufacturerModal;
