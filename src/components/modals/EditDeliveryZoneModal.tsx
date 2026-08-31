import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DeliveryZone, CreateDeliveryZoneForm } from '../../types';
import { deliveryZonesApi } from '../../services/api';
import { useModalForm } from '../../hooks/useModalForm';
import { editDeliveryZoneSchema } from '../../validation/schemas/deliveryZone';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import ErrorMessage from '../ui/ErrorMessage';
import ModalFooter from '../ui/ModalFooter';

interface EditDeliveryZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveryZone: DeliveryZone | null;
  onSuccess: () => void;
}

const EditDeliveryZoneModal: React.FC<EditDeliveryZoneModalProps> = ({
  isOpen,
  onClose,
  deliveryZone,
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
  } = useModalForm<CreateDeliveryZoneForm>({
    onSuccess,
    onClose,
    schema: editDeliveryZoneSchema(t),
  });

  useEffect(() => {
    if (isOpen && deliveryZone) {
      reset({
        code: deliveryZone.code || '',
        description: deliveryZone.description || '',
      });
    }
  }, [isOpen, deliveryZone, reset]);

  if (!deliveryZone) return null;

  const onSubmit = handleSubmit(async (data) => {
    await deliveryZonesApi.updateDeliveryZone(deliveryZone.uuid, data);
  });

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('deliveryZones.editTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <div>
          <label className="gd-label">
            {t('deliveryZones.code')} *
          </label>
          <Input
            {...register('code')}
            placeholder={t('deliveryZones.codePlaceholder')}
            error={errors.code?.message}
          />
        </div>

        <div>
          <label className="gd-label">
            {t('deliveryZones.description')}
          </label>
          <Input
            {...register('description')}
            placeholder={t('deliveryZones.descriptionPlaceholder')}
            error={errors.description?.message}
          />
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('deliveryZones.updateButton')}
        />
      </form>
    </Modal>
  );
};

export default EditDeliveryZoneModal;
