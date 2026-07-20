import React from 'react';
import { useTranslation } from 'react-i18next';
import { CreateDeliveryZoneForm } from '../../types';
import { deliveryZonesApi } from '../../services/api';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import { useModalForm } from '../../hooks/useModalForm';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';

interface CreateDeliveryZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateDeliveryZoneModal: React.FC<CreateDeliveryZoneModalProps> = ({
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
  } = useModalForm<CreateDeliveryZoneForm>({
    defaultValues: {},
    onSuccess,
    onClose,
  });

  const onSubmit = handleSubmit((data) =>
    deliveryZonesApi.createDeliveryZone({
      ...data,
      // superAdmin: company comes from the selector; others resolved from JWT.
      companyId: effectiveCompanyId,
    } as CreateDeliveryZoneForm & { companyId?: string })
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('deliveryZones.createTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('deliveryZones.code')} *
          </label>
          <Input
            {...register('code', {
              required: t('deliveryZones.validation.codeRequired'),
            })}
            placeholder={t('deliveryZones.codePlaceholder')}
            error={errors.code?.message}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
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
          submitText={t('deliveryZones.createButton')}
        />
      </form>
    </Modal>
  );
};

export default CreateDeliveryZoneModal;
