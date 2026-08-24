import React from 'react';
import { useTranslation } from 'react-i18next';
import { CreateStrappingTypeForm } from '../../types';
import { strappingTypesApi } from '../../services/api';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import { useModalForm } from '../../hooks/useModalForm';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';

interface CreateStrappingTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateStrappingTypeModal: React.FC<CreateStrappingTypeModalProps> = ({
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
  } = useModalForm<CreateStrappingTypeForm>({
    defaultValues: {},
    onSuccess,
    onClose,
  });

  const onSubmit = handleSubmit((data) =>
    strappingTypesApi.createStrappingType({
      ...data,
      companyId: effectiveCompanyId,
    })
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('strappingTypes.createTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <div>
          <label className="gd-label">
            {t('strappingTypes.code')} *
          </label>
          <Input
            {...register('code', {
              required: t('strappingTypes.validation.codeRequired'),
            })}
            placeholder={t('strappingTypes.codePlaceholder')}
            error={errors.code?.message}
          />
        </div>

        <div>
          <label className="gd-label">
            {t('strappingTypes.description')}
          </label>
          <Input
            {...register('description')}
            placeholder={t('strappingTypes.descriptionPlaceholder')}
            error={errors.description?.message}
          />
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('strappingTypes.createButton')}
        />
      </form>
    </Modal>
  );
};

export default CreateStrappingTypeModal;
