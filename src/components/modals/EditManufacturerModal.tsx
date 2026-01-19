import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useModalForm } from '../../hooks/useModalForm';
import { Manufacturer, CreateManufacturerForm } from '../../types';
import { manufacturersApi } from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';

interface EditManufacturerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  manufacturer: Manufacturer | null;
}

const EditManufacturerModal: React.FC<EditManufacturerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  manufacturer,
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
  } = useModalForm<CreateManufacturerForm>({
    onSuccess,
    onClose,
  });

  useEffect(() => {
    if (isOpen && manufacturer) {
      reset({
        code: manufacturer.code,
        name: manufacturer.name,
      });
    }
  }, [isOpen, manufacturer, reset]);

  const onSubmit = handleSubmit(async (data) => {
    if (!manufacturer) return;
    await manufacturersApi.updateManufacturer(manufacturer.uuid, data);
  });

  if (!manufacturer) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('manufacturers.editTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
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
          <label className="block text-sm font-medium text-secondary-700 mb-1">
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

        <ModalFooter loading={loading} onCancel={handleClose} submitText={t('manufacturers.updateButton')} />
      </form>
    </Modal>
  );
};

export default EditManufacturerModal;
