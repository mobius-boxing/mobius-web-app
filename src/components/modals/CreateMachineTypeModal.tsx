import React from 'react';
import { useTranslation } from 'react-i18next';
import { CreateMachineTypeForm } from '../../types';
import { machineTypesApi } from '../../services/api';
import { useEffectiveCompany } from '../../hooks/useEffectiveCompany';
import { useModalForm } from '../../hooks/useModalForm';
import { createMachineTypeSchema } from '../../validation/schemas/machineType';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateMachineTypeModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();

  const {
    form: { register, handleSubmit: formSubmit, formState: { errors } },
    loading,
    error,
    handleSubmit,
    handleClose,
  } = useModalForm<CreateMachineTypeForm>({ defaultValues: {}, onSuccess, onClose, schema: createMachineTypeSchema(t) });

  const onSubmit = handleSubmit((data) =>
    machineTypesApi.createMachineType({ ...data, companyId: effectiveCompanyId })
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('machineTypes.createTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />
        <div>
          <label className="gd-label">
            {t('machineTypes.name')} *
          </label>
          <Input
            {...register('name')}
            error={errors.name?.message as string}
            placeholder={t('machineTypes.namePlaceholder')}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>
        <div>
          <label className="gd-label">
            {t('machineTypes.attribute')}
          </label>
          <Input {...register('attribute')} error={errors.attribute?.message as string} placeholder={t('machineTypes.attributePlaceholder')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-sm text-secondary-700">
            <input type="checkbox" {...register('corrugated')} />
            {t('machineTypes.corrugated')}
          </label>
          <label className="flex items-center gap-2 text-sm text-secondary-700">
            <input type="checkbox" {...register('generatesSheets')} />
            {t('machineTypes.generatesSheets')}
          </label>
          <label className="flex items-center gap-2 text-sm text-secondary-700">
            <input type="checkbox" {...register('requiresDie')} />
            {t('machineTypes.requiresDie')}
          </label>
          <label className="flex items-center gap-2 text-sm text-secondary-700">
            <input type="checkbox" {...register('requiresPlate')} />
            {t('machineTypes.requiresPlate')}
          </label>
        </div>
        <ModalFooter onCancel={handleClose} loading={loading} submitText={t("machineTypes.createButton")} />
      </form>
    </Modal>
  );
};

export default CreateMachineTypeModal;
