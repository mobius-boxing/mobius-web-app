import React from 'react';
import { useTranslation } from 'react-i18next';
import { CreateGlueTypeForm } from '../../types';
import { glueTypesApi } from '../../services/api';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import { useModalForm } from '../../hooks/useModalForm';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';

interface CreateGlueTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateGlueTypeModal: React.FC<CreateGlueTypeModalProps> = ({
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
  } = useModalForm<CreateGlueTypeForm>({
    defaultValues: {},
    onSuccess,
    onClose,
  });

  const onSubmit = handleSubmit((data) =>
    glueTypesApi.createGlueType({
      ...data,
      companyId: effectiveCompanyId,
    })
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('glueTypes.createTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />

        <div>
          <label className="gd-label">
            {t('glueTypes.code')} *
          </label>
          <Input
            {...register('code', {
              required: t('glueTypes.validation.codeRequired'),
            })}
            placeholder={t('glueTypes.codePlaceholder')}
            error={errors.code?.message}
          />
        </div>

        <div>
          <label className="gd-label">
            {t('glueTypes.description')}
          </label>
          <Input
            {...register('description')}
            placeholder={t('glueTypes.descriptionPlaceholder')}
            error={errors.description?.message}
          />
        </div>

        <ModalFooter
          loading={loading}
          onCancel={handleClose}
          submitText={t('glueTypes.createButton')}
        />
      </form>
    </Modal>
  );
};

export default CreateGlueTypeModal;
