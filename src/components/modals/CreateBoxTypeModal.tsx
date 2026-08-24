import React from 'react';
import { useTranslation } from 'react-i18next';
import { CreateBoxTypeForm } from '../../types';
import { boxTypesApi } from '../../services/api';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import { useModalForm } from '../../hooks/useModalForm';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';

interface CreateBoxTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateBoxTypeModal: React.FC<CreateBoxTypeModalProps> = ({
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
  } = useModalForm<CreateBoxTypeForm>({
    defaultValues: {},
    onSuccess,
    onClose,
  });

  const onSubmit = handleSubmit((data) =>
    boxTypesApi.createBoxType({
      ...data,
      companyId: effectiveCompanyId,
    })
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('boxTypes.createTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <div>
          <label className="gd-label">
            {t('boxTypes.code')} *
          </label>
          <Input
            {...register('code', {
              required: t('boxTypes.validation.codeRequired'),
            })}
            placeholder={t('boxTypes.codePlaceholder')}
            error={errors.code?.message}
          />
        </div>

        <div>
          <label className="gd-label">
            {t('boxTypes.name')} *
          </label>
          <Input
            {...register('name', {
              required: t('boxTypes.validation.nameRequired'),
            })}
            placeholder={t('boxTypes.namePlaceholder')}
            error={errors.name?.message}
          />
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('boxTypes.createButton')}
        />
      </form>
    </Modal>
  );
};

export default CreateBoxTypeModal;
