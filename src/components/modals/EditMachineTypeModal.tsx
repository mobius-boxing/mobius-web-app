import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MachineType, CreateMachineTypeForm } from '../../types';
import { machineTypesApi } from '../../services/api';
import { useModalForm } from '../../hooks/useModalForm';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ModalFooter } from '../ui/ModalFooter';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  machineType: MachineType | null;
}

const EditMachineTypeModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, machineType }) => {
  const { t } = useTranslation();

  const {
    form: { register, handleSubmit: formSubmit, formState: { errors }, reset },
    loading,
    error,
    handleSubmit,
    handleClose,
  } = useModalForm<CreateMachineTypeForm>({ defaultValues: {}, onSuccess, onClose });

  useEffect(() => {
    if (isOpen && machineType) {
      reset({
        name: machineType.name,
        attribute: machineType.attribute ?? '',
        corrugated: machineType.corrugated,
        generatesSheets: machineType.generatesSheets ?? false,
        requiresDie: machineType.requiresDie,
        requiresPlate: machineType.requiresPlate,
      });
    }
  }, [isOpen, machineType, reset]);

  const onSubmit = handleSubmit((data) =>
    machineTypesApi.updateMachineType(machineType!.uuid, data)
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('machineTypes.editTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={error} />
        <div>
          <label className="gd-label">
            {t('machineTypes.name')} *
          </label>
          <Input
            {...register('name', { required: t('machineTypes.validation.nameRequired') })}
            error={errors.name?.message}
          />
        </div>
        <div>
          <label className="gd-label">
            {t('machineTypes.attribute')}
          </label>
          <Input {...register('attribute')} />
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
        <ModalFooter onCancel={handleClose} loading={loading} submitText={t('machineTypes.editButton')} />
      </form>
    </Modal>
  );
};

export default EditMachineTypeModal;
